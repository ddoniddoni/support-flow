# SupportFlow Tasks

## Phase workflow

- Start every Phase from the latest `develop`.
- Create a dedicated Phase branch before implementation.
- Push the Phase branch after the work is committed.
- Merge the Phase branch back into `develop` after verification.
- Push `develop` after the merge.

## Phase 1: Project setup

- [ ] Create Next.js project with TypeScript
- [ ] Configure Tailwind CSS
- [ ] Install and configure shadcn/ui
- [ ] Set up base layout
- [ ] Set up route groups if useful
- [ ] Create common layout components
- [ ] Create basic README

## Phase 2: Supabase setup

- [x] Configure Supabase client
- [x] Create auth helper functions
- [x] Define database types
- [x] Prepare profiles table
- [x] Prepare tickets table
- [x] Prepare ticket_replies table
- [x] Prepare ticket_logs table

## Phase 3: Authentication

- [x] Implement signup page
- [x] Implement login page
- [x] Implement logout
- [x] Fetch current user profile
- [x] Protect authenticated routes
- [x] Redirect unauthorized users

## Phase 4: Role-based access

- [ ] Define role type: customer, agent, admin
- [ ] Create role guard utility
- [ ] Restrict customer to own tickets
- [ ] Restrict agent to assigned tickets
- [ ] Allow admin to access all tickets
- [ ] Create unauthorized page

## Phase 5: Ticket creation

- [x] Create ticket schema with Zod
- [x] Create ticket form with React Hook Form
- [x] Add validation messages
- [x] Add submit loading state
- [x] Add success/error toast
- [x] Redirect after successful creation

## Phase 6: Ticket list

- [x] Create ticket list API
- [x] Create useTickets hook with TanStack Query
- [x] Create ticket table
- [x] Add search
- [x] Add status filter
- [x] Add priority filter
- [x] Add category filter
- [x] Add pagination
- [x] Store filters in URL query parameters
- [x] Add loading skeleton
- [x] Add error state
- [x] Add empty state

## Phase 7: Ticket detail

- [x] Create ticket detail API
- [x] Create useTicket hook
- [x] Show ticket metadata
- [x] Show replies
- [x] Show internal notes
- [x] Show activity logs
- [x] Add detail skeleton
- [x] Add not-found state

## Phase 8: Ticket actions

- [x] Change ticket status
- [x] Assign agent
- [x] Change priority
- [x] Add optimistic update where appropriate
- [x] Add activity log after important changes
- [x] Handle failed mutation rollback

## Phase 9: Replies and internal notes

- [x] Create reply form
- [x] Create internal note form
- [x] Separate customer-visible replies and internal notes
- [x] Add validation
- [x] Add loading state
- [x] Update ticket detail after submission

## Phase 10: Dashboard

- [ ] Create dashboard stats API
- [ ] Show total tickets
- [ ] Show open tickets
- [ ] Show in-progress tickets
- [ ] Show resolved tickets
- [ ] Show urgent tickets
- [ ] Show category distribution
- [ ] Show status distribution

## Phase 11: Polish

- [ ] Improve responsive layout
- [ ] Add mobile table alternative if needed
- [ ] Add 404 page
- [ ] Add unauthorized page
- [ ] Add loading.tsx and error.tsx where useful
- [ ] Remove unused code
- [ ] Remove any unnecessary `any`
- [ ] Run lint
- [ ] Run build

## Phase 12: Portfolio documentation

- [ ] Write project intro
- [ ] Add demo accounts
- [ ] Add feature list
- [ ] Add tech stack explanation
- [ ] Add folder structure explanation
- [ ] Add troubleshooting section
- [ ] Add deployment link
- [ ] Add screenshots
