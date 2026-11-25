# MENTRA

A student-first mentoring platform built with vanilla JavaScript, Bootstrap, Express, MongoDB, and a Python NLP matching service.

## Run locally

1. Install Node.js 20+ and MongoDB Community Server (or use a MongoDB Atlas connection string).
2. Copy `.env.example` to `.env` and set a long, unique `JWT_SECRET` and your database URI.
3. Run `npm install`, then `npm run dev`.
4. Open `http://localhost:3000`. The web app runs without Python; Python enables richer semantic recommendations.

To preview without MongoDB, run `npm run preview` and open `http://localhost:4173` for the Milestone 2 architecture and database design page. The mentorship product UI is at `http://localhost:4173/app`. Sign-in and persistent features require the full app and MongoDB.

Install the optional Python matcher with `python -m venv .venv`, activate it, and run `pip install -r services/recommender/requirements.txt`. Set `PYTHON_BIN` in `.env` if the Python executable is not named `python`. Express sends profile data as JSON over stdin to `ai/matcher.py`; if Python or scikit-learn is unavailable, discovery falls back to transparent skills and interests overlap. `services/recommender/app.py` also provides an optional HTTP wrapper around the same matcher.

## Layout

- `public/`: responsive browser interface and UI interactions.
- `server/`: Express API, Mongo connection, models, auth, and routes.
- `services/recommender/`: optional FastAPI semantic matching service.

## Milestone 2 architecture

The browser uses JSON REST endpoints in Express. Mongoose persists 11 collections: `User`, `MentorProfile`, `MenteeProfile`, `MentorshipRequest`, `MentorshipConnection`, `Session`, `Goal`, `Progress`, `Resource`, `Feedback`, and `Notification`. Profile records are split by role; accepting a request creates a connection; sessions belong to connections; feedback belongs to a completed session; and every goal progress change is recorded in `Progress`.

If you already have records from the original MENTRA schema, set `MONGODB_URI` to that database and run `npm run migrate:milestone2` once before starting the updated app. The migration copies embedded profiles into the role-specific collections, connects accepted requests and sessions, and records each existing goal's current progress without deleting the original fields.

The Python recommendation module uses the stdin JSON interface shown in the reference architecture. A FastAPI wrapper is also available for a future separated deployment; the recommendation payload contains profile fields only.

## Product and data notes

Create a mentee or mentor account to use the platform. Mentor discovery is populated from real mentor profiles stored in MongoDB. Match explanations use profile overlap; an optional Python service adds TF-IDF similarity across the student's learning goals and mentors' bios. There are no seeded demo people or fabricated match percentages.

The API uses hashed passwords, JWTs in HttpOnly cookies, input validation, rate limiting, secure headers, ownership checks, and role checks. Before public launch, configure HTTPS, a managed MongoDB deployment and backups, a production-grade secret, origin allowlists, email verification/password recovery, moderation, and privacy/retention policies.
