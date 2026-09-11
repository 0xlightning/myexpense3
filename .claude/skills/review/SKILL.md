# Review
Goal: High-severity audit of changes against project specifications.

## Audit Dimensions
Review all changes against `CLAUDE.md` and `project-spec.md` using these lenses:
1. **Correctness:** Does it implement the spec exactly?
2. **Data Integrity:** Are Firestore paths correct? Are types strictly enforced?
3. **Security:** Is the `uid` scope maintained? Any potential for unauthorized access?
4. **Accessibility:** Contrast, Aria-labels, Keyboard nav, Touch targets.
5. **Responsive Behavior:** Mobile-first layout, no horizontal scroll, viewport meta.
6. **Complexity:** Is there over-engineering? (Invoke `/ponytail` if yes).
7. **Risk:** Potential for production build failure or deployment regression.

## Output Format
Group findings by severity:
- **CRITICAL:** Security holes, data loss, build blockers.
- **HIGH:** Specification mismatch, broken core logic, major UX failure.
- **MEDIUM:** Accessibility issues, inconsistent styling, minor bugs.
- **LOW:** Nits, naming improvements, minor refactors.

Format: `file:line — <problem> -> <proposed fix>`
