# PRD.md

# SupportFlow v2 — AI-assisted customer support operations dashboard

## 1. One-line description

SupportFlow is a role-based B2B customer support ticket management SaaS upgraded with AI triage, ticket summarization, reply drafting, review workflows, and support insights.

## 2. Product context

SupportFlow already exists as a production-like front-end portfolio project. The original product demonstrates:

- Admin dashboards
- Authenticated applications
- Role-based UI
- Data tables
- Search/filter/sort/pagination
- Complex forms
- Server state management
- Error/loading/empty states
- Maintainable feature-based architecture

The v2 upgrade must build on top of those existing flows. It must not replace the ticket-management concept with a separate VOC product or a generic AI chatbot.

## 3. Goal

The goal is to demonstrate practical front-end engineering ability for employment, especially at a 4-year-experience level.

This project should prove that the developer can:

- Build and maintain admin dashboards.
- Extend an existing SaaS product without rewriting it.
- Add AI features into a real operational workflow.
- Design human-in-the-loop AI review instead of blindly trusting AI output.
- Keep role-based access, server state, URL filters, type safety, and reliable UX intact.
- Explain practical tradeoffs around AI confidence, review queues, prompt versioning, logging, and fallback behavior.

## 4. Not the goal

This project should not look like:

- A simple inquiry board
- A basic CRUD app
- A tutorial clone
- A UI-only mockup
- A project with many unfinished features
- A generic AI chatbot
- A fully automated support bot that posts replies without confirmation
- A separate VOC analytics product unrelated to the original SupportFlow workflow

## 5. Target portfolio impression

The project should make a hiring manager think:

> "This developer can take an existing admin dashboard product and upgrade it into a practical AI-assisted operations system while keeping the codebase maintainable."

## 6. Existing product scope to preserve

SupportFlow remains a role-based customer support ticket management SaaS.

The existing core flows stay:

- Customer creates a ticket and views replies.
- Agent handles assigned tickets, replies, adds internal notes, and changes status.
- Admin views all tickets, filters tickets, assigns agents, changes priority/status, and checks activity logs.

The AI upgrade should be added on top of this foundation.

## 7. Roles and permissions

### Customer

Existing abilities:

1. Customer signs up or logs in.
2. Customer creates a support ticket.
3. Customer checks ticket status.
4. Customer reads replies from support team.

Customer restrictions:

- Cannot view AI analysis.
- Cannot view AI reasoning.
- Cannot view internal notes.
- Cannot trigger AI analysis.
- Cannot access AI Review Queue.

### Agent

Existing abilities:

1. Agent logs in.
2. Agent sees assigned tickets.
3. Agent opens a ticket detail page.
4. Agent writes a reply.
5. Agent adds internal notes.
6. A public reply moves the ticket from `open`/`in_progress` to `resolved`.

New AI abilities:

- Run AI analysis on assigned tickets.
- View AI summary, sentiment, urgency, category suggestion, confidence, and reply draft.
- Use an AI draft as a starting point for a customer-visible reply.
- Edit the AI draft before posting.
- Confirm or correct AI output on assigned tickets.

### Admin

Existing abilities:

1. Admin logs in.
2. Admin sees dashboard statistics.
3. Admin views all tickets.
4. Admin filters tickets by status, priority, category, or assignee.
5. Admin assigns an agent.
6. Admin changes ticket priority.
7. Admin checks activity logs.

New AI abilities:

- View all AI analyses.
- Filter tickets by AI sentiment, AI urgency, confidence, review status, and suggested priority.
- Manage AI Review Queue.
- Approve/correct/reject AI triage results.
- View AI-powered dashboard insights.
- View prompt version metadata.

## 8. Main pages

### Login page

- Email
- Password
- Validation
- Error message
- Loading button state

### Signup page

- Name
- Email
- Password
- Role selection may be seeded instead of publicly selectable

### Dashboard page

Existing dashboard should show:

- Total tickets
- Open tickets
- In-progress tickets
- Resolved tickets
- Urgent tickets
- Tickets created today
- Status distribution
- Category distribution

v2 dashboard should additionally show:

- Tickets needing AI review
- Negative sentiment tickets
- High/critical urgency tickets
- Average AI confidence
- Top AI-detected categories
- AI analyses generated this week
- AI review approval/correction/rejection ratio

### Ticket list page

Must include existing filters:

- Search input
- Status filter
- Priority filter
- Category filter
- Assignee filter for admin
- Sort
- Pagination
- Table skeleton loading
- Empty result state
- Error state

URL example:

```txt
/tickets?status=open&priority=high&page=2
```

v2 should add optional AI filters:

- AI sentiment
- AI urgency
- Needs review
- Confidence below threshold

URL examples:

```txt
/tickets?status=open&aiSentiment=negative&needsReview=true
/tickets?aiUrgency=high&confidenceMax=0.7&page=2
```

Existing URL-based filtering behavior must be preserved.

### New ticket page

Form fields:

- Title
- Content
- Category
- Priority

Use React Hook Form and Zod.

### Ticket detail page

Show existing ticket information:

- Title
- Content
- Customer info
- Status
- Priority
- Category
- Assignee
- Replies
- Internal notes
- Activity log
- Status change action
- Assignment action for admin

v2 should add an **AI Assistant** panel for agents and admins only.

The AI Assistant panel should include:

- Analysis status: not analyzed, analyzing, analyzed, needs review, failed
- Category suggestion
- Sentiment badge
- Urgency badge
- Suggested priority
- Suggested status
- Suggested assignee role
- AI summary
- Reasoning summary
- Confidence score
- Review required badge when needed
- Reply draft with copy/edit/post flow
- Buttons: Analyze, Regenerate, Confirm, Edit Analysis, Send to Review

### AI Review Queue page

Add protected route:

```txt
/tickets/ai-review
```

This page shows tickets whose latest AI analysis needs review.

Filters:

- status
- priority
- category
- sentiment
- urgency
- confidence range
- assignee
- created date

The table should include:

- Ticket title
- Customer
- Current status
- Current priority
- AI urgency
- AI sentiment
- Confidence
- Review reason
- Assignee
- Created date
- Quick action to open ticket detail

Access rules:

- Admin can see all review items.
- Agent can see review items for assigned tickets.
- Customer sees unauthorized state.

## 9. v2 MVP scope

### 9.1 AI ticket analysis

From a ticket detail page, an agent or admin can click **Analyze with AI**.

The app sends ticket title, content, category, priority, latest replies, internal notes summary if available, and current metadata to the AI provider.

The AI returns a structured JSON result:

```json
{
  "category": "billing",
  "sentiment": "negative",
  "urgency": "high",
  "intent": "refund_request",
  "suggestedPriority": "urgent",
  "suggestedStatus": "open",
  "suggestedAssigneeRole": "billing_specialist",
  "tags": ["refund", "payment_issue"],
  "summary": "Customer is requesting a refund after a payment issue.",
  "reason": "The message mentions refund and payment failure with frustrated language.",
  "replyDraft": "Hi, we are sorry for the payment issue. We will check the transaction and help with the refund process.",
  "confidence": 0.86,
  "needsReview": false,
  "escalationReason": null
}
```

### 9.2 Zod validation

AI output must be validated before saving typed values.

If validation fails:

- Store a safe fallback result if needed.
- Mark `needsReview = true`.
- Store validation status.
- Do not break the user flow.

### 9.3 Human-in-the-loop review

AI output must not be treated as automatically correct.

Set `needsReview = true` when:

- confidence is below `0.7`,
- urgency is `critical`,
- sentiment is strongly negative,
- the ticket mentions refund/legal/complaint/cancellation/security,
- the AI provider returns invalid JSON,
- schema validation fails and fallback is used.

Review decisions:

- `approved`
- `corrected`
- `rejected`

Each decision must create an activity log or AI review event.

### 9.4 Agent reply draft workflow

From the ticket detail page:

1. Agent clicks **Generate reply draft** or uses the draft from AI analysis.
2. Agent can edit the draft in a form.
3. Agent posts it as a normal customer-visible reply.
4. Posted reply is stored in `ticket_replies` with `is_internal = false`.
5. Activity log records that the reply was based on an AI draft.

The AI draft must never be posted automatically without agent confirmation.

### 9.5 Mock AI provider

The app must work without a real AI API key.

Required environment behavior:

```txt
AI_PROVIDER=mock
```

Optional behavior:

```txt
AI_PROVIDER=openai
OPENAI_API_KEY=...
```

The mock provider must be deterministic enough for demos. A real provider is optional.

## 10. Data model

Preserve existing tables:

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

Add v2 AI tables:

### ai_prompt_versions

Purpose: track prompt versions used to generate AI output.

Fields:

- id
- name
- version
- provider
- model
- prompt_text
- is_active
- created_at

### ticket_ai_analyses

Purpose: store AI analysis results for tickets.

Fields:

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

Purpose: store human review history for AI output.

Fields:

- id
- ticket_ai_analysis_id
- ticket_id
- reviewer_id
- decision
- before_value
- after_value
- note
- created_at

Optional denormalized fields on `tickets` are allowed for easier list filtering:

- latest_ai_analysis_id
- ai_needs_review
- ai_sentiment
- ai_urgency
- ai_confidence

## 11. Status and priority values

Status values:

- open
- in_progress
- resolved
- closed

Product-facing status groups:

- `open` and `in_progress` are shown as `답변 대기`.
- `resolved` is shown as `답변 완료`.
- `closed` is shown as `종료`.

Priority values:

- low
- medium
- high
- urgent

AI urgency values:

- low
- medium
- high
- critical

AI sentiment values:

- positive
- neutral
- negative

## 12. Access control requirements

- Customers can access only their own tickets and customer-visible replies.
- Customers cannot access AI analysis rows.
- Customers cannot access internal notes.
- Agents can access AI analysis for assigned tickets only.
- Admins can access all ticket and AI analysis data.
- AI Review Queue must be protected by role.
- Supabase RLS policies must match the app-level permission model.

## 13. UX requirements

Every major page should handle:

- Loading state
- Error state
- Empty state
- Unauthorized state when needed

Specific requirements:

- For ticket list loading, prefer table skeletons.
- For ticket detail loading, prefer detail layout skeletons.
- For form submission, disable the submit button and show pending state.
- For AI analysis loading, show a clear analyzing state.
- For AI failures, show a recoverable error with retry/regenerate action.
- For low confidence, show a visible review-required badge.
- Keep the AI UI helpful but not overwhelming.

## 14. Portfolio selling points

The README and resume should emphasize:

1. Role-based access control
2. URL query based filtering
3. Server state management with TanStack Query
4. Form validation with React Hook Form and Zod
5. Loading/error/empty state UX
6. Activity logs for operational traceability
7. Feature-based folder architecture
8. Existing product upgrade instead of greenfield rebuild
9. AI provider abstraction with mock provider fallback
10. Zod validation for AI output
11. Confidence-based human review workflow
12. AI reply draft with human confirmation
13. Prompt version tracking

## 15. MVP acceptance criteria

The v2 update is complete when:

- Existing customer, agent, and admin flows still work.
- Existing ticket list filters and pagination still work.
- Agents/admins can run AI analysis from ticket detail.
- AI analysis is validated with Zod before typed values are saved.
- `AI_PROVIDER=mock` works without API keys.
- Customers cannot see AI internals.
- AI reply drafts are never posted automatically.
- Low-confidence or risky analysis appears in AI Review Queue.
- Admins can review, correct, approve, or reject AI analysis.
- Ticket list supports AI-related filters.
- Dashboard includes AI insight cards.
- README explains the v2 AI upgrade, mock provider, demo accounts, and troubleshooting.
- `npm.cmd run lint` and `npm.cmd run build` pass when available.

## 16. Implementation phases

### Phase AI-0: Audit

Inspect the current codebase and produce a short implementation plan. Do not modify files yet.

Focus areas:

- Existing auth/RBAC patterns
- Existing Supabase schema and migrations
- Existing ticket APIs/actions/hooks
- Existing dashboard components
- Existing query key conventions
- Existing folder structure

### Phase AI-1: Schema and migrations

Add:

- AI output Zod schema
- TypeScript types
- Supabase migrations for AI tables
- RLS policies
- Seed initial prompt version if applicable
- `.env.example` AI variables

### Phase AI-2: Provider abstraction

Add:

- AI provider interface
- `AI_PROVIDER=mock`
- Optional real provider stub
- Analyze-ticket API/action
- Zod validation and fallback behavior
- TanStack Query invalidation

### Phase AI-3: Ticket detail AI Assistant

Add:

- AI Assistant panel
- Analyze/regenerate actions
- Analysis result display
- Confidence and review badges
- Copy draft and use-draft-as-reply flow
- Customer access restriction

### Phase AI-4: AI Review Queue

Add:

- `/tickets/ai-review` route
- Role-based access
- Review table and filters
- Approve/correct/reject actions
- Review events and ticket logs

### Phase AI-5: Ticket list and dashboard insights

Add:

- AI badges/columns on ticket list
- AI URL filters
- AI insight cards on dashboard

### Phase AI-6: README and polish

Add:

- SupportFlow v2 explanation
- Mock AI demo instructions
- Demo accounts
- Architecture notes
- Troubleshooting
- Portfolio/resume bullets
