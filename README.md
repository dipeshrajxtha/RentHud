# RentHub

A complete digital tenancy management platform — not just a listing site.

## Architecture

| Codebase | Stack | Path |
|----------|-------|------|
| **API** | Node.js, Express, PostgreSQL + PostGIS | `server/` |
| **Web** | React, TypeScript, Vite | `web/` |
| **Mobile** | Flutter | `mobile/` |
| **Shared** | Cross-platform contracts | `shared/` |

## Core Features

- Google-only authentication with JWT + RBAC (tenant / landlord / admin)
- Multi-floor property system with normalized amenities
- PostGIS geospatial search with exponential radius visualization
- Rental lifecycle: listings → applications → agreements → tenancies
- One active tenancy per tenant (enforced at DB level)
- Payments, utility meter tracking, digital document vault
- Maintenance request dashboards (request → assign → resolve)
- Separate dispute flows: listing disputes & tenancy disputes
- Real-time notifications via WebSocket
- Rule-based BANT-style chatbot for soft leads

## Prerequisites

- Node.js >= 20 (see `.nvmrc`)
- PostgreSQL 16+ with PostGIS extension
- Flutter SDK >= 3.x
- Docker & Docker Compose (for local dev)

## Getting Started

```bash
# Clone the repo
git clone https://github.com/<your-username>/RentHub.git
cd RentHub

# Start infrastructure (Postgres + PostGIS, Redis)
docker compose up -d

# API server
cd server
cp .env.example .env    # configure your env vars
npm install
npm run migrate
npm run dev

# Web client
cd web
npm install
npm run dev

# Mobile
cd mobile
flutter pub get
flutter run
```

## Project Structure

```
RentHub/
├── docs/           # Architecture, API specs, ERDs, phase plans
├── scripts/        # Dev/deploy automation
├── server/         # Node + Express API (20 domain modules)
├── web/            # React + TypeScript + Vite frontend
├── mobile/         # Flutter mobile app
├── shared/         # Cross-platform enums, types, schemas
└── infra/          # Docker, Nginx, CI configs
```

## Development Phases

| Phase | Scope |
|-------|-------|
| 1 | Auth, Users, RBAC |
| 2 | Properties, Floors, Amenities, Verification |
| 3 | PostGIS Search, Map UI, Radius Visualization |
| 4 | Listings, Applications, Agreements, Tenancies |
| 5 | Payments, Utilities |
| 6 | Maintenance Dashboards |
| 7 | Disputes (Listing + Tenancy) |
| 8 | Notifications, Chatbot, Document Vault |
| 9 | Admin Panel, Rules Engine |
| 10 | Mobile Feature Parity |

## License

Private — All rights reserved.
