# Quarter Planner - Engineering Constraints & Rules

## 1. Product & Architecture
* **Purpose**: Cross-team quarterly planning and review tool.
* **Agnostic Model**: MUST NOT hardcode specific teams (e.g., MARS), roles (FE, BE), or fixed intervals (e.g., 2-week sprints). Everything must be configurable per Workspace.
* **Person vs User**: A `Person` (team capacity resource) is strictly separate from a `User` (authenticated account).
* **Checks Logic**: Planning checks are non-blocking warnings. They NEVER mutate the plan automatically.
* **No Fake UI**: All visible controls must work. No mocked metrics or placeholder alerts.

## 2. Tech Stack Strictness
* **Frontend**: React, TypeScript (strict), Vite, Tailwind CSS, React Hook Form, Zod, date-fns, dnd-kit, Recharts.
* **Routing**: HashRouter (mandatory for GitHub Pages).
* **Backend**: Firebase Auth, Cloud Firestore, Firebase Emulator Suite (for local dev & tests).
* **No-Cost Rule**: MUST run entirely on free tiers (Firebase Spark). NO Cloud Functions, NO paid backend, NO third-party APIs (OpenAI, Slack, etc.).
* **Language**: UI is 100% Russian. Code, variables, collections, and docs are 100% English.

## 3. Data & Security
* **Security Rules**: Firestore rules are mandatory ("Deny by default"). Strict isolation between Workspaces.
* **Dates**: Planning dates MUST be stored as `YYYY-MM-DD` strings. NEVER use timezone-dependent timestamps for planning periods or capacity math.
* **Baseline Immutability**: A created Baseline is a read-only snapshot. It cannot be silently mutated.

## 4. Work Process
* **Iterative Flow**: Build one vertical slice at a time. Do not move to the next until the current one works and is tested.
* **Git Safety**: Do not use destructive git commands (`git reset --hard`, `git clean`) unless explicitly required.
