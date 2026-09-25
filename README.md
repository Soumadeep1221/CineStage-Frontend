# CineStage Frontend

CineStage is a Next.js frontend for a cinema booking and management system. It provides a customer booking flow and an admin panel for managing the cinema catalogue and schedules.
## What It Includes

### Customer experience
- Browse movies by city, genre, language, and search term
- View theatre showtimes by movie and date
- Select available seats for a show
- Register and sign in
- Create, view, and cancel bookings
- Switch between dark and light themes
### Admin experience

Open `/admin` to manage:
- Movies, including update and delete operations
- Cities and theatres
- Screens and seats
- Shows and ticket prices
- Users
- Bookings and booking status
The Shows tab supports filtering shows by screen and date through the screen/date API endpoint.

## Technology
- Next.js 16 App Router
- React 19
- TypeScript 5.7
- Tailwind CSS 4 and project CSS variables
- Lucide React icons
- Spring Boot-compatible REST API
## Requirements

- Node.js 20.9 or newer
- A running CineStage backend API, normally at `http://localhost:8080`
- Either pnpm 8+ or npm
## Setup

Install dependencies with the package manager you use for local development:
```bash
pnpm install
# or
npm install
```
Create a local environment file:

```bash
cp .env.example .env.local
```
On Windows PowerShell, use:

```powershell
Copy-Item .env.example .env.local
```
For a local backend, the default configuration works when the backend listens on port `8080`. Set `NEXT_PUBLIC_API_BASE_URL` when the backend runs somewhere else.

## Environment Variables
| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | No | Backend origin, without a trailing slash. Defaults to the same-origin `/api` rewrite, which targets `http://localhost:8080`. |
| `NEXT_PUBLIC_SHOW_START_DATE` | No | Schedule anchor in `YYYY-MM-DD` format. The date strip labels this date as “Today”; if omitted, the local current date is used. |

Example:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_SHOW_START_DATE=2026-09-23
```
When `NEXT_PUBLIC_API_BASE_URL` is empty, the browser calls `/api/...` and `next.config.mjs` rewrites those requests to `http://localhost:8080/api/...`. When it is set, the frontend calls that backend origin directly, so the backend must allow the frontend origin through CORS if they are hosted on different origins.

## Running Locally
Start the development server:

```bash
pnpm dev
# or
npm run dev
```
Then open:

- Customer app: `http://localhost:3000`
- Admin panel: `http://localhost:3000/admin`
## Production Build

```bash
pnpm build
pnpm start
```
The equivalent npm commands are:

```bash
npm run build
npm run start
```
## Backend API Coverage

The frontend uses the backend endpoints described in [api-docs.json](api-docs.json), including:
- Cities: `/api/cities`
- Movies: `/api/movies`, search, genre, language, update, and delete endpoints
- Theatres and screens: `/api/theatres`, `/api/screens`, and city/theatre filters
- Seats: `/api/seats` and available-seat lookup for a show
- Shows: `/api/shows`, `/api/shows/movie/{movieId}`, `/api/shows/movie/{movieId}/date`, and `/api/shows/screen/{screenId}/date`
- Users: registration, login, list, and lookup
- Bookings: create, lookup, user history, available seats, and cancellation
The API specification lists the backend server as `http://localhost:8080`. Make sure the backend is running and its database contains the cities, movies, theatres, screens, seats, and shows needed for the selected date.

## Project Structure
```text
app/
	admin/page.tsx       Admin route
	layout.tsx           Root metadata, theme bootstrap, and global CSS
	page.tsx             Customer route
components/
	cinema-app.tsx       Customer browsing, booking, and seat-selection flows
	admin-panel.tsx      Admin management tabs
	auth-screen.tsx      Login and registration UI
	ui/                  Shared UI components
lib/
	utils.ts             Shared utilities
public/                Static assets
api-docs.json          Backend OpenAPI specification
```
## Validation

The project does not currently define a test script. Run the TypeScript checker before submitting changes:

```bash
pnpm typecheck
# or
npm run typecheck
```
## License

Private project.
