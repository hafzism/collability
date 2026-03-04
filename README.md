# Collability

> A real-time collaborative team workspace — combining the best of Kanban boards, collaborative documents, and modern team tooling.

Collability demonstrates how to build a production-grade collaboration system with CRDT-based real-time editing, offline-first synchronization, and a relational metadata layer. It simulates the architecture behind tools like Notion, Trello, and Figma — practical, scalable, and built for real teams.

---

## Demo

> _Screenshots and GIFs coming soon._

Planned previews:
- Board with lists and cards
- Real-time collaborative card description editing
- Live presence indicators
- Drag-and-drop card ordering

---

## Features

### Workspace & Collaboration
- Workspaces with multiple boards
- Board → Lists → Cards hierarchy
- Role-based access control (Admin / Member / Guest)
- Activity history and audit logs

### Kanban Board
- Create, edit, move, and archive cards
- Drag-and-drop ordering
- User assignments, due dates, and checklists

### Real-Time Collaboration
- Multi-user editing of card descriptions
- Live presence indicators and cursor awareness
- Automatic conflict resolution via CRDT synchronization

### Offline First
- Edits persist locally while offline
- Changes sync automatically when connection is restored
- Collaborative editing works even on unstable connections

### Notifications
- In-app notifications
- Email notifications for important actions
- Reliable background job processing

### Attachments
- File uploads via signed URLs
- S3-compatible storage

### Versioning
- Activity logs
- Snapshot-based version history
- Restore previous document states

---

## Tech Stack

### Frontend
| Tool | Purpose |
|---|---|
| Next.js (App Router) | Framework |
| React + TypeScript | UI |
| Zustand | UI state management |
| TanStack Query | Server data caching |
| TipTap Editor | Rich text editing |
| Yjs | Collaborative CRDT engine |

### Backend
| Tool | Purpose |
|---|---|
| NestJS + TypeScript | API server |
| PostgreSQL | Relational database |
| Prisma ORM | Database access |

### Realtime Infrastructure
| Tool | Purpose |
|---|---|
| Yjs | CRDT engine |
| y-websocket | WebSocket sync provider |
| y-indexeddb | Offline persistence |

### Infrastructure
| Tool | Purpose |
|---|---|
| Redis | Caching + presence |
| BullMQ | Background jobs |
| S3 | Attachments |
| Docker | Containerization |
| GitHub Actions | CI/CD |

### Testing
| Tool | Purpose |
|---|---|
| Jest | Unit tests |
| Playwright | End-to-end tests |

---

## Architecture

Collability uses a **hybrid architecture** that separates concerns between real-time collaboration and structured metadata.

### CRDT Layer (Real-Time Collaboration)
Used for collaborative fields:
- Card descriptions
- Collaborative documents
- Comments

CRDT updates automatically merge changes across users without conflicts.

### Relational Database Layer
Used for structured metadata:
- Users, workspaces, boards, lists, cards
- Assignments, permissions, due dates

This separation ensures **strong consistency** for metadata and **conflict-free collaboration** for documents.

### System Diagram

```
Client (Next.js)
   │
   ├── REST API ──────────────► NestJS
   │                               │
   │                               ├── PostgreSQL  (metadata)
   │                               ├── Redis       (cache + queues)
   │                               └── S3          (attachments)
   │
   └── WebSocket ─────────────► Yjs Sync Server
                                    │
                                    └── CRDT updates + presence
```

### Realtime Sync Model

Collaborative data is stored as Yjs CRDT documents with the following persistence schema:

```
updates table          snapshots table
─────────────          ───────────────
document_id            document_id
seq                    snapshot_blob
update_blob            last_seq
```

**Sync flow:**
1. Client connects
2. Server loads the latest snapshot
3. Applies pending updates on top
4. Client receives current state
5. Edits are broadcast via WebSocket to all collaborators

Snapshots are periodically generated to prevent unbounded update log growth.

---

## Project Structure

```
apps/
  api/
    src/
      auth/
      users/
      workspaces/
      boards/
      lists/
      cards/
      notifications/
      attachments/
  realtime/
    yjs-server/

packages/
  database/
  shared-types/

apps/web/
  components/
  features/
    boards/
    cards/
    editor/
  lib/
  hooks/
  store/
```

---

## Running Locally

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start infrastructure

```bash
docker compose up
```

Starts: PostgreSQL, Redis, WebSocket server.

### 3. Run the backend

```bash
pnpm dev:api
```

### 4. Run the frontend

```bash
pnpm dev:web
```

### Environment Variables

Create a `.env` file at the root:

```env
DATABASE_URL=
REDIS_URL=

S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=

JWT_SECRET=
```

---

## Testing

```bash
# Unit tests
pnpm test

# End-to-end tests
pnpm test:e2e
```

---

## Roadmap

- [ ] Collaborative canvas
- [ ] Full-text search
- [ ] Analytics dashboard
- [ ] Mobile app
- [ ] WebRTC peer-to-peer sync

---

## Why Collability?

This project demonstrates real-world knowledge of:

- Real-time distributed systems
- CRDT synchronization and conflict resolution
- Offline-first architecture
- Scalable backend design
- Relational data modeling
- Modern React + Next.js application architecture

It reflects how production collaborative products are actually built.

---

## License

MIT
