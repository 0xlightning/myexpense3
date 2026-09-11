# MyExpenseLog

Personal finance ledger for one authenticated user. Users track income,
expenditure, and investments. Net worth is always derived:

net worth = total income - total expenditure - total investments

Read `project-spec.md` before implementing or changing behavior described there.

## Stack

- React with TypeScript
- Redux Toolkit and react-redux
- Tailwind CSS
- shadcn/ui built on Radix UI
- Recharts
- Firebase Auth, Firestore, and Hosting
- Vite

## Commands

```bash
npm run dev
npm run build
npx firebase deploy
npx firebase deploy --only firestore:rules
```

Run `npm run build` after meaningful implementation changes.
Do not deploy unless the user explicitly asks for deployment.

## Non-negotiable rules

- Do not add a server, Cloud Function, Firebase Admin SDK, or service-account
  credential.
- Do not store totals, net worth, chart splits, or counts in Firestore or Redux.
- Do not read or write outside `users/{uid}/`.
- Do not expose secrets or commit `.env.local`.
- Do not cascade-delete records when deleting a category.
- Do not rewrite records when a category is renamed or deleted.
- Preserve the fixed donut palette in `project-spec.md`.
- Do not introduce a new dependency without explaining why it is necessary.
- Do not make unrelated refactors while implementing a focused task.

## Data model

Use these user-scoped subcollections:

- `income_sources`
- `income_records`
- `expense_categories`
- `expenditure_records`
- `investment_categories`
- `investments`

Record fields:

- `amount`: finite number greater than zero
- `date`: UTC-midnight ISO string, for example
  `2026-01-15T00:00:00.000Z`
- `sourceId` or `categoryId`: optional; use `null` for Other
- `notes`: optional string with a maximum length of 2000
- `createdAt` and `updatedAt`: Firestore `serverTimestamp()`

Category/source names must be trimmed, 1–40 characters, and unique
case-insensitively within their own collection.

"Other" is a read-time label only. It is never a document. A null or
unresolvable category/source ID must resolve to "Other".

## State and data flow

- Use Redux Toolkit slices.
- Keep one slice per Firestore collection plus auth state.
- After sign-in, mount six Firestore `onSnapshot` listeners:
  three record collections and three category/source collections.
- Unsubscribe all listeners on sign-out and when the owning effect is
  cleaned up.
- Firestore snapshots update Redux.
- Writes go directly to Firestore; do not manually treat local writes as
  authoritative state.
- Represent auth initialization and collection loading explicitly.
- Do not render a legitimate zero value before the first relevant snapshot
  has resolved.

## Derived logic

Use pure selectors or pure utility functions for:

- total income
- total expenditure
- total investments
- net worth
- record counts
- category/source counts
- bucket splits
- resolved category/source names
- unresolved IDs mapped to Other

Net worth is:

income - expenditure - investments

Investment amounts are negative in the net-worth calculation.

## Shared architecture

- Use one metadata table for income, expenditure, and investment.
- The metadata table must drive record routes, record forms, category panels,
  dashboard selectors, and chart labels.
- Do not create three duplicated record-page implementations.
- A new kind should require one metadata entry plus its route configuration.
- Keep Firebase access and Firestore path construction centralized.
- Keep validation separate from presentation components where practical.

## Validation

Validate at the UI boundary before writes:

- amount is finite and greater than zero
- date is a valid UTC-midnight ISO string
- notes are at most 2000 characters
- names are trimmed and 1–40 characters
- names are case-insensitively unique within their own collection

Client validation improves UX but is not security. Firestore rules remain the
security boundary.

## Security

Firestore rules must:

- allow access only when `request.auth != null`
- require `request.auth.uid == uid`
- deny all other documents and users

Whenever Auth, Firestore paths, or rules change, review them with
`docs/firebase-security.md` and verify that no cross-user read or write is possible.

## UI rules

- Use Tailwind utilities and existing shadcn/ui components.
- Prefer accessible labels, keyboard operation, visible focus states, and
  meaningful empty/error/loading states.
- Use skeletons while the first snapshot is pending; do not show zero as a
  loading placeholder.
- Use `tabular-nums` for table columns, not dashboard cards.
- Net worth always includes a sign character; color must not be the only
  indication of positive or negative values.
- Preserve the fixed light/dark donut palette and the specified surfaces.
- Provide the chart table fallback described in `project-spec.md`.
- Do not use categorical chart color as text color.

## Testing and verification

For changes involving calculations or data behavior, verify:

- net worth calculation
- positive finite amount validation
- UTC date handling
- case-insensitive name uniqueness
- null and orphaned IDs resolving to Other
- non-cascading category deletion
- stable category color slots
- loading, empty, and error states

Before finishing:

1. Run the relevant tests or checks.
2. Run `npm run build`.
3. Review the diff for unrelated changes.
4. Report changed files, commands run, and unresolved risks.

## Git

Use clear imperative commit messages, for example:

- `Add Firebase auth listener`
- `Implement generic record page`
- `Add category deletion confirmation`
- `Fix orphaned category resolution`

Do not commit `.env.local`, credentials, generated secrets, or unrelated files.

## Optional workflows

- `/graphify`: map the repository before broad changes.
- `/ponytail`: simplify bloated or speculative implementations.
- `/taste`: review architecture and design quality.
- `/impeccable audit`: audit UX and accessibility.
- `/impeccable polish`: apply focused UI polish.
- `/review`: perform a severity-ranked final review.