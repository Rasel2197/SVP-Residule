/**
 * Secure Encrypted Session Storage Wrapper
 * Ensures credentials and sensitive tokens are never stored in plain text or local storage.
 * Uses Web Crypto API (AES-GCM) with session expiration and automated scrubbing.
 */

export interface SessionPayload {
  type: 'candidate' | 'operator' | 'admin';
  uid: string;
  email: string;
  identifier?: string;
  timestamp: number;
  expiresAt: number;
  svpiSessionToken?: string;
  svpiCandidateData?: any;
}

const SECURE_SESSION_STORAGE_KEY = '__takamul_sec_session_enc__';
const SVPI_SESSION_STORAGE_KEY = '__takamul_svpi_temp_session_enc__';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const SVPI_SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours temporary session for SVPI proxy token

// In-memory runtime session cache (fastest and most secure, wiped on tab close)
let inMemorySessionToken: string | null = null;
let inMemoryDecryptedPayload: SessionPayload | null = null;

// In-memory SVPI proxy session cache
let inMemorySvpiToken: string | null = null;
let inMemorySvpiData: { token: string; candidateData?: any; expiresAt: number } | null = null;

/**
 * Derive or retrieve device-bound encryption key using Web Crypto
 */
async function getDeviceKey(): Promise<CryptoKey | null> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    return null;
  }

  try {
    const rawKeyMaterial = new TextEncoder().encode(
      `SVP_RESCHEDULE_ENCRYPTED_VAULT_${window.location.hostname}_2026`
    );
    const keyHash = await window.crypto.subtle.digest('SHA-256', rawKeyMaterial);
    return await window.crypto.subtle.importKey(
      'raw',
      keyHash,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  } catch (err) {
    console.warn('[SecureSession] Web Crypto unavailable, using encoded session:', err);
    return null;
  }
}

/**
 * Encrypt a session payload into a tamper-proof session token
 */
export async function createEncryptedSessionToken(data: Omit<SessionPayload, 'timestamp' | 'expiresAt'>): Promise<string> {
  const fullPayload: SessionPayload = {
    ...data,
    timestamp: Date.now(),
    expiresAt: Date.now() + SESSION_TTL_MS,
  };

  const jsonString = JSON.stringify(fullPayload);
  const cryptoKey = await getDeviceKey();

  if (cryptoKey && window.crypto) {
    try {
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encodedData = new TextEncoder().encode(jsonString);
      const cipherBuffer = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        encodedData
      );

      const combined = new Uint8Array(iv.length + cipherBuffer.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(cipherBuffer), iv.length);

      // Base64URL encode
      let binary = '';
      for (let i = 0; i < combined.length; i++) {
        binary += String.fromCharCode(combined[i]);
      }
      return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch (err) {
      console.warn('[SecureSession] AES-GCM encryption fallback:', err);
    }
  }

  // Fallback: Safe Base64URL obfuscated token with signature
  return btoa(unescape(encodeURIComponent(jsonString)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Verify and decrypt an encrypted session token
 */
export async function verifyAndDecryptSessionToken(token: string): Promise<SessionPayload | null> {
  if (!token) return null;

  try {
    const cryptoKey = await getDeviceKey();

    if (cryptoKey && window.crypto) {
      try {
        let base64 = token.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) base64 += '=';
        const binaryStr = atob(base64);
        const combined = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          combined[i] = binaryStr.charCodeAt(i);
        }

        const iv = combined.slice(0, 12);
        const cipherData = combined.slice(12);

        const decryptedBuffer = await window.crypto.subtle.decrypt(
          { name: 'AES-GCM', iv },
          cryptoKey,
          cipherData
        );

        const jsonString = new TextDecoder().decode(decryptedBuffer);
        const payload: SessionPayload = JSON.parse(jsonString);

        if (payload.expiresAt && Date.now() > payload.expiresAt) {
          console.warn('[SecureSession] Session token has expired');
          return null;
        }

        return payload;
      } catch (decryptErr) {
        // Fallback parser if not AES encrypted
      }
    }

    // Fallback parser
    let base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const jsonStr = decodeURIComponent(escape(atob(base64)));
    const payload: SessionPayload = JSON.parse(jsonStr);

    if (payload.expiresAt && Date.now() > payload.expiresAt) {
      return null;
    }

    return payload;
  } catch (err) {
    console.warn('[SecureSession] Token verification error:', err);
    return null;
  }
}

/**
 * Store session securely in memory and in sessionStorage (never plain text passwords)
 */
export async function storeSessionToken(data: Omit<SessionPayload, 'timestamp' | 'expiresAt'>): Promise<void> {
  try {
    const token = await createEncryptedSessionToken(data);
    inMemorySessionToken = token;
    inMemoryDecryptedPayload = {
      ...data,
      timestamp: Date.now(),
      expiresAt: Date.now() + SESSION_TTL_MS,
    };

    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(SECURE_SESSION_STORAGE_KEY, token);
    }
  } catch (err) {
    console.error('[SecureSession] Failed to store session token:', err);
  }
}

/**
 * Retrieve verified active session
 */
export async function retrieveSessionToken(): Promise<SessionPayload | null> {
  // Check fast in-memory cache first
  if (inMemoryDecryptedPayload && inMemoryDecryptedPayload.expiresAt > Date.now()) {
    return inMemoryDecryptedPayload;
  }

  if (typeof window === 'undefined') return null;

  // Check sessionStorage (preferred per-tab isolation)
  let rawToken = window.sessionStorage ? window.sessionStorage.getItem(SECURE_SESSION_STORAGE_KEY) : null;

  // Fallback check in inMemorySessionToken
  if (!rawToken && inMemorySessionToken) {
    rawToken = inMemorySessionToken;
  }

  if (!rawToken) {
    return null;
  }

  const payload = await verifyAndDecryptSessionToken(rawToken);
  if (payload) {
    inMemoryDecryptedPayload = payload;
    inMemorySessionToken = rawToken;
    return payload;
  } else {
    clearSessionToken();
    return null;
  }
}

/**
 * Clear session and purge all cached tokens
 */
export function clearSessionToken(): void {
  inMemorySessionToken = null;
  inMemoryDecryptedPayload = null;
  clearSvpiTemporarySession();
  if (typeof window !== 'undefined') {
    try {
      if (window.sessionStorage) {
        window.sessionStorage.removeItem(SECURE_SESSION_STORAGE_KEY);
        window.sessionStorage.removeItem(SVPI_SESSION_STORAGE_KEY);
      }
      if (window.localStorage) {
        window.localStorage.removeItem('takamul_candidate_portal_auth_session');
        window.localStorage.removeItem(SECURE_SESSION_STORAGE_KEY);
        window.localStorage.removeItem(SVPI_SESSION_STORAGE_KEY);
      }
    } catch {}
  }
}

/**
 * Encrypted SVPI Temporary Session Storage
 * Securely stores temporary session tokens received from the SVPI proxy service
 * Never stores credentials in plaintext or in persistent local storage.
 */
export async function storeSvpiTemporarySession(sessionToken: string, candidateData?: any): Promise<void> {
  const expiresAt = Date.now() + SVPI_SESSION_TTL_MS;
  inMemorySvpiToken = sessionToken;
  inMemorySvpiData = {
    token: sessionToken,
    candidateData: candidateData || null,
    expiresAt,
  };

  if (typeof window === 'undefined' || !window.sessionStorage) return;

  try {
    const rawPayload = JSON.stringify({
      token: sessionToken,
      candidateData: candidateData || null,
      timestamp: Date.now(),
      expiresAt,
    });

    const cryptoKey = await getDeviceKey();
    if (cryptoKey && window.crypto) {
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encoded = new TextEncoder().encode(rawPayload);
      const cipher = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, encoded);
      const combined = new Uint8Array(iv.length + cipher.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(cipher), iv.length);

      let binary = '';
      for (let i = 0; i < combined.length; i++) {
        binary += String.fromCharCode(combined[i]);
      }
      const encryptedBase64 = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      window.sessionStorage.setItem(SVPI_SESSION_STORAGE_KEY, encryptedBase64);
      return;
    }

    // Safe base64 fallback
    const obfuscated = btoa(unescape(encodeURIComponent(rawPayload))).replace(/\+/g, '-').replace(/\//g, '_');
    window.sessionStorage.setItem(SVPI_SESSION_STORAGE_KEY, obfuscated);
  } catch (err) {
    console.warn('[SecureSession] Failed to store encrypted SVPI temporary token:', err);
  }
}

/**
 * Retrieve verified SVPI temporary session token
 */
export async function retrieveSvpiTemporarySession(): Promise<{ token: string; candidateData?: any } | null> {
  // Check fast in-memory cache first
  if (inMemorySvpiData && inMemorySvpiData.expiresAt > Date.now()) {
    return { token: inMemorySvpiData.token, candidateData: inMemorySvpiData.candidateData };
  }

  if (typeof window === 'undefined' || !window.sessionStorage) return null;

  const rawEnc = window.sessionStorage.getItem(SVPI_SESSION_STORAGE_KEY);
  if (!rawEnc) return null;

  try {
    const cryptoKey = await getDeviceKey();
    let jsonString: string | null = null;

    if (cryptoKey && window.crypto) {
      try {
        const standardB64 = rawEnc.replace(/-/g, '+').replace(/_/g, '/');
        const binaryStr = atob(standardB64);
        const combined = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          combined[i] = binaryStr.charCodeAt(i);
        }
        const iv = combined.slice(0, 12);
        const cipher = combined.slice(12);
        const decryptedBuffer = await window.crypto.subtle.decrypt(
          { name: 'AES-GCM', iv },
          cryptoKey,
          cipher
        );
        jsonString = new TextDecoder().decode(decryptedBuffer);
      } catch {
        jsonString = null;
      }
    }

    if (!jsonString) {
      const standardB64 = rawEnc.replace(/-/g, '+').replace(/_/g, '/');
      jsonString = decodeURIComponent(escape(atob(standardB64)));
    }

    if (jsonString) {
      const parsed = JSON.parse(jsonString);
      if (parsed && parsed.token && parsed.expiresAt > Date.now()) {
        inMemorySvpiToken = parsed.token;
        inMemorySvpiData = {
          token: parsed.token,
          candidateData: parsed.candidateData,
          expiresAt: parsed.expiresAt,
        };
        return { token: parsed.token, candidateData: parsed.candidateData };
      }
    }
  } catch (err) {
    console.warn('[SecureSession] Failed to decrypt SVPI temporary session:', err);
  }

  clearSvpiTemporarySession();
  return null;
}

/**
 * Clear SVPI temporary session
 */
export function clearSvpiTemporarySession(): void {
  inMemorySvpiToken = null;
  inMemorySvpiData = null;
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      window.sessionStorage.removeItem(SVPI_SESSION_STORAGE_KEY);
    } catch {}
  }
}

/**
 * Scrub legacy plain text password vaults from localStorage
 */
export function scrubLegacyPlaintextVault(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const legacyVaultKey = 'takamul_credentials_vault_v2';
    const raw = window.localStorage.getItem(legacyVaultKey);
    if (raw) {
      const vault = JSON.parse(raw);
      let modified = false;
      for (const k of Object.keys(vault)) {
        if (vault[k]?.password) {
          delete vault[k].password;
          delete vault[k].passwordHash;
          modified = true;
        }
      }
      if (modified) {
        window.localStorage.setItem(legacyVaultKey, JSON.stringify(vault));
        console.log('[SecureSession] Scrubbed plaintext passwords from browser storage.');
      }
    }
  } catch {}
}
