# SmartPLM — Product Lifecycle Management System

> A full-stack, engineering-grade PLM platform for managing parts, assemblies, change orders, document vaults, and lifecycle analytics — built with Fastify, React, and PostgreSQL.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Seeding the Database](#seeding-the-database)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Pages & Routes](#pages--routes)
- [Deployment](#deployment)
- [Default Credentials](#default-credentials)

---

## Overview

**SmartPLM** is a monorepo web application that gives engineering teams a centralized workspace to:

- Track **parts and assemblies** across their full lifecycle (Draft → Review → Released → Obsolete)
- Manage **Bill of Materials (BOM)** trees with multi-level parent-child relationships
- Raise, review, and approve **Engineering Change Notifications (ECN/ECO)**
- Store and version-control **CAD files, PDFs, and spec sheets** with checkout/checkin locking
- Visualize **where-used dependency graphs** and simulate change propagation risk
- Maintain a **full revision audit trail** with a diff viewer per part
- Administer **users, roles, and system health** from an admin panel

---

## Features

| Module | Description |
|--------|-------------|
| 🔐 **Auth** | JWT cookie-based login/register, role-based access (USER / ADMIN) |
| 📊 **Dashboard** | KPI cards (My Parts, Pending Approvals, Active Changes), recent parts table, activity telemetry feed |
| 🏗️ **Assembly Tree** | Interactive multi-level BOM tree with expand/collapse, assembly picker, configure view modal, part metadata inspector |
| 📁 **Document Vault** | Drag-and-drop file upload linked to parts, checkout/checkin locking, file download, version history, search/filter |
| ✏️ **ECN Creation** | Raise formal change orders with priority, root cause justification, auto-generated ECN numbers |
| 📋 **ECO Kanban** | Drag-and-drop Kanban board to move ECNs through Pending → Review → Approved → Rejected |
| 🚀 **Final Release** | One-click release stamp — transitions part to RELEASED, locks it, creates a revision snapshot |
| 🔁 **Revision History** | Part-picker timeline showing all revisions with a git-style diff viewer + global activity feed tab |
| 🕸️ **Impact Graph** | Animated SVG dependency graph with risk score rings, node inspector, and **change propagation simulator** |
| 👤 **Profile** | Edit name and department |
| ⚙️ **System Settings** | Admin-only user management and system metrics |

---

## Tech Stack

### Backend
| Package | Role |
|---------|------|
| **Fastify 5** | HTTP server & routing |
| **Prisma 6** | ORM + migrations |
| **PostgreSQL 18** | Primary database |
| **@fastify/jwt** | JWT authentication |
| **@fastify/cookie** | Secure cookie transport |
| **@fastify/cors** | Cross-origin resource sharing |
| **@fastify/multipart** | File upload handling |
| **@fastify/static** | Serving client build + uploaded files |
| **bcryptjs** | Password hashing |

### Frontend
| Package | Role |
|---------|------|
| **React 19** | UI framework |
| **Vite 8** | Dev server & build tool |
| **React Router 7** | Client-side routing |
| **Zustand 5** | Global state management |
| **Axios** | HTTP client |
| **react-dropzone** | Drag-and-drop uploads |
| **react-hot-toast** | Toast notifications |
| **lucide-react** | Icon library |

---

## Project Structure

```
PLM/
├── package.json              # Root scripts (build + start for production)
├── render.yaml               # Render.com deployment config
│
├── server/                   # Fastify backend (Node.js)
│   ├── src/
│   │   ├── index.js          # All routes + server bootstrap
│   │   └── db.js             # Prisma client singleton
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   ├── uploads/              # Uploaded files (served at /uploads/)
│   ├── seed.js               # Seed admin user + 10 sample parts
│   ├── seed-bom.js           # Seed BOM parent-child relationships
│   ├── seed-revisions.js     # Seed revision history per part
│   └── .env                  # Environment variables
│
└── client/                   # React + Vite frontend
    ├── src/
    │   ├── App.jsx            # Router + lazy-loaded pages
    │   ├── store/index.js     # Zustand store + Axios API calls
    │   ├── index.css          # Global design system / tokens
    │   ├── features/
    │   │   ├── auth/          # Login page
    │   │   ├── dashboard/     # Dashboard KPIs + activity
    │   │   ├── assembly/      # BOM tree viewer
    │   │   ├── files/         # Document vault
    │   │   ├── changes/       # ECN, ECO Kanban, Final Release, Revision
    │   │   ├── impact/        # Impact graph + propagation simulator
    │   │   ├── admin/         # Admin panel
    │   │   └── settings/      # Profile + system settings
    │   └── components/
    │       ├── layout/        # AppShell sidebar + nav
    │       └── ui/            # SlideOver, shared UI
    └── vite.config.js
```

---

## Database Schema

```
User          — id, email, name, passwordHash, role (USER|ADMIN), department, status
Part          — id, partNumber, name, type (ASSEMBLY|PART), currentRev, status, material, weight, cost, isLocked, ownerId
BomItem       — parentPartId → childPartId with quantity (unique constraint)
Revision      — partId, revString (e.g. "Rev B"), pushedBy, changes (diff text)
FileAsset     — partId, fileName, version, sizeBytes, url, lockedById, uploadedById
ChangeOrder   — ecnNumber, title, description, rootCause, priority, status, targetPartId, authorId
ActivityLog   — userId, action, entityType, entityId
```

---

## Getting Started

### Prerequisites

- **Node.js** v18+
- **PostgreSQL** 14+ running locally (default port `5432`)

### 1. Clone and install

```bash
git clone https://github.com/vigneshan-s/PLM.git
cd PLM

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Configure environment

Edit `server/.env`:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/smartplm?schema=public"
PORT=4000
JWT_SECRET="your-super-secret-jwt-key"
COOKIE_SECRET="your-cookie-secret"
NODE_ENV="development"
```

### 3. Create the database and push schema

```bash
# Create the 'smartplm' database in PostgreSQL first, then:
cd server
npx prisma db push
npx prisma generate
```

### 4. Start the servers

**Backend** (runs on port 4000):
```bash
cd server
npm run dev
```

**Frontend** (runs on port 5173 or 5174):
```bash
cd client
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## Seeding the Database

Run these scripts from the `server/` directory in order:

```bash
# 1. Create admin user + 10 sample parts
node seed.js

# 2. Create BOM parent-child relationships (assembly tree)
node seed-bom.js

# 3. Create revision history per part (13 snapshots)
node seed-revisions.js
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | — |
| `PORT` | Server port | `4000` |
| `JWT_SECRET` | Secret for signing JWT tokens | `super-jwt-key` |
| `COOKIE_SECRET` | Secret for signing cookies | `super-secret` |
| `NODE_ENV` | `development` or `production` | `development` |

---

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Login with email + password |
| `POST` | `/api/auth/register` | Register new user |
| `GET` | `/api/auth/me` | Get current logged-in user |
| `POST` | `/api/auth/logout` | Clear auth cookie |
| `PUT` | `/api/auth/profile` | Update name + department |

### Parts & Assembly
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/parts` | List all parts |
| `GET` | `/api/parts/:id/bom` | Recursive BOM tree for a part |
| `GET` | `/api/parts/:id/history` | Revision history for a part |

### Change Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/changes` | Raise a new ECN |
| `GET` | `/api/changes/kanban` | Get Kanban board data |
| `PUT` | `/api/changes/:id/status` | Update ECN status (drag & drop) |
| `POST` | `/api/changes/:id/release` | Release stamp — marks part RELEASED |

### Files
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/files` | Upload a file, link to part |
| `GET` | `/api/files` | List all files (with part + lock info) |
| `POST` | `/api/files/:id/checkout` | Lock file to current user |
| `POST` | `/api/files/:id/checkin` | Unlock file |
| `GET` | `/uploads/:filename` | Download uploaded file |

### Dashboard & Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard/kpis` | My Parts, Pending Approvals, Active Changes |
| `GET` | `/api/dashboard/recents` | 5 most recently updated parts |
| `GET` | `/api/dashboard/activity` | 10 latest activity log events |
| `GET` | `/api/impact/:partId` | Where-used dependency graph + risk insights |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/users` | All users (ADMIN only) |
| `GET` | `/api/admin/system` | User/Part/ECN counts (ADMIN only) |

---

## Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/login` | Login | Authentication |
| `/dashboard` | Dashboard | KPIs, recent parts, activity |
| `/assembly` | Assembly Tree | Multi-level BOM viewer |
| `/files` | Document Vault | File upload, checkout, download |
| `/ecn` | ECN Creation | Raise a change order |
| `/eco` | ECO Kanban | Approve / reject change orders |
| `/release` | Final Release | Release stamp + revision lock |
| `/revision` | Revision History | Audit trail + diff viewer + activity feed |
| `/impact` | Impact Graph | Dependency graph + propagation simulator |
| `/admin` | Admin Panel | User management + system metrics |
| `/profile` | Profile | Edit personal details |
| `/settings` | System Settings | App configuration |

---

## Deployment

The project is configured for **Render.com** via `render.yaml`.

### Production build

```bash
# From the project root:
npm run build
# This runs: npm install in server + client, then builds the React app
```

### Start production server

```bash
npm start
# This runs: node src/index.js from the server/
# The server also serves the built React SPA from client/dist/
```

### Required environment variables on Render:
- `DATABASE_URL` — PostgreSQL connection string (use Render Postgres add-on)
- `JWT_SECRET` — auto-generated by Render
- `COOKIE_SECRET` — auto-generated by Render
- `NODE_ENV=production`

---

## Default Credentials

After running `node seed.js`:

| Field | Value |
|-------|-------|
| Email | `admin@gmail.com` |
| Password | `123` |
| Role | `ADMIN` |

---

## License

ISC — see [package.json](./package.json)