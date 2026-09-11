# Firebase Security
Goal: Move from simple rule generation to a security-first engineering process.

## Security Workflow
1. **Codebase Analysis:** Scan project for all Firestore queries, data models, and authentication patterns.
2. **Least Privilege Implementation:** 
   - Default Deny: All access denied by default.
   - Validator Functions: Use helper functions (e.g., `isValidUser()`) to ensure consistency.
3. **Devil's Advocate Attack:** Systematically attempt to break the rules using:
   - Public List Exploits: Can any user list all documents in a collection?
   - Ownership Hijacking: Can User A modify User B's data by changing the UID in the request?
   - Resource Exhaustion: Can a user create millions of small documents to cause a DoS?
4. **Validation:** Use `firebase-validate-security-rules` or emulator tests before any deployment.

## Rules for MyExpenseLog
- Every query MUST be scoped to `users/{uid}`.
- Rules must deny all access to the root or other user subtrees.
- Validated writes: Ensure `amount` is a finite number > 0 and `date` is a valid ISO string.
- No secret or service-account credentials may ever be stored in the frontend.

