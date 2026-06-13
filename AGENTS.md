# AGENTS.md

## Project

This project is **SupportFlow**, a portfolio-grade B2B customer support ticket management SaaS.

The goal is not to build a simple CRUD app. The goal is to build a realistic front-end portfolio project that demonstrates production-like thinking: authentication, role-based access control, ticket management, filtering, server state management, forms, loading/error/empty states, and maintainable component architecture.

## Target impression

The project should make a hiring manager think:

> "This person can build real admin dashboards and can be trusted with practical front-end work."

Avoid making it look like a tutorial project or a simple customer inquiry board.

## Tech stack

Use:

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

## Product concept

SupportFlow is a role-based customer support operation dashboard.

Users can create support tickets. Agents can handle assigned tickets. Admins can view all tickets, assign agents, change priorities, and monitor support status.

## Roles

There are three roles:

### Customer

Can:

- Create tickets
- View only their own tickets
- View replies to their tickets

### Agent

Can:

- View assigned tickets
- Reply to tickets
- Change ticket status
- Add internal notes

### Admin

Can:

- View all tickets
- Assign agents
- Change priority
- Change status
- View dashboard statistics
- Manage users if needed

## Core features

Implement these as the main portfolio features:

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

## Important implementation rules

- Do not build this as a basic CRUD board.
- Prioritize realistic admin dashboard UX.
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

## Suggested folder structure

```txt
src/
  app/
    login/
    signup/
    dashboard/
    tickets/
      page.tsx
      new/
      [id]/
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

## Ticket data model

Use this conceptual data model:

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

## UX requirements

Every major page should handle:

- Loading state
- Error state
- Empty state
- Unauthorized state when needed

For ticket list loading, prefer table skeletons.

For ticket detail loading, prefer detail layout skeletons.

For form submission, disable the submit button and show pending state.

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

The body should explain why the change was made and include important
implementation details.

Allowed commit types:

- `feat`: Add a new feature
- `fix`: Fix a bug
- `docs`: Documentation-only changes
- `style`: Formatting or style-only changes with no code behavior change
- `refactor`: Code refactoring without a feature or bug fix
- `test`: Add or update tests
- `chore`: Build, package manager, tooling, or maintenance changes

Example:

```txt
feat(auth): 로그인 페이지 구현

Supabase signInWithPassword를 연결하고
폼 검증과 에러 상태를 추가했다.
```
