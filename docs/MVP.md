# Quarter Planner — Canonical MVP Specification

## 1. Core Domain Model
* **Workspace**: The root tenant. Contains Teams, People, and Planning Periods.
* **Planning Period**: A timeframe (e.g., Q4 2026), configurable iterations (default 14 days).
* **Team**: Owns Tasks. Represents a specific product or group.
* **Resource Type**: Custom competencies (e.g., Backend, Design). Global for the Workspace to allow cross-team capacity aggregation.
* **Person**: An employee. Has a base capacity and belongs to a **Home Team** (manager's ownership). Can be allocated to other teams (shared) either permanently or temporarily (with `dateStart` and `dateEnd`).
* **Goal**: Standalone business objective for the period.
* **Initiative**: Cross-team initiative containing multiple Tasks. Points to Goals.
* **Task**: An actionable item owned by ONE Team, linked to an Initiative/Goal, estimated in person-days per Resource Type.

## 2. Access Control (Role-Based)
* **Owner**: Full access. Can manage users' roles.
* **Admin**: Manage Teams, People, Resource Types, Calendar, and setup Planning.
* **Planner**: Manage Goals, Initiatives, Tasks, Schedule, Timeline, Forecast, and Fact. Cannot edit global Team/People dictionaries.
* **Viewer**: Read-only access to the Workspace.

## 3. Key Functionality
* **Organization**: Manage custom Resource Types, People (grouped by Home Team in UI), and their temporary/permanent allocations across Teams.
* **Timeline & Plan**: Drag-and-drop Tasks across Iterations. Create inter-task dependencies.
* **Capacity Engine**: Auto-calculate Team x Resource Type x Iteration capacity based on workdays, holidays, and temporary allocations. Display Overcapacity.
* **Planning Checks**: Client-side warnings (overcapacity, missing estimates, backward dependencies).
* **Tracking Lifecycle**:
  1. **Baseline**: Lock the initial plan (read-only snapshot).
  2. **Forecast**: Ongoing adjustments to the plan (requires "Change reason" if shifted).
  3. **Fact**: Logging actual completion dates and effort.
* **Review**: Dashboard comparing Baseline vs Forecast vs Fact.
* **Backup**: Export/Import entire Workspace as a JSON file.

## 4. Out of Scope for MVP
* Integrations (GitLab, Miro, Slack, Email).
* AI/LLMs.
* Timesheets & Financial tracking.
* Custom backend or Cloud Functions.
* Multiple baselines or automated re-baselines.
