# SupportFlow v2 AI Upgrade — Codex Prompt Pack

Use these prompts one phase at a time. Do not ask Codex to implement everything at once unless the codebase is already small and clean.

## Initial prompt

```txt
Read AGENTS.md and PRD.md first.

We are updating the existing SupportFlow project, not creating a new product.
SupportFlow is already a role-based B2B customer support ticket management SaaS.
The goal is to add AI-assisted support operations on top of the existing ticket workflow.

Important:
- Preserve existing Customer / Agent / Admin flows.
- Do not rewrite the app from scratch.
- Use npm only. Do not introduce yarn or pnpm.
- Follow the Git workflow in AGENTS.md: start from develop, create a phase branch, verify with npm.cmd run lint and npm.cmd run build when available, then merge back to develop.
- Do not turn this into a separate VOC analytics product.
- The app must work with AI_PROVIDER=mock and no real AI API key.
- Follow the existing folder structure and coding conventions where possible.
- Keep changes small, type-safe, and reviewable.

Start with Phase AI-0: inspect the current codebase and produce a short implementation plan.
Do not modify files yet.
```

## Phase AI-1 prompt — Schema and migrations

```txt
Implement Phase AI-1 only.

Before coding:
- Check git status.
- Start from latest develop.
- Create a dedicated branch such as phase/ai-01-schema-migrations.

Scope:
- Add the AI output Zod schema.
- Add TypeScript types inferred from the schema.
- Add Supabase migrations for:
  - ai_prompt_versions
  - ticket_ai_analyses
  - ticket_ai_review_events
- Add indexes for ticket_id, needs_review, sentiment, urgency, confidence, created_at.
- Add RLS policies consistent with existing Customer / Agent / Admin rules.
- Seed an initial prompt version if this project has a seed mechanism.
- Update .env.example with AI_PROVIDER=mock and optional AI env vars.

Do not implement UI yet.
Do not add a real AI provider yet.
After implementing, run npm.cmd run lint and npm.cmd run build when available, then summarize changed files.
```

## Phase AI-2 prompt — Provider abstraction

```txt
Implement Phase AI-2 only.

Before coding:
- Check git status.
- Start from latest develop.
- Create a dedicated branch such as phase/ai-02-provider-abstraction.

Scope:
- Add features/ai provider abstraction.
- Implement AI_PROVIDER=mock.
- Add deterministic mock analysis based on ticket text keywords.
- Add analyzeTicket API/action using the existing server pattern.
- Validate AI output with Zod before saving.
- Store raw_response and validated_response.
- Mark needsReview based on confidence threshold and risk rules.
- Invalidate relevant TanStack Query keys after mutation.

Do not implement the ticket detail panel yet except minimal integration if needed for testing.
After implementing, run npm.cmd run lint and npm.cmd run build when available, then summarize changed files.
```

## Phase AI-3 prompt — Ticket detail AI Assistant

```txt
Implement Phase AI-3 only.

Before coding:
- Check git status.
- Start from latest develop.
- Create a dedicated branch such as phase/ai-03-ticket-detail-panel.

Scope:
- Add an AI Assistant panel to the ticket detail page.
- Show empty state when no analysis exists.
- Add Analyze and Regenerate actions.
- Show category, sentiment, urgency, suggested priority, confidence, needsReview, summary, reason, and replyDraft.
- Add loading/error states.
- Add copy reply draft action.
- Add "Use draft as reply" flow that lets the agent edit before posting.
- Do not auto-post AI text.
- Customers must not see the AI panel.

Preserve existing ticket detail layout and reply/internal-note functionality.
After implementing, run npm.cmd run lint and npm.cmd run build when available, then summarize changed files.
```

## Phase AI-4 prompt — AI Review Queue

```txt
Implement Phase AI-4 only.

Before coding:
- Check git status.
- Start from latest develop.
- Create a dedicated branch such as phase/ai-04-review-queue.

Scope:
- Add /tickets/ai-review route.
- Admins can see all items needing review.
- Agents can see assigned-ticket review items.
- Customers see unauthorized state.
- Add table with title, customer, status, priority, AI urgency, AI sentiment, confidence, review reason, assignee, created date.
- Add filters using URL query params where practical.
- Add approve/correct/reject actions.
- Save review events to ticket_ai_review_events.
- Add ticket_logs entries for review decisions.

Include loading, error, empty, and unauthorized states.
After implementing, run npm.cmd run lint and npm.cmd run build when available, then summarize changed files.
```

## Phase AI-5 prompt — Ticket list and dashboard insights

```txt
Implement Phase AI-5 only.

Before coding:
- Check git status.
- Start from latest develop.
- Create a dedicated branch such as phase/ai-05-dashboard-insights.

Scope:
- Add AI badges/columns to the existing ticket list.
- Add URL filters:
  - aiSentiment
  - aiUrgency
  - needsReview
  - confidenceMax
- Preserve existing status/priority/category/assignee/search/sort/pagination behavior.
- Add dashboard AI insight cards:
  - needs review count
  - negative sentiment count
  - high/critical urgency count
  - average confidence
  - top AI categories
  - AI analyses this week

Keep visuals simple and consistent with existing shadcn/ui components.
After implementing, run npm.cmd run lint and npm.cmd run build when available, then summarize changed files.
```

## Phase AI-6 prompt — README and polish

```txt
Implement Phase AI-6 only.

Before coding:
- Check git status.
- Start from latest develop.
- Create a dedicated branch such as phase/ai-06-readme-polish.

Scope:
- Update README to explain the SupportFlow v2 AI upgrade.
- Add demo accounts.
- Add AI_PROVIDER=mock demo instructions.
- Add architecture notes for AI provider abstraction.
- Add human-in-the-loop AI review explanation.
- Add troubleshooting.
- Add portfolio/resume bullet examples.
- Confirm npm.cmd run lint and npm.cmd run build status.

Do not change app behavior unless fixing documentation-discovered issues.
```
