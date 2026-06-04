# RAD5 Café

Smart wallet-powered café ordering and management platform.

## Stack

- **Frontend:** React Router v7, React 19, Tailwind CSS v4
- **Backend:** Firebase Auth, Firestore
- **Payments:** Paystack Inline
- **API:** Express (external)

## Setup

```bash
npm install
```

Copy `.env.example` to `.env` and fill in your Firebase and API credentials.

## Development

```bash
npm run dev
```

Available at `http://localhost:5173`.

## Build

```bash
npm run build
```

Outputs to `build/` — client assets in `build/client/` and server code in `build/server/`.

## Start Production

```bash
npm start
```

## Routes

| Path | Description |
|------|-------------|
| `/` | User dashboard & wallet |
| `/cafe` | Café menu & ordering |
| `/history` | Transaction history |
| `/profile` | User profile |
| `/login` | Login / Register |
| `/admin` | Admin panel — overview, stats, wallet ops |
| `/inventory` | Inventory manager & restock |
| `/sales` | Sales logs |
| `/analytics` | Revenue & product analytics |
| `/reports` | Export reports (PDF, Excel, CSV) |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL |
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_GOOGLE_WEB_CLIENT_ID` | Google OAuth web client ID |
