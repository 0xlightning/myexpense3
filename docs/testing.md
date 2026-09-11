# Testing
Goal: Mandatory verification of logic via the Firebase Local Emulator Suite.

## Testing Strategy
1. **Unit Tests:** Use `@firebase/rules-unit-testing` for security rules.
2. **Logic Verification:** Prioritize these critical paths:
   - **Net Worth:** `Î£ income âˆ’ Î£ expenditure âˆ’ Î£ investments` calculation.
   - **Dates:** UTC-midnight ISO handling.
   - **Validation:** Positive finite amount checks.
   - **Uniqueness:** Case-insensitive category names within a collection.
   - **Orphans:** `categoryId` not found $\rightarrow$ "Other".
   - **Deletion:** Deleting a category does NOT modify existing records.
   - **Visuals:** Correct color slot assignment (1-8) based on `createdAt`.
3. **State/UI Tests:** Verify loading and empty states for all buckets.

## Workflow
- Run tests against Local Emulator before any production deploy.
- Every bug fix MUST include a test case that previously failed and now passes.
- Minimal setup: No heavy frameworks unless explicitly requested. Use simple `assert` or `node:test`.

