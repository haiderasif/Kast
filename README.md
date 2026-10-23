# Kast

Kast is a React frontend with an Express backend. Authentication users are
stored in Firebase Authentication; the backend issues its own JWT after login.

## Prerequisites

- Node.js 20 or newer (Node 18 should also work)
- npm
- A Firebase project with Email/Password Authentication enabled
- A Firebase Admin SDK service-account JSON key
- A Firebase Web API key (from a registered Firebase web app)

## Configuration

1. Copy `backend/.env.example` to `backend/.env` and replace the placeholder
   values. The comments in that file explain how to generate the JWT secret and
   download the Firebase credential.
2. Copy `frontend/.env.example` to `frontend/.env`. Its local default normally
   needs no changes.

Never commit `.env` or the Firebase service-account JSON. If credentials have
previously been committed or shared, revoke the Firebase key and generate a new
one, and rotate `JWT_SECRET`.

## Run locally

Use two terminals from the repository root.

Terminal 1 (backend):

```bash
cd backend
npm install
npm start
```

Terminal 2 (frontend):

```bash
cd frontend
npm install
npm start
```

Open http://localhost:3000. The API listens on http://localhost:5001.

For backend development with automatic restart, use `npm run dev` instead of
`npm start` (requires a Node.js version that supports `node --watch`).

## Firebase setup checklist

1. Create/select a project at https://console.firebase.google.com/.
2. Enable **Build -> Authentication -> Sign-in method -> Email/Password**.
3. Open **Project settings -> Service accounts -> Firebase Admin SDK**.
4. Select **Generate new private key**, download the JSON, and save it in
   `backend/`.
5. Put that filename in `backend/.env` as
   `FIREBASE_SERVICE_ACCOUNT_PATH=the-downloaded-filename.json`.
6. In **Project settings -> General -> Your apps**, register/select a web app,
   copy its `apiKey`, and set it as `FIREBASE_WEB_API_KEY` in `backend/.env`.

The Firebase Web API key is used by the backend to verify the submitted
email/password. The service-account JSON is the sensitive Admin credential;
never expose that file to the browser.

This prototype does not have an email-delivery provider. After registration,
open the verification link printed in the backend terminal before logging in.
