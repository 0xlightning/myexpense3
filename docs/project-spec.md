# MyExpenseLog — Project Spec

Personal finance ledger. One signed-in user logs income, expenditure,
and investment entries; net worth is derived, never stored.

```
net worth = Σ income − Σ expenditure − Σ investments
```

## Stack

- **Frontend:** React + Redux Toolkit (react-redux)
- **Styling:** Tailwind CSS + shadcn/ui components (built on Radix UI)
- **Charts:** Recharts (donut, tooltip, legend)
- **Backend:** Firebase — Auth (email/password), Firestore (database),
  Hosting (static build). Free tier only. No server, no Cloud Functions.

## Data model

Everything scoped under the signed-in user's uid. Three record
collections + three category collections (not one unified table —
income uses sources, expenditure/investment use categories).

```
users/{uid}/
├── income_sources/          { name, createdAt }
├── income_records/          { amount, date, sourceId,   notes, createdAt, updatedAt }
├── expense_categories/      { name, createdAt }
├── expenditure_records/     { amount, date, categoryId, notes, createdAt, updatedAt }
├── investment_categories/   { name, createdAt }
└── investments/             { amount, date, categoryId, notes, createdAt, updatedAt }
```

Field rules:

- `amount` — number, > 0, finite.
- `date` — ISO string, UTC midnight (e.g. `2026-01-15T00:00:00.000Z`).
- `categoryId` / `sourceId` — optional; `null` renders as "Other".
- `notes` — optional string, ≤ 2000 chars.
- `createdAt` / `updatedAt` — Firestore `serverTimestamp()`.
- category/source `name` — required, trimmed, 1–40 chars, unique
  (case-insensitive) **within its own collection only**. "Salary" may
  exist as an income source and an expense category at the same time.

"Other" is a read-time label only — never a document, so deleting a
category can't orphan a record. A record whose `categoryId` no longer
resolves to a live document falls back to "Other" the same way a `null`
does; nothing is rewritten on delete.

## Routes

| Path | Page | Guard |
|---|---|---|
| `/login` | Login | public |
| `/` | Dashboard | auth |
| `/income` | Records — income | auth |
| `/expenditure` | Records — expenditure | auth |
| `/investments` | Records — investment | auth |
| `/category` | Categories — all three kinds | auth |

One generic record page can serve all three kinds via a metadata table
(field labels, collection paths, bucket type) instead of three
near-identical pages.

### Kind metadata table

Single source of truth driving the record page, the category page, and
the dashboard. A 4th entry kind costs one row here plus one route.

| kind | label | records collection | category collection | FK field | category noun | sign |
|---|---|---|---|---|---|---|
| `income` | Income | `income_records` | `income_sources` | `sourceId` | Source | `+1` |
| `expenditure` | Expenditure | `expenditure_records` | `expense_categories` | `categoryId` | Category | `−1` |
| `investment` | Investments | `investments` | `investment_categories` | `categoryId` | Category | `−1` |

## Categories page — `/category`

One page, one route, for all three category collections. The only place
categories are created; a record form picks from what exists here, plus
an always-present "Other" option that writes `null`.

Layout: three panels (tabs on mobile, three columns at `lg`), one per
kind, driven by the metadata table above. Each panel:

- **Header** — kind label + category noun, plus a live count.
- **Add row** — one text input + Add button. Submits on Enter.
- **List** — name, record count, bucket total, inline rename, delete.
  Sorted `createdAt` ascending, so colour slots stay stable (see
  Dashboard § Donut colour).
- **Empty state** — "No sources yet. Add one to see the split on your
  dashboard."

Behaviour:

- **Create** — `addDoc(users/{uid}/{categoryCollection})` with
  `{ name, createdAt: serverTimestamp() }`. Client rejects blank names,
  names over 40 chars, and case-insensitive duplicates inside that one
  collection. Validation is UX; rules do not enforce shape.
- **Rename** — `updateDoc` of `name`. Records reference the doc id, so
  every record and every chart slice relabels on the next snapshot with
  no data migration.
- **Delete** — `deleteDoc`. Records are **not** touched and **not**
  cascaded. Their `categoryId` becomes unresolvable and renders as
  "Other" from then on. The confirm dialog states exactly that, with the
  affected count: *Delete "Groceries"? 14 records move to Other. Amounts
  and dates are unchanged.*
- Creating a category writes nothing to any record. A new category has
  zero records, so it is charted only once a record points at it (see
  the zero-value rule below).

## Dashboard — `/`

Reads the same Redux slices as everything else. Every number is derived
at render time; nothing is cached or stored.

### Stat cards

A row of four cards. Net worth is the hero figure and spans wider at
`lg`; the other three are equal stat tiles.

| Card | Value | Sub-line |
|---|---|---|
| **Net worth** | `Σ income − Σ expenditure − Σ investments` | the formula, rendered with the three totals |
| Total income | `Σ income_records.amount` | record count + source count |
| Total expenditure | `Σ expenditure_records.amount` | record count + category count |
| Total investments | `Σ investments.amount` | record count + category count |

Rules:

- Currency, thousands-grouped, no decimals above 1000. Net worth carries
  a sign character and takes success/critical ink for positive/negative
  — the sign always ships, so meaning is never colour-alone.
- UI sans with default proportional figures. `tabular-nums` is reserved
  for table columns, not cards.
- Zero renders as `0`, not a dash, once auth resolves. Before the first
  snapshot lands, cards show a skeleton rather than `0`.

### Split donuts

Three donut charts, one per kind, each sliced by that kind's own
categories. This is the payoff of `/category`: add a category, point a
record at it, and it becomes its own slice here.

- **Slices** — group that kind's records by resolved category name;
  slice value is `Σ amount` for the group. `null` and unresolvable FKs
  collapse into one **Other** slice.
- **Centre** — bucket total plus kind label, so the hole carries the
  headline instead of wasting space.
- **Legend** — always present at ≥ 2 slices, showing name and value. At
  ≤ 4 slices the slices are also directly labelled, so identity never
  rests on colour alone. A single-slice donut drops the legend; the
  title names it.
- **Hover** — per-segment tooltip: category name, amount, share of the
  bucket. Hit target is the whole segment.
- **Table view** — a toggle under each donut renders the same rows as a
  two-column table. This is the accessibility fallback, and the required
  relief for any sub-3:1 colour on the light surface.
- **Zero-value categories are not drawn.** A category with no records is
  a 0% slice — invisible geometry with a live legend entry — so those
  are listed under the chart as "N categories with no records yet".
- **Empty bucket** — a kind with no records renders an empty state
  pointing at `/category` and its record page, not an empty ring.

### Donut colour

Colour is computed, not eyeballed.

- Categorical palette in **fixed slot order, never cycled**:

  | Slot | Hue | Light | Dark |
  |---|---|---|---|
  | 1 | blue | `#2a78d6` | `#3987e5` |
  | 2 | orange | `#eb6834` | `#d95926` |
  | 3 | aqua | `#1baf7a` | `#199e70` |
  | 4 | yellow | `#eda100` | `#c98500` |
  | 5 | magenta | `#e87ba4` | `#d55181` |
  | 6 | green | `#008300` | `#008300` |
  | 7 | violet | `#4a3aa7` | `#9085e9` |
  | 8 | red | `#e34948` | `#e66767` |

- **Colour follows the entity, not its rank.** A category's slot is its
  index in the `createdAt`-ascending list, so sorting the donut by value
  or filtering a month never repaints the survivors.
- **A 9th category is never a generated hue.** Slots 1–8 go to the eight
  oldest categories; the rest fold into **Other**, and the table view
  carries the detail.
- **Other is not a categorical slot** — muted grey `#898781` in both
  modes, because it is a residual, not an identity.
- Dark mode uses the selected dark column above, not an automatic flip.
  Surfaces: light `#fcfcfb`, dark `#1a1a19`.
- 2px surface-coloured gap between adjacent segments. Text stays in ink
  tokens (primary `#0b0b0b` / `#ffffff`, muted `#898781`), never in a
  series colour.

Re-validate the palette against both surfaces before changing it.

## Data flow

```
Firebase Auth (email/password)
  → onAuthStateChanged
  → mount Firestore onSnapshot listeners (per collection)
  → each snapshot dispatches into a Redux slice
  → components read slices via useSelector
  → writes go straight to Firestore; the listener echoes back
```

Six listeners mount together — three record collections and three
category collections — so `/category` edits and `/` charts
update from the same echo, with no refetch.

No server — Firestore Security Rules are the only access control.

## Firestore security rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null
                          && request.auth.uid == uid;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

A user may only read/write their own uid subtree; everything else is
denied. Rules don't validate document shape — that's the client-side
validator's job (UX, not security).

## Firebase setup

1. Firebase Console → create project.
2. Authentication → Sign-in method → enable Email/Password.
3. Firestore → create database (production mode).
4. Project settings → Web app → copy config into `.env.local`:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

5. Deploy rules before real data lands: `npx firebase deploy --only firestore:rules`
6. `npm run dev`

`firebase.json` (hosting + rules):

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  },
  "firestore": { "rules": "firestore.rules", "indexes": "firestore.indexes.json" }
}
```

Deploy:

```bash
npm run build
npx firebase deploy
```

## Core decisions

- Three collections, not one `transactions` table — income uses
  sources, expenditure/investment use categories; different vocab.
- Net worth derived on every render, never cached/stored.
- UTC-midnight ISO dates — month/year bucketing is timezone-safe.
- One record page driven by a metadata table — a 4th entry kind costs
  one table row + one route.
- One `/category` route for all three category collections, driven by
  that same metadata table — three near-identical pages would drift.
- Category delete never cascades. Orphaned FKs resolve to "Other" at
  read time, so a delete can never destroy or corrupt a record.
- Donut colour slots key to category creation order, not slice size, so
  sorting and filtering never repaint the chart.
- Client-side validation is UX, not security; rules are security.

## Spec tree

```
MyExpenseLog
│
├── Auth ── Firebase email/password, single user, uid-scoped
│
├── Data  (users/{uid}/)
│   ├── income
│   │   ├── income_sources/        { name, createdAt }
│   │   └── income_records/        { amount, date, sourceId,   notes, ts }
│   ├── expenditure
│   │   ├── expense_categories/    { name, createdAt }
│   │   └── expenditure_records/   { amount, date, categoryId, notes, ts }
│   └── investment
│       ├── investment_categories/ { name, createdAt }
│       └── investments/           { amount, date, categoryId, notes, ts }
│
├── Routes
│   ├── /login        public  — email/password
│   ├── /             auth    — Dashboard (cards + 3 split donuts)
│   ├── /income       auth   ─┐
│   ├── /expenditure  auth   ─┤ one page, kind metadata table
│   ├── /investments  auth   ─┘
│   └── /category     auth    — 3 panels: add / rename / delete
│
├── Dashboard
│   ├── Cards
│   │   ├── Net worth = Σin − Σexp − Σinv   (hero, signed)
│   │   ├── Total income
│   │   ├── Total expenditure
│   │   └── Total investments
│   └── Donuts  (one per kind)
│       ├── slices = Σ amount grouped by resolved category
│       ├── Other  = null FK + unresolvable FK + slots 9+
│       ├── centre = bucket total
│       ├── legend = always at ≥2 slices; direct labels at ≤4
│       ├── hover  = name, amount, share of bucket
│       └── table  = accessibility fallback toggle
│
├── State
│   ├── Redux Toolkit — one slice per collection (6) + auth
│   ├── 6 onSnapshot listeners mounted on sign-in
│   └── totals + splits are selectors, never stored
│
└── Platform
    ├── Vite build → Firebase Hosting (dist, SPA rewrite)
    ├── Security   = Firestore rules on users/{uid}/**
    └── Validation = client-side, UX only
```
