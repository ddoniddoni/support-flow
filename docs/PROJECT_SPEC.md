# SupportFlow Project Spec

## One-line description

SupportFlow is a role-based B2B customer support ticket management SaaS built as a production-like front-end portfolio project.

## Goal

The goal is to demonstrate practical front-end engineering ability for employment.

This project should prove that the developer can build:

- Admin dashboards
- Authenticated applications
- Role-based UI
- Data tables
- Search/filter/sort/pagination
- Complex forms
- Server state management
- Error/loading/empty states
- Maintainable feature-based architecture

## Not the goal

This project should not look like:

- A simple inquiry board
- A basic CRUD app
- A tutorial clone
- A UI-only mockup
- A project with many unfinished features

## Main user flow

### Customer flow

1. Customer signs up or logs in.
2. Customer creates a support ticket.
3. Customer checks ticket status.
4. Customer reads replies from support team.

### Agent flow

1. Agent logs in.
2. Agent sees assigned tickets.
3. Agent opens a ticket detail page.
4. Agent writes a reply.
5. Agent adds internal notes.
6. Agent changes status from open to in_progress or resolved.

### Admin flow

1. Admin logs in.
2. Admin sees dashboard statistics.
3. Admin views all tickets.
4. Admin filters tickets by status, priority, category, or assignee.
5. Admin assigns an agent.
6. Admin changes ticket priority.
7. Admin checks activity logs.

## Main pages

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

Show:

- Total tickets
- Open tickets
- In-progress tickets
- Resolved tickets
- Urgent tickets
- Tickets created today
- Status distribution
- Category distribution

### Ticket list page

Must include:

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

### New ticket page

Form fields:

- Title
- Content
- Category
- Priority

Use React Hook Form and Zod.

### Ticket detail page

Show:

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

## Portfolio selling points

The README and resume should emphasize:

1. Role-based access control
2. URL query based filtering
3. Server state management with TanStack Query
4. Form validation with React Hook Form and Zod
5. Loading/error/empty state UX
6. Activity logs for operational traceability
7. Feature-based folder architecture
