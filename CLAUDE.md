# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A4CPL (AI-Assisted Assessment to Award Credit for Prior Learning) is a Next.js 14 application that uses AI (Anthropic Claude) to conduct adaptive, conversational assessments for awarding college credit based on prior experience. The initial domain is Fire Technology courses (e.g., FIRETEK 217 - Wildland Fire Control).

## Commands

```bash
npm run dev          # Start development server (Next.js on port 3000)
npm run build        # Production build
npm run lint         # ESLint
npm run db:generate  # Generate Prisma client after schema changes
npm run db:push      # Push schema to database without migration
npm run db:migrate   # Create and apply Prisma migration
npm run db:studio    # Open Prisma Studio GUI
npm run db:seed      # Seed database with test data (tsx prisma/seed.ts)
```

After cloning, typical setup: `npm install && npx prisma generate && npx prisma db push && npm run db:seed`

## Architecture

### Stack
- **Framework**: Next.js 14 (App Router, React 18, TypeScript)
- **Database**: SQLite via Prisma ORM (no enum support — string fields with convention comments)
- **Auth**: NextAuth v4 with credentials provider, JWT sessions, PrismaAdapter
- **AI**: Anthropic Claude SDK (`@anthropic-ai/sdk`), OpenAI SDK available but Claude is primary
- **Styling**: Tailwind CSS
- **Validation**: Zod

### Path Alias
`@/*` maps to `./src/*` (configured in tsconfig.json)

### Key Directories
- `src/lib/` — Shared utilities: `db.ts` (Prisma singleton), `auth.ts` (NextAuth config), `ai.ts` (AI client + assessment logic)
- `src/app/(auth)/` — Route group for login/register pages (unauthenticated)
- `src/app/(dashboard)/` — Route group for authenticated pages (server-side session check redirects to `/login`)
- `src/app/api/auth/` — Auth API routes (NextAuth catch-all, register, signup)
- `src/components/` — Shared React components (`providers.tsx` wraps SessionProvider)
- `src/types/` — Type declarations (NextAuth session augmentation in `next-auth.d.ts`)

### Data Model (prisma/schema.prisma)
The schema models a full assessment workflow:
- **Users** have roles: `ADMIN`, `INSTRUCTOR`, `STUDENT` (stored as strings, not enums)
- **Courses** have **LearningOutcomes** with weighted proficiency criteria
- **Assessments** have **Rubrics** with **RubricCriteria** linked to outcomes
- **AssessmentSessions** track a student taking an assessment, containing **Interactions** (the AI conversation) and producing an **AssessmentResult** with per-outcome **OutcomeResults**
- Several fields store structured data as JSON strings (certifications, criteria, evaluation, levels, etc.)
- CPL recommendations: `PENDING_REVIEW`, `AWARD_CREDIT`, `PARTIAL_CREDIT`, `NO_CREDIT`, `NEEDS_REASSESSMENT`

### AI Assessment Flow (src/lib/ai.ts)
The core assessment logic uses three main functions:
1. `generateAssessmentQuestion()` — Sends conversation history to Claude with a system prompt built from course context; produces scenario-based, follow-up, or clarification questions
2. `evaluateResponse()` — Evaluates student responses against learning outcomes, returning scores and proficiency levels (Mastery/Proficient/Developing/Beginning/Not Demonstrated)
3. `generateAssessmentSummary()` — Produces final CPL recommendation with strengths, areas for growth, and personalized study guide

The system prompt emphasizes equity: accepting equivalent terminology, adapting to communication styles, and using scenario-based questions tied to real-world experience.

### Authentication
- Credentials-based auth (email/password) with bcrypt hashing (12 rounds)
- JWT strategy with custom callbacks that inject `id` and `role` into session
- Custom pages: sign-in at `/login`, sign-out redirects to `/`
- Dashboard layout (`src/app/(dashboard)/layout.tsx`) enforces auth via `getServerSession()`

## Environment Variables

Required in `.env` (see `.env.example`):
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET` — NextAuth configuration
- `OPENAI_API_KEY` — Optional, OpenAI client available but not actively used