<h1 align="center">🎬 CineStage <span align="right">— Frontend</span></h1>

<p align="center">
  A Next.js frontend for a cinema booking and management system — customer booking flow and a full admin panel, built to run against the CineStage Spring Boot backend.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js%2016-000000?style=flat&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/React%2019-61DAFB?style=flat&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript%205.7-3178C6?style=flat&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS%204-06B6D4?style=flat&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/pnpm-F69220?style=flat&logo=pnpm&logoColor=white" />
  <img src="https://img.shields.io/badge/Netlify-00C7B7?style=flat&logo=netlify&logoColor=white" />
</p>

---

## 📖 About

**CineStage** is a cinema ticket booking platform. This repository is the **frontend** — a Next.js (App Router) client providing a customer-facing browsing/booking flow and a separate `/admin` panel for managing the entire cinema catalogue and schedule.

It's built to talk to the **CineStage backend** — a Spring Boot REST API handling cities, theatres, screens, seats, shows, users, and bookings, including live poster data fetched from TMDB.

---

## 🔗 Related Repositories

| Repo | Description |
|---|---|
| **Backend** | [CineStage Backend](https://github.com/Soumadeep1221/CineStage-Backend) — Spring Boot REST API this app consumes |
| **Frontend** (this repo) | Next.js client — customer booking flow + admin panel |

---

## 🌐 Live Demo

- **Live app:** [https://cinestage-soumadeep1221.netlify.app](https://cinestage-soumadeep1221.netlify.app)
- **Backend (Render):** [https://cinestage-1-0.onrender.com](https://cinestage-1-0.onrender.com)

> **Please be patient on the first request.** The frontend runs on Netlify, the backend on Render's free plan, and the database on Neon's free plan. After a period of inactivity, Render spins the backend down (after about 15 minutes) and Neon scales the database to zero. The first request then has to wake both up, which can take a couple of minutes (roughly 2 to 2.5 minutes). Nothing is broken and it will not crash. Once everything is awake, the app responds normally.

The customer experience (browse, filter, book, cancel) needs no login. The admin panel at `/admin` is protected by a private admin login, so visitors can see the login screen but cannot manage data.

If you find an error, a bug, or any loophole while exploring the app, please let me know.

---

## ✨ What It Includes

### 🎟️ Customer Experience
- Browse movies by city, genre, language, and search term
- View theatre showtimes by movie and date
- Select available seats for a show
- Register and sign in
- Create, view, and cancel bookings
- Switch between dark and light themes

### 🛠️ Admin Experience

Available at `/admin` after signing in with the admin credentials — manage:
- Movies (including update/delete)
- Cities and theatres
- Screens and seats
- Shows and ticket prices
- Users
- Bookings and booking status

The Shows tab supports filtering by screen and date via the screen/date API endpoint.

### 🔐 Admin Login

- `/admin` shows a username and password form instead of the panel
- On success, the backend returns a JWT, which is kept in `sessionStorage` (cleared when the tab closes)
- Every admin request automatically sends it as an `Authorization: Bearer <token>` header
- If the backend rejects the token (for example, it expired), the token is cleared and the login form appears again
- A **Logout** button clears the token on demand

---

## 🧩 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI Library | React 19 |
| Language | TypeScript 5.7 |
| Styling | Tailwind CSS 4 + project CSS variables |
| Icons | Lucide React |
| Backend | Spring Boot REST API (JWT-protected admin endpoints) |
| Hosting | Netlify |

---

## 🚢 Deployment

The frontend is deployed on **Netlify**, with the backend on Render and the database on Neon.

1. Connected this GitHub repo to Netlify
2. Set `NEXT_PUBLIC_API_BASE_URL` to the Render backend URL (no trailing slash)
3. Set the backend's `FRONTEND_URL` to the Netlify URL so CORS allows requests from it
4. Turned off the "Powered by Netlify" badge in the project settings

---

## 📋 Requirements

- Node.js 20.9 or newer
- A running CineStage backend API, normally at `http://localhost:8080`
- Either **pnpm 8+** or **npm**

---

## 🚀 Setup

Install dependencies:

```bash
pnpm install
# or
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

For a local backend, the defaults work as-is when the backend listens on port `8080`. Only set `NEXT_PUBLIC_API_BASE_URL` if your backend runs somewhere else.

---

## ⚙️ Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | No | Backend origin, no trailing slash. Defaults to the same-origin `/api` rewrite, which targets `http://localhost:8080`. |
| `NEXT_PUBLIC_SHOW_START_DATE` | No | Schedule anchor in `YYYY-MM-DD` format. The date strip labels this date as "Today"; if omitted, the local current date is used. |

Example (local):

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_SHOW_START_DATE=2026-09-23
```

Example (production):

```env
NEXT_PUBLIC_API_BASE_URL=https://cinestage-1-0.onrender.com
```

When `NEXT_PUBLIC_API_BASE_URL` is empty, the browser calls `/api/...` and `next.config.mjs` rewrites those requests to `http://localhost:8080/api/...`. When it's set, the frontend calls that backend origin directly — so the backend must allow the frontend's origin through CORS if they're hosted separately.

---

## ▶️ Running Locally

```bash
pnpm dev
# or
npm run dev
```

Then open:
- Customer app: `http://localhost:3000`
- Admin panel: `http://localhost:3000/admin` (requires the admin credentials set on your backend)

---

## 📦 Production Build

```bash
pnpm build
pnpm start
```

Equivalent npm commands:

```bash
npm run build
npm run start
```

---

## 🔌 Backend API Coverage

The frontend consumes the endpoints described in [`api-docs.json`](api-docs.json), including:

- **Admin auth** — `/api/auth/admin/login`
- **Cities** — `/api/cities`
- **Movies** — `/api/movies`, search, genre, language, update, delete
- **Theatres & Screens** — `/api/theatres`, `/api/screens`, city/theatre filters
- **Seats** — `/api/seats`, available-seat lookup for a show
- **Shows** — `/api/shows`, `/api/shows/movie/{movieId}`, `/api/shows/movie/{movieId}/date`, `/api/shows/screen/{screenId}/date`
- **Users** — registration, login, list, lookup
- **Bookings** — create, lookup, user history, available seats, cancellation

The API spec lists the backend server as `http://localhost:8080`. Make sure the backend is running and its database contains the cities, movies, theatres, screens, seats, and shows needed for the selected date.

---

## 🗂️ Project Structure

```text
app/
    admin/page.tsx       Admin route (login gate in front of the panel)
    layout.tsx           Root metadata, theme bootstrap, global CSS
    page.tsx             Customer route
components/
    cinema-app.tsx       Customer browsing, booking, seat-selection flows
    admin-panel.tsx      Admin management tabs
    auth-screen.tsx      Login and registration UI
    ui/                  Shared UI components
lib/
    utils.ts             Shared utilities
public/                  Static assets
api-docs.json            Backend OpenAPI specification
```

---

## ✅ Validation

No test script is currently defined. Run the TypeScript checker before submitting changes:

```bash
pnpm typecheck
# or
npm run typecheck
```

---

## 📌 Known Limitations

- The frontend was generated with AI tooling, so it may have small rough edges; the backend was built from scratch
- Customer login is not token-based; JWT protects the admin endpoints only
