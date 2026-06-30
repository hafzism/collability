# Collability

Collability is a production-style team workspace for planning work in shared Kanban boards. It combines workspace management, board-level access control, draggable lists and cards, card discussions, realtime board activity, and in-app notifications in a full-stack TypeScript monorepo.

The project is built as a realistic collaboration product: a Next.js web app, a NestJS API, PostgreSQL persistence through Prisma, Socket.IO realtime updates, containerized production builds, and an Nginx reverse-proxy setup for EC2-style hosting.

---

## Screenshots


| Landing Page             | Dashboard                |
| ------------------------ | ------------------------ |
| _Screenshot coming soon_ | _Screenshot coming soon_ |

| Board View               | Card Detail              |
| ------------------------ | ------------------------ |
| _Screenshot coming soon_ | _Screenshot coming soon_ |

---

## Highlights

- Workspace creation, member management, join codes, and role-based access.
- Public workspace boards and private boards with explicit board members.
- Kanban lists and cards with drag-and-drop ordering powered by `@dnd-kit`.
- Card details with editable title, description, due date, assignees, labels, comments, and activity.
- Board-wide card search and filtering by text, assignee, label, due date, and unassigned state.
- Realtime board updates and member presence over Socket.IO.
- In-app board notifications for assignments, comments, due-date reminders, member changes, and role changes.
- Auth flow with email OTP verification, password login, access tokens, rotating refresh-token sessions, session management, and logout controls.
- Activity logging for workspace, board, list, and card changes.
- Production deployment with Docker images, Docker Compose, Nginx TLS termination, rate limiting, and Prisma migrations.

---

## Feature Overview

### Authentication & Sessions

- Email OTP verification before signup.
- Password authentication with bcrypt hashing.
- JWT access tokens and HTTP-only refresh-token cookies.
- Refresh-token rotation with reuse detection.
- Account settings for active sessions, revoking sessions, and logging out of other devices.
- Auth API throttling and security middleware through NestJS, Helmet, cookies, and guards.

### Workspaces

- Create and update workspaces.
- Join a workspace with a generated join code.
- Workspace roles: `OWNER`, `ADMIN`, `MEMBER`, and `GUEST`.
- Member lists, role changes, and workspace-scoped authorization.
- Workspace activity timeline.

### Boards

- Create boards inside workspaces.
- Board visibility modes: workspace-visible or private.
- Board roles: `MANAGER`, `CONTRIBUTOR`, and `VIEWER`.
- Board member management and role changes.
- Board settings, recent activity, and member presence.

### Lists & Cards

- Create, rename, reorder, and delete lists.
- Create, edit, move, reorder, and delete cards.
- Card descriptions, due dates, assignees, labels, and comments.
- Card activity feed for important changes.
- Search and filter cards across the board.
- Optimistic UI updates backed by TanStack Query cache invalidation.

### Realtime Collaboration

- Socket.IO namespace for board events.
- Authenticated socket connections using access tokens.
- Realtime broadcast of board, list, card, comment, member, and notification events.
- Presence states for active users, card viewers, card editors, and users typing comments.
- User-specific socket rooms for targeted notification delivery.

### Notifications

- Board notification inbox in the dashboard.
- Notifications for card assignment, unassignment, comments, due reminders, board member additions, and role changes.
- Read/unread state tracking.
- Due-date reminder records with pending, sent, and canceled states.

---

## Tech Stack

### Frontend

| Tool                   | Purpose                               |
| ---------------------- | ------------------------------------- |
| Next.js 16 App Router  | Web application framework             |
| React 19               | UI rendering                          |
| TypeScript             | Type-safe application code            |
| Tailwind CSS 4         | Styling                               |
| TanStack Query         | Server-state caching and invalidation |
| Zustand                | Local dashboard UI state              |
| Axios                  | API client with auth refresh handling |
| Socket.IO Client       | Realtime board events and presence    |
| `@dnd-kit`             | Drag-and-drop Kanban interactions     |
| Radix UI + Headless UI | Accessible UI primitives              |
| Lucide React           | Icon system                           |

### Backend

| Tool                   | Purpose                                 |
| ---------------------- | --------------------------------------- |
| NestJS 11              | API framework                           |
| TypeScript             | Backend application code                |
| PostgreSQL             | Relational database                     |
| Prisma ORM             | Schema, migrations, and database access |
| Socket.IO              | Realtime event gateway                  |
| Passport JWT           | API authentication                      |
| bcrypt                 | Password and OTP hashing                |
| Nodemailer             | Signup OTP email delivery               |
| class-validator        | DTO validation                          |
| Helmet + cookie-parser | HTTP hardening and cookie handling      |

### Infrastructure

| Tool                | Purpose                                                    |
| ------------------- | ---------------------------------------------------------- |
| pnpm workspaces     | Monorepo package management                                |
| Turborepo           | Build, lint, and test orchestration                        |
| Docker              | Production web and API images                              |
| Docker Compose      | Multi-service production runtime                           |
| Nginx               | TLS termination, reverse proxying, gzip, and rate limiting |
| Let's Encrypt paths | Certificate mounting for production domains                |
| Prisma Migrate      | Database migration deployment                              |

---

## Architecture

Collability uses a conventional full-stack architecture with a realtime event channel beside the REST API.

```text
Browser
  |
  |  Next.js App Router UI
  |  TanStack Query + Axios
  v
NestJS REST API  <-------------------->  Socket.IO board-events namespace
  |                                             |
  | Prisma ORM                                  | board rooms, user rooms,
  v                                             | presence snapshots, events
PostgreSQL
```

The REST API owns durable state: users, sessions, workspaces, boards, board members, lists, cards, labels, comments, activity logs, notifications, and due-date reminders.

Socket.IO handles realtime delivery after authorization. Clients join board rooms, update presence, and receive board events when related data changes.

---

## Monorepo Structure

```text
apps/
  api/                 NestJS API, WebSocket gateway, tests
  web/                 Next.js frontend

packages/
  config/              Shared TypeScript config
  database/            Prisma schema, migrations, generated client wrapper
  types/               Shared TypeScript types
  utils/               Shared utilities

deploy/
  nginx/templates/     Production Nginx config template

scripts/
  deploy-ec2.sh        Pull images, run migrations, restart Compose stack
```

---

## Running Locally

### Prerequisites

- Node.js 22
- pnpm 9.1.0
- PostgreSQL database

### Install Dependencies

```bash
pnpm install
```

### Configure Environment

Create the environment files needed by the web and API apps. The exact values depend on your local database and email setup.

Common API values:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/collability"
JWT_SECRET="replace-me"
REFRESH_TOKEN_SECRET="replace-me"
OTP_VERIFICATION_SECRET="replace-me"
WEB_APP_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3001/auth/google/callback"
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM=""
```

Common web value:

```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

### Prepare the Database

```bash
pnpm --dir packages/database generate
pnpm --dir packages/database exec prisma migrate dev
```

### Start Development Servers

```bash
pnpm dev
```

Or run each app separately:

```bash
pnpm --filter api dev
pnpm --filter web dev
```

The web app runs on `http://localhost:3000` and the API defaults to `http://localhost:3001`.

---

## Testing and Quality

```bash
pnpm lint
pnpm test
pnpm build
```

Useful targeted commands:

```bash
pnpm --filter api test
pnpm --filter web lint
pnpm --filter web build
pnpm --filter api build
```

---

## Production Deployment

The repository includes production Dockerfiles for the web and API services plus a Compose/Nginx setup.

### Build Images

```bash
docker build -f Dockerfile.api -t collability-api .
docker build -f Dockerfile.web -t collability-web .
```

### Run with Docker Compose

`docker-compose.prod.yml` expects published images by default:

```env
API_IMAGE=ghcr.io/hafzism/collability-api:latest
WEB_IMAGE=ghcr.io/hafzism/collability-web:latest
WEB_DOMAIN=your-web-domain.com
API_DOMAIN=api.your-web-domain.com
```

Then deploy:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
```

The included `scripts/deploy-ec2.sh` pulls the configured images, runs Prisma migrations inside the API container, restarts the stack, and prunes old images.

Nginx terminates TLS, proxies web traffic to port `3000`, proxies API traffic to port `3001`, forwards Socket.IO upgrades, applies request limits, enables gzip, and sets common security headers.

---

## License

MIT
