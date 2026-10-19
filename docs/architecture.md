# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Build the React UI around route-level pages for activities, teams, leaderboard, and workouts, using the shared API client in `octofit-tracker/frontend/src/api` and accessible loading/empty/error states for every capability.
- Logic tier decision: Keep route handlers thin and move business rules into Express services so validation, 4xx handling, calculations, and aggregation are testable without leaking data-layer concerns into the HTTP layer.
- Data tier decision: Define strict Mongoose schemas for users, teams, activities, and workouts, with required identity and business fields enforced in the model layer and seed data created idempotently with safe upserts and membership reconciliation.
- Activity tracking approach: Validate `userId` and `teamId` as real ObjectIds, reject invalid or missing references with deliberate 4xx responses, then persist the submitted `user`, `team`, `type`, and `minutes`, along with computed `points` and `occurredAt`.
- Team management approach: Require a team `name` and `mascot` at creation time, default `members` to an empty array, and preserve member references as ObjectIds while exposing them cleanly to API consumers.
- Leaderboard approach: Aggregate team totals from activity points, sort descending by total points, and assign a 1-based rank so the leaderboard is deterministic and easy to render in the UI.
- Workout suggestions approach: Resolve the user by email, inspect recent activity patterns or the user’s fitness goal, and rank workout suggestions by a reasoned match to the user’s training pattern, returning a 4xx for unknown emails.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`  
  Fails when the Mongoose contracts for `User`, `Team`, `Activity`, or `Workout` are missing required fields or the seeded demo dataset does not reconcile team membership idempotently. This is the earliest signal that the data layer is not satisfying the shared contract.
- API command: `npm run test:api --prefix octofit-tracker/backend`  
  Fails when the route layer is not validating input, returning deliberate 4xxs for invalid IDs or missing users, or computing the expected activity/team/leaderboard/workout behaviors. This confirms whether the logic tier matches the API contract.
- Frontend command: `npm test --prefix octofit-tracker/frontend`  
  Fails when the presentation layer does not fetch the right endpoints, render the returned data, or surface loading/empty/error states in an accessible way. This is the final integration signal for the UI contract.
- Backend build command: `npm run build --prefix octofit-tracker/backend`  
  Catches TypeScript and Express configuration issues before runtime; a failure here means the server cannot compile cleanly even if the tests are not yet green.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`  
  Catches React/Vite/TypeScript issues in the presentation tier and ensures the app can build successfully after the component contract is implemented.

Current observed failure pattern: the data-tier contract fails first (required schema fields and demo seed expectations), the API contract fails next (activity, team, leaderboard, and workout endpoints), and the frontend contract fails last (route rendering and accessible state handling). This ordering confirms the safe implementation sequence: data model -> API logic -> presentation UI.
