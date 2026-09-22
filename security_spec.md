# Security Specification: Takamul Candidate Portal

## 1. System Invariants & Trust Model
- **Zero Client Trust on Roles:** Role claims cannot be self-asserted or altered by clients. Admin status is confirmed strictly via privileged lookup in `/admins/$(request.auth.uid)`.
- **Candidate Data Privacy (PII Protection):** Candidates may only read their own registration document (`resource.data.uid == request.auth.uid`), their own change requests (`resource.data.candidateUid == request.auth.uid`), and their own official marksheet (`resource.data.candidateUid == request.auth.uid`).
- **Immutable Results & Marksheets:** Candidates have NO write access (create, update, delete) to the `marksheets` collection. Only authenticated admins may create or update marksheets.
- **Request Integrity & Self-Approval Prevention:** Candidates cannot modify request status to `APPROVED` or `REJECTED`, cannot change `reviewedBy`, and cannot approve their own requests.
- **3-Day Cutoff Invariant:** Requests must only be valid if the exam date is at least 3 full days in the future.
- **Audit Logs Tamper-Resistance:** Audit logs are append-only by admins and can never be modified or deleted by candidates or non-admins.

## 2. Dirty Dozen Threat Payloads Tested Against
1. **Self-Promotion to Admin:** Candidate attempts to write to `/admins/{uid}` or patch `users/{uid}.role = 'admin'`. -> DENIED.
2. **Arbitrary Mark Modification:** Candidate attempts to `update /marksheets/{marksheetId}` with `{ theoryMarks: 100, practicalMarks: 100, resultStatus: "PASS" }`. -> DENIED.
3. **Marksheet Creation by Candidate:** Unprivileged user sends `create /marksheets/{id}`. -> DENIED.
4. **Cross-Candidate PII Snooping:** Candidate A queries or attempts `get /candidates/{candidateB_docId}`. -> DENIED.
5. **Self-Approval of Date Change:** Candidate sends `update /dateChangeRequests/{reqId}` with `{ status: "APPROVED" }`. -> DENIED.
6. **Direct Exam Date Tampering:** Candidate updates `/candidates/{candidateDocId}` to change their own `examDate` or `examCenter` without admin review. -> DENIED.
7. **Exam Date Capacity Spoofing:** Candidate attempts to directly decrement or increment `capacity` in `/examDates/{dateId}`. -> DENIED.
8. **Center Creation by Candidate:** Candidate tries to insert `/examCenters/{newCenterId}`. -> DENIED.
9. **Fake Request Submission for Another Candidate:** User A submits a change request with `candidateUid: "userB"`. -> DENIED.
10. **Tampering with Audit Logs:** Candidate or unauthenticated user creates or deletes `/auditLogs/{logId}`. -> DENIED.
11. **Blanket Querying without Relational Filter:** Candidate calls collection read on `/candidates` without scoping to their own UID. -> DENIED.
12. **Bypassing 3-Day Rule via Direct Injection:** Candidate submits request directly with a fabricated past date or invalid state. -> Server API / Security validation rejected.
