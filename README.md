# Week 1: Project Foundation & Planning

**Duration:** Week 1 of 4  
**Project Type:** Team Project

## Overview

This week is about planning and setup. By end of week, you should have:
- Clear project idea and plan
- All setup done (frontend + backend)
- Everyone knows what they're building
- GitHub project board ready

---

## Tech Stack

**Frontend:** Next.js (App Router) + TypeScript

**UI:** Tailwind CSS + shadcn/ui

**Backend:** Node.js + Express + TypeScript

**Database:** MongoDB (Atlas)

**Authentication:** JWT + Google OAuth

**Version Control:** Git + GitHub Projects

---

## Tasks & Deliverables

### 1. Project Selection & Team Planning

- Choose your project idea
- Define what the project does (main features)
- Identify target users
- Create 4-week timeline
- Assign WHO builds WHAT feature
- Write down responsibilities for each team member

**Deliverable:** Project proposal document (1-2 pages)

---

### 2. Market Research

- Research 3-5 similar products/apps
- What features do they have?
- What can you do better?
- Calculate:
  - **TAM:** Total market size
  - **SAM:** Your target market
  - **SOM:** What you can realistically capture
- Document findings

**Deliverable:** Market research report (1-2 pages)

---

### 3. Product Requirements (PRD)

Write a simple PRD with:
- What problem does your app solve?
- Who are your users?
- List of all features (priority: Must-have, Should-have, Nice-to-have)
- Basic user stories (As a user, I want to...)
- Success metrics

**Deliverable:** PRD document (2-3 pages)

---

### 4. Feature Breakdown & Ownership

**CRITICAL TASK**

- List ALL features you'll build
- Break each feature into smaller tasks
- Assign each feature to a team member
- Document dependencies (what depends on what)
- Create responsibility matrix

**By end of this task, everyone must know exactly what they're building**

**Deliverable:** Feature list with clear ownership

---

### 5. GitHub Setup

**CRITICAL TASK**

Create GitHub repository: `project-<team-name>`

Setup GitHub Projects board:
- Columns: Backlog, To Do, In Progress, Review, Done
- Create issues for all Week 1 tasks
- Assign issues to team members
- Learn how to:
  - Create issues
  - Link commits to issues
  - Create pull requests
  - Move cards on board

Setup repository:
- Add all team members as collaborators
- Set branch protection on main (require PR + 1 approval)
- Create milestones for each week

**Deliverable:** Active GitHub repo with project board

---

### 6. System Architecture

Design your system:
- Draw frontend structure (pages, components)
- Draw backend structure (routes, controllers, models)
- Show how frontend talks to backend (API calls)
- Show database collections
- Plan API endpoints (e.g., POST /api/auth/login)
- Map modules to team members

**Deliverable:** Architecture diagram + API endpoint list

---

### 7. Database Design

**Using MongoDB**

- List all collections you need (users, products, orders, etc.)
- For each collection, define:
  - Fields and their types
  - Required vs optional fields
  - Relationships to other collections
- Create Entity-Relationship diagram
- Write MongoDB schemas

**Deliverable:** ER diagram + MongoDB schema document

---

### 8. UI Design in Figma

Create designs for:
- Landing page
- Login/Signup pages
- Dashboard
- Main feature pages (3-5 screens)
- Checkout page (if applicable)

Design requirements:
- Wireframes first, then high-fidelity designs
- Define colors, fonts, spacing
- Show mobile and desktop versions
- Use consistent design system

**Deliverable:** Figma file with 5-7 screens

---

### 9. Explore shadcn/ui

- Visit shadcn/ui documentation
- Test components in a demo Next.js app
- List components you'll use (Button, Card, Input, Dialog, etc.)
- Understand how to install and use them

**Deliverable:** Component list document

---

### 10. Learn JWT Authentication

Understand:
- What is JWT (Header, Payload, Signature)
- How JWT authentication works
- Access tokens vs Refresh tokens
- Where to store tokens (localStorage vs httpOnly cookies)
- Security best practices

Plan authentication flow:
- Registration flow
- Login flow
- Google OAuth flow
- Protected routes

**Deliverable:** Authentication flow diagram

---

### 11. Frontend Setup

Initialize Next.js:
```bash
npx create-next-app@latest frontend --typescript --tailwind --app
cd frontend
npx shadcn-ui@latest init
```

Setup:
- Create folder structure:
  - `/app` - pages
  - `/components` - reusable components
  - `/lib` - utilities
  - `/hooks` - custom hooks
  - `/types` - TypeScript types
- Install shadcn/ui
- Configure Tailwind CSS
- Setup ESLint + Prettier
- Create `.env.local` file (and `.env.example`)
- Add basic components (Button, Card, Input)
- Create Header and Footer components
- Push to GitHub

**Deliverable:** Next.js project on GitHub

---

### 12. Backend Setup

Initialize Node.js backend:
```bash
mkdir backend && cd backend
npm init -y
npm install express typescript ts-node @types/node @types/express
npm install dotenv cors mongoose
npm install -D nodemon
npx tsc --init
```

Setup:
- Create folder structure:
  - `/src/routes` - API routes
  - `/src/controllers` - business logic
  - `/src/models` - MongoDB models
  - `/src/middleware` - auth, validation
  - `/src/utils` - helper functions
  - `/src/config` - database config
- Configure TypeScript
- Setup ESLint + Prettier
- Create `.env` file (and `.env.example`)
- Setup MongoDB connection
- Create User model
- Create test endpoint: GET /health
- Setup nodemon for development
- Push to GitHub

**Deliverable:** Node.js backend on GitHub

---

### 13. Folder Structure

Your repository should look like:
```
project-<team-name>/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── hooks/
│   ├── types/
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── middleware/
│   │   └── config/
│   └── package.json
├── docs/
│   ├── PRD.md
│   ├── architecture.md
│   └── database-schema.md
└── README.md
```

**Deliverable:** Organized repository structure

---

### 14. Coding Standards

**Naming Conventions:**
- Components: `UserProfile.tsx` (PascalCase)
- Functions/Variables: `getUserData` (camelCase)
- Files: `auth-utils.ts` (kebab-case)
- Constants: `API_BASE_URL` (UPPER_SNAKE_CASE)

**Git Workflow:**
- Branch naming: `feature/user-login`, `fix/auth-bug`
- Commit format: `feat: add user login`, `fix: resolve auth bug`
- Always create PR to merge into main
- Get 1 approval before merging

**Code Quality:**
- Setup ESLint and Prettier
- Remove console.logs before commit
- Add comments for complex logic
- Handle errors properly (try-catch)
- Never commit `.env` files

**Deliverable:** CODING_STANDARDS.md file

---

## Week 1 Checklist

**Documents:**
- Project proposal
- Market research report
- PRD
- Feature list with ownership
- Architecture diagram
- Database schema + ER diagram
- Authentication flow diagram
- Coding standards

**Technical:**
- GitHub repo with project board
- Issues created and assigned
- Next.js frontend initialized
- Node.js backend initialized
- MongoDB connection working
- Folder structure organized
- ESLint + Prettier configured
- README with setup instructions

**Team Clarity:**
- Everyone knows what feature they own
- Dependencies mapped
- GitHub workflow understood

---

## Learning Resources

**Next.js:** https://nextjs.org/docs

**Node.js + TypeScript:** https://www.typescriptlang.org/docs

**MongoDB:** https://www.mongodb.com/docs

**JWT:** https://jwt.io/introduction

**shadcn/ui:** https://ui.shadcn.com

**GitHub Projects:** https://docs.github.com/en/issues/planning-and-tracking-with-projects

---

## Code Quality Rules

Before committing:
- Run `npm run lint`
- Format code with Prettier
- Test locally
- Write clear commit message
- Link commit to GitHub issue
- Never commit secrets or API keys

---

## End of Week Review

**Team Meeting Agenda:**
1. Present all deliverables
2. Review GitHub project board
3. Confirm everyone understands their tasks
4. Demo frontend and backend setup
5. Discuss any blockers
6. Plan Week 2 tasks

**Success Criteria:**
- All deliverables completed
- Code pushed to GitHub
- Project board updated
- No confusion about responsibilities
- Ready to start development in Week 2

## Evaluation

**Planning & Documentation - 40%**
- Quality of PRD, market research, architecture

**Technical Setup - 30%**
- Frontend and backend properly initialized
- Code structure and organization

**Team Collaboration - 20%**
- GitHub usage
- Clear task assignments

**Code Quality - 10%**
- Coding standards followed
- Clean repository

---

## Important Notes

- Push code daily
- Update GitHub project board regularly
- Ask questions immediately if stuck
- Review each other's PRs
- Keep documentation updated
- Week 2 starts active development, so finish setup properly

**Goal: By Friday, every team member must know exactly what they're building for the next 3 weeks.**
