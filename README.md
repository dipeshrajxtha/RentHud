# RentHub

A complete digital tenancy management platform — not just a listing site.

## Architecture (Modular Domain Monolith)

RentHub uses a domain-driven modular structure where backend, web, and mobile share symmetric domain boundaries.

```
RentHub/
├── server/                     # Node.js + Express + PostgreSQL (PostGIS)
│   ├── config/                 # Env & database connection pooling
│   ├── db/                     # PostGIS migrations & seeds
│   ├── src/
│   │   ├── common/             # Middleware (JWT/RBAC), utils, error handlers
│   │   └── modules/            # Core Domain Hubs
│   │       ├── auth/           # Google OAuth, JWT, sessions
│   │       ├── users/          # Tenant/Landlord/Admin profiles & lease limits
│   │       ├── properties/     # Properties, multi-floor, amenities, PostGIS geosearch, badges
│   │       ├── tenancy/        # Listings, applications, agreements, active tenancies
│   │       ├── finance/        # Rent payments, receipts, utility meter tracking
│   │       ├── maintenance/    # Request lifecycles, contractor dispatch
│   │       ├── disputes/       # Listing disputes & tenancy disputes (separate DB tables)
│   │       ├── communication/  # Real-time WebSocket notifications, document vault, BANT bot
│   │       └── admin/          # Platform metrics, moderation, audit logs
│   └── tests/                  # Integration tests & fixtures
│
├── web/                        # React + TypeScript + Vite
│   └── src/
│       ├── components/         # Reusable UI (Forms, Map, Layout, Feedback)
│       ├── features/           # Feature slices matching backend domains
│       ├── hooks/              # Custom hooks (auth, location, etc.)
│       ├── services/           # API clients
│       └── store/              # Global state (Zustand)
│
├── mobile/                     # Flutter mobile application
│   └── lib/
│       ├── core/               # Theme, network, route guards
│       ├── widgets/            # Shared mobile components
│       └── features/           # Mobile screens matching backend domains
│
├── shared/                     # Shared cross-platform contracts (enums, types, schemas)
├── infra/                      # Docker, Nginx, CI/CD pipelines
├── docs/                       # Architecture decisions, ERDs, API specs, phase plans
└── docker-compose.yml          # PostgreSQL 16 with PostGIS + Redis
```

## Core Features

- **Google-Only Auth & Multi-Role**: Google OAuth, JWT with refresh tokens, RBAC (`tenant`, `landlord`, `admin`), dynamic role switching without re-login.
- **Strict Tenancy Integrity**: Enforce exactly one active tenancy per tenant at the database constraint level.
- **Property System**: Multi-floor mapping, normalized amenities, landlord verification badges.
- **PostGIS Geospatial Engine**: Spatial indexing (`ST_DWithin`), exponential radius visualization, map pins with availability filtering.
- **Rental Lifecycle**: Listing publication → Tenant application → Digital rental agreement → Active tenancy state machine.
- **Finance & Utilities**: Rent payments, transaction history, digital receipts, utility meter logging (water/electric/gas).
- **Maintenance Dashboards**: Maintenance requests with photos, severity status, and contractor assignment.
- **Dual Dispute Resolution**: Dedicated database records and flows for **listing disputes** vs. **tenancy disputes**.
- **Digital Document Vault**: Encrypted cloud storage for lease contracts, ID verification, and payment receipts.
- **Communication & Lead Capture**: Real-time notifications via WebSockets, rule-based BANT qualification chatbot.

## Getting Started

```bash
# 1. Start database and cache
docker compose up -d

# 2. Start Backend API
cd server
cp .env.example .env
npm install
npm run migrate
npm run dev

# 3. Start Web Client
cd ../web
npm install
npm run dev

# 4. Start Mobile App
cd ../mobile
flutter pub get
flutter run
```

## Phased Implementation Roadmap

- **Phase 1**: Environment, Shared Contracts, Database Setup (PostGIS), Auth & Users (Google OAuth, JWT, RBAC)
- **Phase 2**: Properties, Multi-floor, Normalized Amenities, Verification Badges
- **Phase 3**: PostGIS Geospatial Search, Map UI, Exponential Radius Visualization
- **Phase 4**: Rental Lifecycle (Listings, Applications, Agreements, One Active Tenancy Enforcement)
- **Phase 5**: Payments & Utility Meter Tracking
- **Phase 6**: Maintenance Request Dashboards & Assignment Flow
- **Phase 7**: Dual Dispute Resolution (Listing vs. Tenancy)
- **Phase 8**: Real-time Notifications, Digital Document Vault, BANT Chatbot
- **Phase 9**: Admin Control Panel, Analytics, Business Rules
- **Phase 10**: Flutter Mobile Feature Parity
