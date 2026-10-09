# RentHub Presentation Deck Guide 🎯

This directory contains the interactive, standalone 16:9 presentation slide deck designed for your **Final Year Capstone Project Defense**.

---

## 🚀 How to Launch the Presentation

You have multiple zero-friction options to view and present:

### Option 1: Direct File Open (No Server Needed)
Simply double-click [`presentation/index.html`](file:///c:/Users/Dipesh%20Raj/OneDrive/Desktop/RentHub_Cd/presentation/index.html) or right-click and open with **Google Chrome**, **Microsoft Edge**, or **Brave**.

### Option 2: Via npm command
From the project root:
```bash
npm run presentation
```
This starts a lightweight local server on `http://localhost:4123` and automatically opens your default browser.

---

## ⌨️ Presentation Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| **`→`** / **`Space`** / **`PageDown`** | Next slide |
| **`←`** / **`PageUp`** | Previous slide |
| **`Home`** | Jump to Title slide (Slide 1) |
| **`End`** | Jump to Conclusion / Q&A slide (Slide 14) |
| **`F`** | Toggle Fullscreen mode |
| **`N`** | Toggle **Speaker Notes Drawer** (rehearsal cues & academic talking points) |
| **`O`** | Toggle **Overview Matrix** (visual thumbnail grid of all 14 slides) |
| **`Esc`** | Close Overview or Notes overlay |

---

## ⏱️ Built-in Rehearsal Timer
Click the **`00:00`** clock in the bottom navigation HUD to start, pause, or reset your presentation timer. This helps you rehearse your target timing (e.g. 10 to 15 minutes defense limit).

---

## 📄 How to Export to PDF (Print Ready)

The slide deck has a custom `@media print` stylesheet configured for standard **16:9 Landscape**:

1. Click the **"Export PDF"** button in the bottom HUD (or press `Ctrl + P` / `Cmd + P`).
2. In the browser print dialog:
   - **Destination**: Choose **Save as PDF**.
   - **Layout**: **Landscape**.
   - **Paper Size**: **A4** or **Tabloid / 16:9**.
   - **Margins**: **None**.
   - **Options**: Ensure **"Background graphics"** is checked.
3. Click **Save** to generate a presentation-ready PDF handout.

---

## 📑 Slide Outline (14 Slides)

1. **Title & Defense Overview** — Candidate details, modular domain monolith architecture overview.
2. **Problem Analysis & Motivation** — The rental marketplace paradox; why classified boards fail tenancy lifecycles.
3. **High-Level System Architecture** — Presentation tier, Modular Domain Monolith, PostGIS storage engine.
4. **Physical Asset Hierarchy** — Strict domain modeling: Landlord ──► Property ──► Unit ──► Tenancy.
5. **Database Engineering & Kysely Query Layer** — Type-safe SQL, row-level locks, comparing Kysely vs Prisma/TypeORM.
6. **The "One Active Tenancy" Invariant** — PostgreSQL partial unique index & concurrency arbitration.
7. **PostGIS Spatial Engine & Exponential Radius** — Authoritative geodesic search (`ST_DWithin`) & dynamic range expansion.
8. **Dual State Machines** — Tenancy lifecycle & Unit availability synchronization.
9. **Identity, Auth & Dynamic RBAC** — Google OAuth 2.0, HttpOnly JWT refresh rotation, single-account dynamic role switching.
10. **Dual Dispute Separation & Deterministic Chatbot** — Listing vs. tenancy dispute separation and FSM-based BANT lead bot.
11. **System Metrics & Roadmap** — Interactive Chart.js radar/bar chart of module completeness & test coverage.
12. **Live Demonstration Walkthrough** — Guided 4-step evaluator workflow.
13. **Technical Reflections & Critical Lessons** — Geographic projections, cross-platform OpenAPI contracts, race conditions solved.
14. **Conclusion & Defense Q&A** — Summary of academic contributions & committee discussion.
