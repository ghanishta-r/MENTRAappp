# MENTRA

A mentorship and networking platform for college students. Students find mentors, send requests, schedule
sessions, track learning goals, receive resources and rate the experience. Mentors manage requests,
availability, students, sessions, resources and reviews.

**Stack:** HTML5 · CSS3 · JavaScript · Bootstrap 5 · Node.js + Express · MongoDB + Mongoose · JWT + bcrypt · Python (optional matching module)

## Run locally

Requirements: Node 18.11+, MongoDB (local, or a free MongoDB Atlas cluster).

```bash
npm install
cp .env.example .env        # Windows: copy .env.example .env
# edit .env: set JWT_SECRET (and MONGO_URI if not using local MongoDB)
npm run dev
```
Open http://localhost:5000

Generate a secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

### Demo / test accounts
There is **no seeded or fake data**. To demo, register two accounts (use two different browsers or one normal and one private window):
1. Register as **Mentor** → complete the profile (headline, bio, skills, availability).
2. Register as **Student** → complete the profile (interests + learning goals) → **Discover Mentors** → send a request.
3. As the mentor: accept the request → schedule a session → mark it completed.
4. As the student: log goals/progress, view resources, rate the session.

## MongoDB connection
`server/config/db.js` reads `MONGO_URI` from `.env` (never hardcoded; `.env` is git-ignored).
Local: `mongodb://127.0.0.1:27017/mentra`. Atlas: use the `mongodb+srv://...` string from the Atlas dashboard.
Collections and indexes are created automatically by Mongoose on first run.

## Authentication
- Passwords hashed with bcrypt (12 rounds) in `models/User.js`.
- Login issues a JWT stored in an **httpOnly, SameSite=Strict cookie** (`mentra_token`), so it is not readable by page JavaScript and no auth data lives in localStorage. `Secure` is enabled automatically when `NODE_ENV=production` (requires HTTPS).
- `middleware/auth.js`: `protect` verifies the token on every `/api` route except `/auth/*`, `/health`, `/public/stats`; `requireRole('mentor'|'mentee')` enforces roles.
- Every query is scoped to the logged-in user (e.g. you can only act on your own requests, sessions and goals; mentors can view goals only of students they are connected to).
- Also: Helmet (CSP), rate limiting (global + stricter on login/register), request validation (`middleware/validate.js`), NoSQL-operator stripping (`middleware/sanitize.js`), 100 kb body limit, central error handler.

## Knowledge Base (past solutions)
Students and mentors record a problem and the solution that worked, optionally linked to a completed session, with category and tags.
Anyone can search (title, problem, solution, tags), filter by category/tag, sort by newest, most helpful or most viewed, and mark entries helpful (one vote each, not your own).
Files: `models/KnowledgeEntry.js`, `controllers/knowledgeController.js`, `public/pages/knowledge.html`, `public/js/knowledge.js`. API: `GET/POST /knowledge`, `GET /knowledge/tags`, `GET/PUT/DELETE /knowledge/:id`, `POST /knowledge/:id/helpful`.

## Alpha test tooling
- Thumbs up/down on every match (mentor cards, mentor profile, incoming requests) stored in `MatchFeedback` with the server-computed score at that moment.
- Set `ALPHA_ADMIN_EMAILS=you@college.edu` in `.env`; that account gets an **Alpha Report** page (precision, good-rate by score bucket, false positives/negatives, CSV export).
- `npm run smoke` runs an automated end-to-end check of the whole journey against a running server.
- The test protocol, tasks, metrics and survey are in `docs/ALPHA_TEST_PLAN.md`.

## Matching (what is real)
`server/services/matchService.js` scores mentors for a student from real profile data:
shared topics (interests/skills vs mentor skills/expertise/interests), text relevance of goals vs mentor bio/headline, experience, and ratings.
- Default engine: transparent keyword/topic overlap. It is **not** machine learning and the UI does not claim it is.
- Optional Python engine: `ai/matcher.py` (TF-IDF + cosine similarity, standard library only). Enable with `AI_ENABLED=true`. Falls back automatically if Python is unavailable.
- Each score carries `engine` (`keyword-overlap` or `python-tfidf`) and the shared topics that produced it. Scores are `null` (hidden) if the student has no interests/goals.
- Future: replace `score()` in `ai/matcher.py` with embeddings or a trained ranker; the stdin/stdout contract stays the same. See `ai/README.md`.

## Features → files
| Feature | Backend | Frontend |
|---|---|---|
| Register / login / logout | `controllers/authController.js`, `routes/authRoutes.js` | `pages/login.html`, `register.html`, `js/auth.js` |
| Profiles (mentee, mentor, availability) | `profileController.js`, `routes/profileRoutes.js`, `models/MentorProfile.js`, `MenteeProfile.js` | `pages/profile.html`, `js/profile.js` |
| Dashboards | `dashboardController.js` | `pages/dashboard.html`, `js/dashboard.js` |
| Mentor discovery, search, filters, profile | `mentorController.js` | `discover.js`, `mentor.js` |
| Requests, accept / decline / cancel | `requestController.js` | `requests.js` |
| Connections | `connectionController.js` | `connections.js` |
| Sessions (conflict checks, reschedule, notes) | `sessionController.js` | `sessions.js` |
| Goals + progress history + mentor notes | `goalController.js` | `goals.js` |
| Resources (public or private share) | `resourceController.js` | `resources.js` |
| Feedback and ratings | `feedbackController.js` | `feedback.js` |
| Notifications | `notificationController.js`, `services/notifyService.js` | `notifications.js`, bell badge in `ui.js` |
| App shell, modals, toasts, tag input | | `js/ui.js`, `js/api.js`, `css/style.css` |

All routes are declared in `server/routes/index.js`.

## API summary (all under `/api`)
`POST /auth/register|login|logout` · `GET /auth/me` · `GET|PUT /profiles/me` · `GET /dashboard`
`GET /mentors` (mentee) `?q&skills&expertise&department&minRating&available&sort&page` · `GET /mentors/facets` · `GET /mentors/:id`
`POST /requests` · `GET /requests?status=` · `PATCH /requests/:id/respond|cancel`
`GET /connections` · `PATCH /connections/:id/end`
`POST|GET /sessions` · `PATCH /sessions/:id`
`POST|GET /goals` · `PUT|DELETE /goals/:id` · `GET|POST /goals/:id/progress`
`GET|POST /resources` · `DELETE /resources/:id`
`POST /feedback` · `GET /feedback/mine|received`
`GET /notifications` · `GET /notifications/unread-count` · `PATCH /notifications/read-all|:id/read`

## Deploying
- Set `NODE_ENV=production`, a strong `JWT_SECRET`, an Atlas `MONGO_URI`, and serve behind HTTPS (cookies are `Secure` in production). `trust proxy` is enabled in production for platforms like Render/Railway/Heroku.
- Bootstrap, Bootstrap Icons and the Google font load from CDNs. For a hardened deployment, self-host them and add SRI hashes.

## Known limits / next steps
- Discovery with "best match" ranks up to the top 300 filtered mentors in memory; fine for a campus, switch to precomputed scores for much larger catalogs.
- No email delivery, password reset, avatar upload or in-app chat yet.
- No automated test suite yet; a good next step is API tests with Jest + supertest + mongodb-memory-server.
