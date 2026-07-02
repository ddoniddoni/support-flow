# AGENTS.md

## Project

This project is **SupportFlow v2**, an AI-upgraded version of the existing **SupportFlow** portfolio project.

SupportFlow is a portfolio-grade B2B customer support ticket management SaaS. The goal is not to build a simple CRUD app. The goal is to build a realistic front-end portfolio project that demonstrates production-like thinking: authentication, role-based access control, ticket management, filtering, server state management, forms, loading/error/empty states, maintainable component architecture, and now practical AI-assisted support operations.

The v2 objective is to extend the existing SupportFlow product with AI features, not to rebuild it as a new product.

## Target impression

The project should make a hiring manager think:

> "This person can build real admin dashboards, maintain an existing product, and add practical AI features in a production-like way."

Avoid making it look like a tutorial project, a simple customer inquiry board, a UI-only mockup, or a generic AI chatbot.

## Package manager

Use **npm** for this project.

Rules:

- Use `npm` / `npm.cmd` commands only.
- Do not introduce `yarn.lock` or `pnpm-lock.yaml`.
- Keep `package-lock.json` as the lockfile.
- Do not add unnecessary dependencies without asking.

Verification commands on Windows:

```bash
npm.cmd run lint
npm.cmd run build
```

Verification commands on macOS/Linux:

```bash
npm run lint
npm run build
```

## Tech stack

Use the existing stack:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase
- TanStack Query
- React Hook Form
- Zod
- Zustand only for lightweight UI state
- Vercel deployment

Do not add a new database, auth provider, package manager, state manager, or UI framework unless explicitly requested.

## Product concept

SupportFlow is a role-based customer support operation dashboard.

Users can create support tickets. Agents can handle assigned tickets. Admins can view all tickets, assign agents, change priorities, and monitor support status.

In v2, SupportFlow adds AI-assisted support operations:

```txt
Existing SupportFlow core
+ AI ticket triage
+ Ticket summarization
+ Sentiment and urgency detection
+ Reply draft generation
+ Human-in-the-loop AI review
+ Admin AI insights
```

The AI upgrade must be additive. Do not replace the existing customer / agent / admin ticket workflow.

## Core product rule

SupportFlow is still a customer support ticket management SaaS.

Do not turn the product into:

- a separate VOC analytics product,
- a generic AI chatbot,
- a fully automated support bot,
- a tutorial-like CRUD board,
- a UI-only demo with fake buttons.

AI should assist agents and admins. It should not silently make irreversible decisions.

## Roles

There are three roles.

### Customer

Can:

- Create tickets
- View only their own tickets
- View replies to their tickets

Must not:

- View AI analysis
- View AI reasoning
- View internal notes
- View AI review queue
- Trigger AI analysis

### Agent

Can:

- View assigned tickets
- Reply to tickets
- Change ticket status
- Add internal notes
- Use AI analysis on assigned tickets
- View AI summary and reply drafts for assigned tickets
- Confirm or correct AI output for assigned tickets

### Admin

Can:

- View all tickets
- Assign agents
- Change priority
- Change status
- View dashboard statistics
- Manage users if needed
- View all AI analyses
- Review low-confidence or risky AI output
- Access AI review queue and AI insight dashboard

## Core v1 features to preserve

Keep these as the main SupportFlow foundation:

1. Authentication
2. Role-based routing
3. Ticket creation
4. Ticket list table
5. Search, filter, sort, pagination
6. Ticket detail page
7. Status change
8. Agent assignment
9. Customer-visible replies
10. Internal notes
11. Activity logs
12. Dashboard statistics
13. Loading UI
14. Error UI
15. Empty state UI
16. Unauthorized access page

## v2 AI upgrade features

Implement these as the main v2 portfolio features:

1. AI ticket analysis
2. AI Assistant panel on ticket detail
3. AI reply draft workflow
4. AI Review Queue
5. AI filters on ticket list
6. AI insight cards on dashboard
7. Prompt version tracking
8. AI review events and activity logs
9. Mock AI provider
10. Zod validation for AI output

## Important implementation rules

- Do not build this as a basic CRUD board.
- Prioritize realistic admin dashboard UX.
- Inspect the existing project structure before making changes.
- Extend existing features instead of rewriting them.
- Preserve current customer, agent, and admin flows.
- Preserve existing Supabase auth/RBAC behavior.
- Never expose Supabase service-role keys to the client.
- Keep search/filter/page state in URL query parameters when possible.
- Use TanStack Query for server state.
- Use React Hook Form and Zod for forms.
- Use Zustand only for UI state such as modals or sidebar state.
- Avoid unnecessary global state.
- Avoid `any` unless absolutely necessary.
- Keep components small and feature-based.
- Separate API logic, hooks, components, schemas, and types.
- Always consider loading, error, empty, and unauthorized states.
- Prefer readable, maintainable code over clever abstractions.

## AI implementation rules

- The app must work without a real AI API key.
- `AI_PROVIDER=mock` is required and must support the full demo flow.
- A real provider such as OpenAI is optional.
- Do not block project completion on a real provider.
- Validate all AI output with Zod before saving typed values.
- Store raw AI response only for internal traceability.
- Do not auto-post AI reply drafts.
- Do not show AI analysis or internal notes to customers.
- AI output should be treated as an assistant suggestion, not an automatic truth.
- Low-confidence or high-risk AI output must go to human review.

## Suggested environment variables

Update `.env.example` with:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AI_PROVIDER=mock
OPENAI_API_KEY=
AI_MODEL=
AI_CONFIDENCE_REVIEW_THRESHOLD=0.7
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` to client components.

## Suggested folder structure

Extend the existing feature-based structure.

```txt
src/
  app/
    login/
    signup/
    dashboard/
    tickets/
      page.tsx
      new/
      ai-review/
        page.tsx
      [id]/
        page.tsx
    admin/

  components/
    ui/
    layout/
    common/

  features/
    auth/
    tickets/
      api/
      components/
      hooks/
      schemas/
      types/
    ai/
      api/
        analyze-ticket.ts
        get-ai-review-queue.ts
        get-ai-dashboard-stats.ts
        review-ai-analysis.ts
      components/
        ai-assistant-panel.tsx
        ai-analysis-summary-card.tsx
        ai-confidence-badge.tsx
        ai-review-table.tsx
        ai-reply-draft-box.tsx
      hooks/
        use-analyze-ticket.ts
        use-ai-analysis.ts
        use-ai-review-queue.ts
        use-review-ai-analysis.ts
      schemas/
        ticket-ai-analysis.schema.ts
      providers/
        ai-provider.ts
        mock-ai-provider.ts
        openai-ai-provider.ts
      types/
        ticket-ai-analysis.types.ts
      utils/
        ai-review-rules.ts
    dashboard/
    users/

  hooks/
  lib/
    supabase/
    query-client.ts
    utils.ts
  types/
  schemas/
```

Adjust names to match the existing codebase. Do not force this exact structure if the project already has a clean convention.

## Existing ticket data model

Preserve the existing conceptual data model.

### profiles

- id
- email
- name
- role
- created_at

### tickets

- id
- title
- content
- status
- priority
- category
- customer_id
- assignee_id
- created_at
- updated_at

### ticket_replies

- id
- ticket_id
- author_id
- content
- is_internal
- created_at

### ticket_logs

- id
- ticket_id
- actor_id
- action
- before_value
- after_value
- created_at

## AI data model update

Add these tables or equivalent Supabase migrations:

### ai_prompt_versions

- id
- name
- version
- provider
- model
- prompt_text
- is_active
- created_at

### ticket_ai_analyses

- id
- ticket_id
- prompt_version_id
- provider
- model
- category
- sentiment
- urgency
- intent
- suggested_priority
- suggested_status
- suggested_assignee_role
- tags
- summary
- reason
- reply_draft
- confidence
- needs_review
- escalation_reason
- raw_response
- validation_status
- created_by
- created_at

### ticket_ai_review_events

- id
- ticket_ai_analysis_id
- ticket_id
- reviewer_id
- decision
- before_value
- after_value
- note
- created_at

Optional denormalized ticket fields are allowed if they simplify list filters:

- latest_ai_analysis_id
- ai_needs_review
- ai_sentiment
- ai_urgency
- ai_confidence

When adding migrations:

- Use Supabase migration conventions already present in the project.
- Add indexes for common filters such as ticket_id, needs_review, sentiment, urgency, confidence, created_at.
- Add RLS policies consistent with existing role rules.
- Customers must not be able to select AI analysis rows.
- Agents may read AI analysis for assigned tickets.
- Admins may read and review all AI analysis rows.

## Status values

Use:

- open
- in_progress
- resolved
- closed

## Priority values

Use:

- low
- medium
- high
- urgent

## AI output schema

Create a Zod schema similar to:

```ts
export const TicketAIAnalysisSchema = z.object({
  category: z.enum([
    "technical",
    "billing",
    "account",
    "product",
    "shipping",
    "refund",
    "complaint",
    "other",
  ]),
  sentiment: z.enum(["positive", "neutral", "negative"]),
  urgency: z.enum(["low", "medium", "high", "critical"]),
  intent: z.enum([
    "question",
    "complaint",
    "refund_request",
    "bug_report",
    "account_help",
    "billing_issue",
    "cancellation_request",
    "feature_request",
    "praise",
    "other",
  ]),
  suggestedPriority: z.enum(["low", "medium", "high", "urgent"]).nullable(),
  suggestedStatus: z.enum(["open", "in_progress", "resolved", "closed"]).nullable(),
  suggestedAssigneeRole: z.string().nullable(),
  tags: z.array(z.string()).max(8),
  summary: z.string().min(1).max(500),
  reason: z.string().min(1).max(700),
  replyDraft: z.string().max(2000).nullable(),
  confidence: z.number().min(0).max(1),
  needsReview: z.boolean(),
  escalationReason: z.string().nullable(),
});
```

If existing category values differ, adapt the schema to the existing project values.

## Review rules

Set `needsReview = true` when any of these are true:

- confidence is below env threshold, default `0.7`,
- urgency is `critical`,
- ticket mentions legal threat, refund, cancellation, security, privacy, payment dispute, or repeated complaint,
- schema validation fails and fallback result is used,
- AI provider returns malformed JSON,
- sentiment is negative and suggested priority is urgent.

## Mock provider behavior

Mock provider should use deterministic text rules.

Examples:

- `refund`, `charge`, `payment`, `invoice` -> billing or refund intent.
- `bug`, `error`, `crash`, `broken` -> technical bug report.
- `angry`, `terrible`, `complaint`, `lawsuit`, `legal`, `cancel` -> negative sentiment and high/critical urgency.
- `thanks`, `great`, `helpful`, `love` -> positive sentiment.

The mock provider should return realistic but predictable outputs so the deployed demo works without secrets.

## UX requirements

Every major page should handle:

- Loading state
- Error state
- Empty state
- Unauthorized state when needed

For ticket list loading, prefer table skeletons.

For ticket detail loading, prefer detail layout skeletons.

For form submission, disable the submit button and show pending state.

### Ticket detail AI Assistant panel

Add an AI panel without cluttering the main ticket thread.

Panel states:

- No analysis yet
- Analyzing
- Analysis ready
- Needs review
- Failed

Actions:

- Analyze
- Regenerate
- Confirm
- Edit analysis
- Send to review
- Copy reply draft
- Use draft as reply

### AI Review Queue

Route:

```txt
/tickets/ai-review
```

Requirements:

- Admin can see all items.
- Agent can see assigned items.
- Customer gets unauthorized state.
- Include search/filter/pagination where practical.
- Preserve URL query parameters for filters.
- Use table skeleton loading.
- Show empty state when there are no review items.

### Dashboard AI insights

Add cards/charts:

- AI review required count.
- Negative sentiment count.
- High/critical urgency count.
- Average confidence.
- Top AI categories.
- AI analyses this week.

Keep the dashboard clean. Do not overbuild visualizations.

## Query key rules

Use consistent TanStack Query keys.

Examples:

```ts
["tickets", filters]
["ticket", ticketId]
["ticket-ai-analysis", ticketId]
["ai-review-queue", filters]
["dashboard-stats"]
["ai-dashboard-stats"]
```

Invalidate affected queries after mutations.

## Activity log rules

Create logs for:

- AI analysis generated
- AI analysis regenerated
- AI analysis approved
- AI analysis corrected
- AI analysis rejected
- AI draft used as customer reply
- Suggested priority applied
- Suggested assignee applied

Use existing `ticket_logs` if appropriate. Add `ticket_ai_review_events` for detailed review history.

## README expectations

The README should explain:

- What problem this project solves
- Why this project is realistic
- Tech stack and reasons
- Main features
- Role-based access control
- URL-based filtering
- TanStack Query usage
- React Hook Form and Zod usage
- Loading/error/empty state handling
- AI_PROVIDER=mock demo flow
- AI provider abstraction
- Human-in-the-loop AI review
- Prompt version tracking
- Troubleshooting
- Demo accounts
- Deployment link

## Development behavior

When implementing features:

1. First inspect the existing structure.
2. Propose a small implementation plan.
3. Implement in small, reviewable steps.
4. Keep code type-safe.
5. Run lint/build checks when available.
6. Do not add unnecessary dependencies without asking.
7. Update README or docs when a major feature is added.
8. Leave the working tree clean before starting the next Phase.

## Git workflow

Use `develop` as the main working and integration branch for this project.
Do not use `master` for project work.

Do not work directly on `develop` for Phase work unless explicitly requested.

Each Phase must use a dedicated branch before implementation starts.
Small non-Phase tasks may also use a focused branch.

Branch naming examples:

- `phase/02-supabase-setup`
- `phase/03-auth`
- `phase/04-rbac`
- `phase/06-ticket-list`
- `phase/06-ticket-filters`
- `phase/ai-01-schema-migrations`
- `phase/ai-02-provider-abstraction`
- `phase/ai-03-ticket-detail-panel`
- `phase/ai-04-review-queue`
- `phase/ai-05-dashboard-insights`
- `phase/ai-06-readme-polish`

If a Phase becomes too large, split it into smaller focused branches.

For each Phase or focused task:

1. Start from the latest `develop`.
2. Create a dedicated branch.
3. Implement only the scope of that Phase or task.
4. Run verification before committing when possible:
   - `npm.cmd run lint`
   - `npm.cmd run build`
5. Keep one commit per Phase or focused task whenever possible.
6. Push the task branch to the remote repository.
7. Merge the task branch into `develop`.
8. Push `develop`.
9. Leave the working tree clean before starting the next Phase.

Before starting a new Phase:

```bash
git status --short
git checkout develop
git pull origin develop
```

Never force push, hard reset, or delete branches unless explicitly requested.

## Commit message rules

Commit messages must follow this format:

```txt
<type>(<scope>): <title>

<body>
```

The body should explain why the change was made and include important implementation details.

Allowed commit types:

- `feat`: Add a new feature
- `fix`: Fix a bug
- `docs`: Documentation-only changes
- `style`: Formatting or style-only changes with no code behavior change
- `refactor`: Code refactoring without a feature or bug fix
- `test`: Add or update tests
- `chore`: Build, package manager, tooling, or maintenance changes

Examples:

```txt
feat(auth): 로그인 페이지 구현

Supabase signInWithPassword를 연결하고
폼 검증과 에러 상태를 추가했다.
```

```txt
feat(ai): 티켓 AI 분석 기능 추가

Mock AI provider와 Zod 검증 스키마를 추가하고
티켓 상세에서 AI 분석 결과를 저장할 수 있게 했다.
```

## Implementation phases

### Phase AI-0: Audit

- Inspect existing routes, Supabase schema, auth helpers, ticket APIs, query hooks, and components.
- Identify extension points.
- Do not rewrite working flows.
- Do not modify files yet.

### Phase AI-1: Schema and migrations

- Add AI Zod schema.
- Add Supabase migrations for `ai_prompt_versions`, `ticket_ai_analyses`, `ticket_ai_review_events`.
- Add seed prompt version if the project has a seed mechanism.
- Add TypeScript types.
- Add `.env.example` AI variables.

### Phase AI-2: Provider abstraction

- Add AI provider interface.
- Add mock provider.
- Add analyze-ticket action/API.
- Validate provider output with Zod.
- Store analysis in Supabase.
- Mark risky/low-confidence output as `needs_review`.

### Phase AI-3: Ticket detail AI Assistant

- Add AI Assistant panel to ticket detail page.
- Add Analyze / Regenerate actions.
- Show AI result, confidence, review state, and reply draft.
- Add copy draft and use draft as reply flow.
- Customers must not see the AI panel.

### Phase AI-4: AI Review Queue

- Add `/tickets/ai-review` route.
- Add role-based access.
- Add table, filters, skeletons, empty state, and review actions.
- Store review events and ticket logs.

### Phase AI-5: Ticket list and dashboard insights

- Add AI columns/badges to ticket list.
- Add AI URL filters.
- Add AI cards to dashboard.
- Preserve existing filters, sorting, pagination, and query behavior.

### Phase AI-6: README and polish

- Update README with v2 AI upgrade story.
- Add demo accounts and mock AI demo instructions.
- Add architecture notes and troubleshooting.
- Add portfolio/resume bullet examples.
