## goComet Ride

A simple two-part app for booking and taking rides. The driver accepts a ride and it starts immediately.

### Features
- Rider requests rides; real‑time updates via WebSockets
- Driver sees nearby requests and accepts a ride
- Ride starts immediately on accept .
- Trip creation and status updates backed by Prisma

### Tech Stack
- Backend: Node.js, Express, Prisma, Socket.IO
- Frontend: React (Vite), TailwindCSS, Axios
- DB: PostgreSQL (via Prisma). Redis for caching. Optional MongoDB for legacy code paths.

### Project Structure
- Backend/ — Express API, Prisma schema, Socket.IO, Docker files
- frontend/ — React app (Vite)

---

## Local Development (without Docker)

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL running locally (or via Docker, see below)

### Environment
Create Backend/.env:


NODE_ENV=development
PORT=3000
JWT_SECRET=your_jwt_secret
DATABASE_URL=postgresql://user:pass@localhost:5432/gocomet
REDIS_URL=redis://localhost:6379


Create frontend/.env:


VITE_BASE_URL=http://localhost:3000


### Install & Run

cd Backend
npm install
npx prisma migrate dev
npx prisma generate
npm run dev



cd frontend
npm install
npm run dev


Open the frontend URL printed by Vite (usually http://localhost:5173).

---

## Docker Setup (recommended for infra)

This repo includes Docker files under Backend/ for running required infrastructure (PostgreSQL, Redis, optional MongoDB) and for building the backend image.

### Option A: Run only the infrastructure with Docker (develop app locally)
This is the most convenient dev setup: databases in Docker, apps run locally.


cd Backend
docker compose -f docker-compose.dev.yml up -d


Environment to use in Backend/.env when using compose defaults:


DATABASE_URL=postgresql://gocomet:gocomet123@localhost:5432/gocomet_daw
REDIS_URL=redis://localhost:6379


Then run backend and frontend locally as shown above.

To stop infra:

cd Backend
docker compose -f docker-compose.dev.yml down


### Option B: Run infrastructure and build the backend container
Build and run the backend in Docker while still running the frontend locally.

1) Start infra:

cd Backend
docker compose -f docker-compose.dev.yml up -d


2) Build backend image:

cd Backend
docker build -t gocomet-backend:latest .


3) Run backend container (mapping env and port):

docker run --name gocomet-backend \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e JWT_SECRET=your_jwt_secret \
  -e DATABASE_URL=postgresql://gocomet:gocomet123@host.docker.internal:5432/gocomet_daw \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  -p 3000:3000 \
  --add-host=host.docker.internal:host-gateway \
  gocomet-backend:latest
  
# New Relic Monitoring 
NEW_RELIC_LICENSE_KEY=your-new-relic-license-key
NEW_RELIC_APP_NAME=GoComet DAW

Set the frontend to point at the backend container:

VITE_BASE_URL=http://localhost:3000


4) Stop containers when done:

docker stop gocomet-backend && docker rm gocomet-backend
cd Backend && docker compose -f docker-compose.dev.yml down


### Option C: Full docker-compose stack for infra only (dbs) – already provided
There is also Backend/docker-compose.yml with similar services (infra). Use the .dev.yml during development; the non-dev file is equivalent for infra and can be adapted for production orchestration.

> Note: The frontend does not currently include a Dockerfile. It is typically run locally during development. You can add one later if desired.

---

## Key API Endpoint (v1)
- POST /v1/drivers/:id/accept — driver accepts a ride; ride starts immediately, emits ride-started.

Sockets
- Rider listens for ride-started to enter the riding view.
- Driver navigates to /captain-riding after accepting.

---

## Scripts
Backend:
- npm run dev — start in watch mode
- npm start — start server

Frontend:
- npm run dev — start Vite
- npm run build — production build
- npm run preview — preview build

---

## Troubleshooting
- Ensure VITE_BASE_URL matches your backend URL.
- If using Docker for infra, use the compose-provided credentials in DATABASE_URL.
- Run npx prisma migrate dev against the active database before starting the backend.
- If Socket.IO doesn’t connect, verify both servers are running and CORS is configured.
