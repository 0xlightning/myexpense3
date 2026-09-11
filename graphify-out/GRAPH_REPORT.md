# Graph Report - .  (2026-09-11)

## Corpus Check
- Corpus is ~3,746 words - fits in a single context window. You may not need a graph.

## Summary
- 203 nodes · 254 edges · 15 communities (14 shown, 1 thin omitted)
- Extraction: 81% EXTRACTED · 19% INFERRED · 1% AMBIGUOUS · INFERRED: 47 edges (avg confidence: 0.91)
- Token cost: 143,363 input · 0 output

## Community Hubs (Navigation)
- Product Spec and Architecture Rules
- App TypeScript Config
- Dev Toolchain Dependencies
- Runtime Dependencies
- Node and Vite TS Config
- Security Rules and Testing
- shadcn/ui Config
- Build, Deploy and Setup
- App Entry and Lint Rules
- npm Package Scripts
- Firestore Data Model
- Agent Instructions and Spec
- TS Project References

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 18 edges
2. `compilerOptions` - 15 edges
3. `users/{uid} Data Model` - 14 edges
4. `Firestore Security Rules (owner-only users/{uid}/**)` - 12 edges
5. `Critical Logic Verification Paths` - 10 edges
6. `Non-negotiable Rules` - 8 edges
7. `Record Field Rules` - 7 edges
8. `Categories Page (/category)` - 7 edges
9. `tailwind` - 6 edges
10. `UI Rules` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Testing and Verification Checklist` --semantically_similar_to--> `Critical Logic Verification Paths`  [INFERRED] [semantically similar]
  CLAUDE.md → docs/testing.md
- `Minimal Test Setup (node:test / assert)` --conceptually_related_to--> `Non-negotiable Rules`  [INFERRED]
  docs/testing.md → CLAUDE.md
- `Non-negotiable Rules` --references--> `users/{uid} Data Model`  [INFERRED]
  CLAUDE.md → docs/project-spec.md
- `Non-negotiable Rules` --references--> `.env.local Firebase Config (VITE_FIREBASE_*)`  [INFERRED]
  CLAUDE.md → docs/project-spec.md
- `Shared Kind-Metadata Architecture` --references--> `Kind Metadata Table`  [INFERRED]
  CLAUDE.md → docs/project-spec.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Kind Metadata Table Drives Record, Category and Dashboard Surfaces** — docs_project_spec_kind_metadata_table, docs_project_spec_generic_record_page, docs_project_spec_categories_page, docs_project_spec_dashboard [EXTRACTED 1.00]
- **Orphan-Safe Category Lifecycle (Other fallback, no cascade, no rewrite)** — docs_project_spec_other_label, docs_project_spec_non_cascading_delete, docs_project_spec_category_rename, docs_project_spec_split_donuts [EXTRACTED 1.00]
- **Firestore Rules as the Sole Security Boundary** — docs_project_spec_firestore_security_rules, docs_firebase_security_default_deny, docs_firebase_security_myexpenselog_rules, docs_testing_rules_unit_testing, claude_security_rules_requirement [INFERRED 0.85]

## Communities (15 total, 1 thin omitted)

### Community 0 - "Product Spec and Architecture Rules"
Cohesion: 0.12
Nodes (34): Pure Derived-Logic Selectors, Snapshot Listener Lifecycle and Loading State, Non-negotiable Rules, Shared Kind-Metadata Architecture, UI-Boundary Write Validation, UI Rules, Categories Page (/category), Case-Insensitive Name Uniqueness per Collection (+26 more)

### Community 1 - "App TypeScript Config"
Cohesion: 0.08
Nodes (23): DOM, src, vite/client, compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx (+15 more)

### Community 2 - "Dev Toolchain Dependencies"
Cohesion: 0.10
Nodes (21): autoprefixer, oxlint, postcss, tailwindcss, @types/node, @types/react, @types/react-dom, typescript (+13 more)

### Community 3 - "Runtime Dependencies"
Cohesion: 0.10
Nodes (21): clsx, firebase, lucide-react, @radix-ui/react-slot, react, react-dom, react-redux, recharts (+13 more)

### Community 4 - "Node and Vite TS Config"
Cohesion: 0.10
Nodes (19): node, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection (+11 more)

### Community 5 - "Security Rules and Testing"
Cohesion: 0.19
Nodes (15): Firestore Security Requirements and Review, Firebase Security Guide, Least Privilege / Default Deny, Devil's Advocate Rule Attack, MyExpenseLog Security Rule Requirements, Pre-Deploy Rules Validation (firebase-validate-security-rules / emulator), Security-First Workflow, Rule-Validated Writes (amount, date) (+7 more)

### Community 6 - "shadcn/ui Config"
Cohesion: 0.14
Nodes (13): aliases, components, utils, rsc, $schema, style, tailwind, baseColor (+5 more)

### Community 7 - "Build, Deploy and Setup"
Cohesion: 0.17
Nodes (13): Git Commit Conventions, Build and Deploy Commands, Testing and Verification Checklist, .env.local Firebase Config (VITE_FIREBASE_*), Firebase Hosting, firebase.json Hosting and Rules Config, Firebase Project Setup, Vite (+5 more)

### Community 8 - "App Entry and Lint Rules"
Cohesion: 0.17
Nodes (10): oxc, react, typescript, warn, plugins, rules, react/only-export-components, react/rules-of-hooks (+2 more)

### Community 9 - "npm Package Scripts"
Cohesion: 0.20
Nodes (9): name, private, scripts, build, dev, lint, preview, type (+1 more)

### Community 10 - "Firestore Data Model"
Cohesion: 0.31
Nodes (9): Centralized Firebase Access and Path Construction, users/{uid} Data Model, expenditure_records collection, expense_categories collection, Cloud Firestore, income_records collection, income_sources collection, investment_categories collection (+1 more)

### Community 11 - "Agent Instructions and Spec"
Cohesion: 0.67
Nodes (3): CLAUDE.md MyExpenseLog Agent Instructions, Optional Agent Workflows (/graphify, /ponytail, /taste, /impeccable, /review), MyExpenseLog Project Spec

## Ambiguous Edges - Review These
- `Firestore Security Rules (owner-only users/{uid}/**)` → `Devil's Advocate Rule Attack`  [AMBIGUOUS]
  docs/firebase-security.md · relation: conceptually_related_to
- `Firestore Security Rules (owner-only users/{uid}/**)` → `Rule-Validated Writes (amount, date)`  [AMBIGUOUS]
  docs/firebase-security.md · relation: conceptually_related_to

## Knowledge Gaps
- **86 isolated node(s):** `$schema`, `typescript`, `oxc`, `react/rules-of-hooks`, `warn` (+81 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Firestore Security Rules (owner-only users/{uid}/**)` and `Devil's Advocate Rule Attack`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Firestore Security Rules (owner-only users/{uid}/**)` and `Rule-Validated Writes (amount, date)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `Firestore Security Rules (owner-only users/{uid}/**)` connect `Security Rules and Testing` to `Product Spec and Architecture Rules`, `Firestore Data Model`, `Build, Deploy and Setup`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Why does `firebase.json Hosting and Rules Config` connect `Build, Deploy and Setup` to `Security Rules and Testing`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Why does `website/index.html Vite Entry` connect `Build, Deploy and Setup` to `App Entry and Lint Rules`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `users/{uid} Data Model` (e.g. with `Centralized Firebase Access and Path Construction` and `Non-negotiable Rules`) actually correct?**
  _`users/{uid} Data Model` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `Firestore Security Rules (owner-only users/{uid}/**)` (e.g. with `Build and Deploy Commands` and `Firestore Security Requirements and Review`) actually correct?**
  _`Firestore Security Rules (owner-only users/{uid}/**)` has 5 INFERRED edges - model-reasoned connections that need verification._