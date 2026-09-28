import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { UserProfile, Candidate, UserRole, OperatorUser } from '../types';
import {
  getUserProfile,
  checkIsAdmin,
  getCandidateByUid,
  hasAnyAdmin,
  registerAdminUser,
  getAvailableExamDates,
  getAvailableExamCenters,
  findCandidateForAuth,
  findAdminForAuth,
  findOperatorForAuth,
  getOperatorById,
  updateOperatorCredits,
  createOperatorUser,
} from '../services/apiService';
import {
  persistCandidateRegistration,
  persistOperatorRegistration,
  verifyCredentialsStrict,
} from '../services/credentialService';
import { generateCandidateId } from '../utils/rules';

const SESSION_STORAGE_KEY = 'takamul_candidate_portal_auth_session';

interface CandidateRegisterInput {
  email: string;
  password: string;
  fullName: string;
  mobileNumber: string;
  passportNumber?: string;
  trade?: string;
  dateOfBirth?: string;
  candidateId?: string;
}

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  candidate: Candidate | null;
  operator: OperatorUser | null;
  role: UserRole | null;
  isAdmin: boolean;
  isCandidate: boolean;
  isOperator: boolean;
  operatorCredits: number;
  isLoading: boolean;
  hasAdminSetup: boolean;
  login: (email: string, password: string) => Promise<'admin' | 'operator' | 'candidate'>;
  loginCandidateDirect: (cand: Candidate) => void;
  loginOperatorDirect: (op: OperatorUser) => void;
  updateCurrentCandidate: (cand: Candidate) => void;
  registerCandidate: (data: CandidateRegisterInput) => Promise<void>;
  registerOperator: (data: {
    email: string;
    password: string;
    fullName: string;
    phoneNumber: string;
    agencyName?: string;
  }) => Promise<OperatorUser>;
  setupFirstAdmin: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshCandidate: () => Promise<void>;
  refreshOperatorData: () => Promise<void>;
  deductOperatorCredit: (
    actionType: 'RESCHEDULE' | 'MARKSHEET',
    details: { candidateId?: string; candidateName?: string; description: string }
  ) => Promise<void>;
  checkAdminExistence: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [operator, setOperator] = useState<OperatorUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasAdminSetup, setHasAdminSetup] = useState<boolean>(true);

  const checkAdminExistence = async () => {
    try {
      const exists = await hasAnyAdmin();
      setHasAdminSetup(exists);
    } catch {
      setHasAdminSetup(true);
    }
  };

  const loadUserData = async (firebaseUser: FirebaseUser) => {
    try {
      const isAdminUser = await checkIsAdmin(firebaseUser.uid);
      const profile = await getUserProfile(firebaseUser.uid);

      if (isAdminUser) {
        setUserProfile(profile || {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          role: 'admin',
          createdAt: new Date().toISOString(),
        });
        setCandidate(null);
      } else {
        setUserProfile(profile || {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          role: 'candidate',
          createdAt: new Date().toISOString(),
        });
        const candData = await getCandidateByUid(firebaseUser.uid);
        setCandidate(candData);
      }
    } catch (error) {
      console.error('Failed to load user profile in AuthContext:', error);
    }
  };

  useEffect(() => {
    checkAdminExistence();

    let isMounted = true;

    async function initSession() {
      // 1. Try restoring persistent session from storage
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        try {
          const session = JSON.parse(stored);
          if (session.type === 'candidate') {
            const lookupId = session.uid || session.identifier || session.email;
            const cand = await getCandidateByUid(lookupId) || await findCandidateForAuth(lookupId);
            if (cand && isMounted) {
              setCandidate(cand);
              const profile: UserProfile = {
                uid: cand.uid || cand.id,
                email: cand.email,
                role: 'candidate',
                fullName: cand.fullName,
                candidateId: cand.candidateId,
                createdAt: cand.createdAt,
              };
              setUserProfile(profile);
              setCurrentUser({
                uid: cand.uid || cand.id,
                email: cand.email,
                displayName: cand.fullName,
              } as unknown as FirebaseUser);
              setIsLoading(false);
              return;
            }
          } else if (session.type === 'admin') {
            const adminLookup = session.email || session.uid || session.identifier;
            const adminProf = await findAdminForAuth(adminLookup);
            if (adminProf && isMounted) {
              setUserProfile(adminProf);
              setCandidate(null);
              setOperator(null);
              setCurrentUser({
                uid: adminProf.uid,
                email: adminProf.email,
                displayName: adminProf.fullName || 'Administrator',
              } as unknown as FirebaseUser);
              setIsLoading(false);
              return;
            }
          } else if (session.type === 'operator') {
            const opLookup = session.uid || session.email || session.identifier;
            const opUser = (await getOperatorById(opLookup)) || (await findOperatorForAuth(opLookup));
            if (opUser && isMounted) {
              setOperator(opUser);
              setCandidate(null);
              const profile: UserProfile = {
                uid: opUser.uid,
                email: opUser.email,
                role: 'operator',
                fullName: opUser.fullName,
                createdAt: opUser.createdAt,
              };
              setUserProfile(profile);
              setCurrentUser({
                uid: opUser.uid,
                email: opUser.email,
                displayName: opUser.fullName,
              } as unknown as FirebaseUser);
              setIsLoading(false);
              return;
            }
          }
        } catch (e) {
          console.error('Error parsing stored session:', e);
        }
      }

      // 2. Firebase Auth state listener
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!isMounted) return;
        if (firebaseUser) {
          setCurrentUser(firebaseUser);
          await loadUserData(firebaseUser);
        } else {
          const curStored = localStorage.getItem(SESSION_STORAGE_KEY);
          if (!curStored) {
            setCurrentUser(null);
            setUserProfile(null);
            setCandidate(null);
          }
        }
        setIsLoading(false);
      });

      return () => {
        isMounted = false;
        unsubscribe();
      };
    }

    initSession();
  }, []);

  const login = async (identifier: string, password: string) => {
    setIsLoading(true);
    const cleanIdentifier = identifier.trim();
    const cleanPassword = password.trim();

    if (!cleanIdentifier) {
      setIsLoading(false);
      throw new Error('অনুগ্রহ করে ইমেইল বা ইউজারনেম লিখুন (Please enter your email or username).');
    }

    if (!cleanPassword) {
      setIsLoading(false);
      throw new Error('অনুগ্রহ করে পাসওয়ার্ড লিখুন (Please enter your password).');
    }

    try {
      // 1. Strictly verify credentials against registered users & password
      const verifyResult = await verifyCredentialsStrict(cleanIdentifier, cleanPassword);

      if (!verifyResult.success) {
        throw new Error(verifyResult.error || 'লগইন ব্যর্থ হয়েছে। সঠিক ইমেইল ও পাসওয়ার্ড প্রদান করুন।');
      }

      // 2. Handle Operator Login
      if (verifyResult.role === 'operator') {
        const opUser = verifyResult.user as OperatorUser;
        const opProfile: UserProfile = {
          uid: opUser.uid || opUser.id,
          email: opUser.email,
          role: 'operator',
          fullName: opUser.fullName,
          createdAt: opUser.createdAt,
        };
        const mockUser = {
          uid: opUser.uid || opUser.id,
          email: opUser.email,
          displayName: opUser.fullName,
        } as unknown as FirebaseUser;

        setCurrentUser(mockUser);
        setUserProfile(opProfile);
        setOperator(opUser);
        setCandidate(null);

        localStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify({
            type: 'operator',
            uid: opUser.uid || opUser.id,
            email: opUser.email,
            identifier: cleanIdentifier,
          })
        );
        return 'operator';
      }

      // 3. Handle Candidate Login
      if (verifyResult.role === 'candidate') {
        const cand = verifyResult.user as Candidate;
        const candUid = cand.uid || cand.id;
        const profile: UserProfile = {
          uid: candUid,
          email: cand.email,
          role: 'candidate',
          fullName: cand.fullName,
          candidateId: cand.candidateId,
          createdAt: cand.createdAt,
        };
        const mockUser = {
          uid: candUid,
          email: cand.email,
          displayName: cand.fullName,
        } as unknown as FirebaseUser;

        setCurrentUser(mockUser);
        setUserProfile(profile);
        setCandidate(cand);
        setOperator(null);

        localStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify({
            type: 'candidate',
            uid: candUid,
            email: cand.email,
            identifier: cleanIdentifier,
          })
        );
        return 'candidate';
      }

      // 4. Handle Administrator Login
      if (verifyResult.role === 'admin') {
        const adminProfile = verifyResult.user as UserProfile;
        const mockUser = {
          uid: adminProfile.uid,
          email: adminProfile.email,
          displayName: adminProfile.fullName || 'Administrator',
        } as unknown as FirebaseUser;

        setCurrentUser(mockUser);
        setUserProfile(adminProfile);
        setCandidate(null);
        setOperator(null);

        localStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify({
            type: 'admin',
            uid: adminProfile.uid,
            email: adminProfile.email,
            identifier: cleanIdentifier,
          })
        );

        if (adminProfile.uid === 'admin-rasel-master' || adminProfile.email === 'raselahmed231956@gmail.com') {
          try {
            await setDoc(
              doc(db, 'admins', 'admin-rasel-master'),
              {
                uid: 'admin-rasel-master',
                email: 'raselahmed231956@gmail.com',
                name: 'Rasel Ahmed (Chief Administrator)',
                role: 'admin',
                updatedAt: new Date().toISOString(),
              },
              { merge: true }
            );
            await setDoc(doc(db, 'users', 'admin-rasel-master'), adminProfile, { merge: true });
          } catch (e) {
            console.warn('Could not mirror super admin to Firestore:', e);
          }
        }

        return 'admin';
      }

      throw new Error('অপ্রত্যাশিত ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  const registerCandidate = async (data: CandidateRegisterInput) => {
    setIsLoading(true);
    try {
      let uid = '';
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        uid = userCredential.user.uid;
      } catch (fbErr: any) {
        console.warn(
          'Firebase Auth user creation unavailable (' +
            (fbErr?.code || fbErr?.message) +
            '), generating secure profile directly in database.'
        );
        uid = 'cand_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
      }

      const finalCandidateId = data.candidateId?.trim() || generateCandidateId();
      const now = new Date().toISOString();

      // Fetch available default exam date & center if available
      let defaultDateId = '';
      let defaultDateStr = '';
      let defaultCenterId = '';
      let defaultCenterName = '';

      try {
        const [availableDates, availableCenters] = await Promise.all([
          getAvailableExamDates(data.trade || 'All Trades'),
          getAvailableExamCenters(),
        ]);
        if (availableDates.length > 0) {
          defaultDateId = availableDates[0].id;
          defaultDateStr = availableDates[0].date;
        }
        if (availableCenters.length > 0) {
          defaultCenterId = availableCenters[0].id;
          defaultCenterName = availableCenters[0].name;
        }
      } catch (e) {
        console.warn('Could not auto-assign exam schedule during registration:', e);
      }

      // Save Candidate Profile in Firestore
      const candidateRecord: Omit<Candidate, 'id'> = {
        uid,
        candidateId: finalCandidateId,
        fullName: data.fullName,
        passportNumber: data.passportNumber || '',
        mobileNumber: data.mobileNumber,
        email: data.email,
        trade: data.trade || 'General Assessment',
        dateOfBirth: data.dateOfBirth || '2000-01-01',
        examDateId: defaultDateId,
        examDate: defaultDateStr,
        examCenterId: defaultCenterId,
        examCenter: defaultCenterName,
        examStatus: 'UPCOMING',
        password: data.password,
        passwordHash: data.password,
        createdAt: now,
      };

      await setDoc(doc(db, 'candidates', uid), candidateRecord);

      // Save User role mapping
      const userProfileRecord: UserProfile = {
        uid,
        email: data.email,
        role: 'candidate',
        fullName: data.fullName,
        candidateId: finalCandidateId,
        password: data.password,
        passwordHash: data.password,
        createdAt: now,
      };
      await setDoc(doc(db, 'users', uid), userProfileRecord);

      const fullCandidate: Candidate = { id: uid, ...candidateRecord };
      const mockUser = {
        uid,
        email: data.email,
        displayName: data.fullName,
      } as unknown as FirebaseUser;

      // Securely persist candidate credentials in local vault & Firestore
      await persistCandidateRegistration(fullCandidate, data.password);

      setCurrentUser(mockUser);
      setUserProfile(userProfileRecord);
      setCandidate(fullCandidate);

      localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({
          type: 'candidate',
          uid,
          email: data.email,
          identifier: data.email,
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const registerOperator = async (data: {
    email: string;
    password: string;
    fullName: string;
    phoneNumber: string;
    agencyName?: string;
  }): Promise<OperatorUser> => {
    setIsLoading(true);
    try {
      // Create operator profile with 0 initial credits (user must request/buy coins from admin)
      const newOp = await createOperatorUser({
        email: data.email,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        agencyName: data.agencyName || 'Personal / General',
        password: data.password,
        initialCredits: 0,
        notes: 'Self-registered operator account',
        createdBy: 'self-register',
      });

      // Securely persist operator credentials in local vault & Firestore
      await persistOperatorRegistration(newOp, data.password);

      const profile: UserProfile = {
        uid: newOp.uid,
        email: newOp.email,
        role: 'operator',
        fullName: newOp.fullName,
        password: data.password,
        createdAt: newOp.createdAt,
      };

      const mockUser = {
        uid: newOp.uid,
        email: newOp.email,
        displayName: newOp.fullName,
      } as unknown as FirebaseUser;

      setCurrentUser(mockUser);
      setUserProfile(profile);
      setCandidate(null);
      setOperator(newOp);

      localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({
          type: 'operator',
          uid: newOp.uid,
          email: newOp.email,
          identifier: newOp.email,
        })
      );

      return newOp;
    } finally {
      setIsLoading(false);
    }
  };

  const setupFirstAdmin = async (email: string, password: string, fullName: string) => {
    setIsLoading(true);
    try {
      let uid = '';
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        uid = userCredential.user.uid;
      } catch (fbErr: any) {
        console.warn('Firebase Auth admin creation unavailable, persisting administrator profile directly:', fbErr?.code);
        uid = 'admin_' + Date.now();
      }

      await registerAdminUser(uid, email, fullName);

      const profile: UserProfile = {
        uid,
        email,
        role: 'admin',
        fullName,
        createdAt: new Date().toISOString(),
      };

      const mockUser = {
        uid,
        email,
        displayName: fullName,
      } as unknown as FirebaseUser;

      setCurrentUser(mockUser);
      setUserProfile(profile);
      setCandidate(null);
      setHasAdminSetup(true);

      localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({
          type: 'admin',
          uid,
          email,
          identifier: email,
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loginCandidateDirect = (cand: Candidate) => {
    const candUid = cand.uid || cand.id;
    const profile: UserProfile = {
      uid: candUid,
      email: cand.email,
      role: 'candidate',
      fullName: cand.fullName,
      candidateId: cand.candidateId,
      createdAt: cand.createdAt,
    };
    const mockUser = {
      uid: candUid,
      email: cand.email,
      displayName: cand.fullName,
    } as unknown as FirebaseUser;

    setCurrentUser(mockUser);
    setUserProfile(profile);
    setCandidate(cand);

    localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        type: 'candidate',
        uid: candUid,
        email: cand.email,
        identifier: cand.candidateId || cand.email,
      })
    );
  };

  const updateCurrentCandidate = (cand: Candidate) => {
    setCandidate(cand);
    if (userProfile && cand.fullName) {
      setUserProfile({
        ...userProfile,
        fullName: cand.fullName,
        candidateId: cand.candidateId,
      });
    }
  };

  const loginOperatorDirect = (op: OperatorUser) => {
    const profile: UserProfile = {
      uid: op.uid,
      email: op.email,
      role: 'operator',
      fullName: op.fullName,
      createdAt: op.createdAt,
    };
    const mockUser = {
      uid: op.uid,
      email: op.email,
      displayName: op.fullName,
    } as unknown as FirebaseUser;

    setCurrentUser(mockUser);
    setUserProfile(profile);
    setOperator(op);
    setCandidate(null);

    localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        type: 'operator',
        uid: op.uid,
        email: op.email,
        identifier: op.email,
      })
    );
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      try {
        await signOut(auth);
      } catch {
        // ignore
      }
      setCurrentUser(null);
      setUserProfile(null);
      setCandidate(null);
      setOperator(null);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      console.warn('Password reset email failed:', err);
      throw new Error(
        'Password reset link could not be dispatched via Firebase Auth. For testing, you can sign in directly using your Candidate ID or registered email.'
      );
    }
  };

  const refreshCandidate = async () => {
    if (candidate?.uid || candidate?.id || currentUser?.uid) {
      const uid = candidate?.uid || candidate?.id || currentUser?.uid || '';
      const candData = await getCandidateByUid(uid);
      if (candData) {
        setCandidate(candData);
      }
    }
  };

  const refreshOperatorData = async () => {
    if (operator?.uid) {
      const fresh = await getOperatorById(operator.uid);
      if (fresh) {
        setOperator(fresh);
      }
    }
  };

  const deductOperatorCredit = async (
    actionType: 'RESCHEDULE' | 'MARKSHEET',
    details: { candidateId?: string; candidateName?: string; description: string }
  ) => {
    if (!operator) {
      throw new Error('আপনার ইউজার একাউন্ট লগইন করা নেই।');
    }
    const currentCredits = Number(operator.credits || 0);
    if (currentCredits < 1) {
      throw new Error('অপর্যাপ্ত ক্রেডিট! এই কাজটি সম্পন্ন করতে ১ ক্রেডিট প্রয়োজন। আপনার বর্তমান ব্যালেন্স ০ ক্রেডিট। অ্যাডমিনের সাথে যোগাযোগ করে ক্রেডিট রিচার্জ করুন।');
    }

    const res = await updateOperatorCredits({
      operatorUid: operator.uid,
      deltaCredits: -1,
      actionType,
      candidateId: details.candidateId,
      candidateName: details.candidateName,
      description: details.description,
      performedBy: operator.email,
    });

    setOperator(prev => prev ? { ...prev, credits: res.newBalance } : null);
  };

  const role = userProfile?.role || null;
  const isAdmin = role === 'admin';
  const isCandidate = role === 'candidate';
  const isOperator = role === 'operator';
  const operatorCredits = operator ? Number(operator.credits || 0) : 0;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        candidate,
        operator,
        role,
        isAdmin,
        isCandidate,
        isOperator,
        operatorCredits,
        isLoading,
        hasAdminSetup,
        login,
        loginCandidateDirect,
        loginOperatorDirect,
        updateCurrentCandidate,
        registerCandidate,
        registerOperator,
        setupFirstAdmin,
        logout,
        resetPassword,
        refreshCandidate,
        refreshOperatorData,
        deductOperatorCredit,
        checkAdminExistence,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

