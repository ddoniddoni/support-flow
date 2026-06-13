export const roles = ["customer", "agent", "admin"] as const;
export type Role = (typeof roles)[number];

export const ticketStatuses = [
  "open",
  "in_progress",
  "resolved",
  "closed",
] as const;
export type TicketStatus = (typeof ticketStatuses)[number];

export const ticketPriorities = ["low", "medium", "high", "urgent"] as const;
export type TicketPriority = (typeof ticketPriorities)[number];

export type Profile = {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
};

export type Ticket = {
  id: string;
  title: string;
  content: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  customerId: string;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TicketReply = {
  id: string;
  ticketId: string;
  authorId: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
};

export type TicketLog = {
  id: string;
  ticketId: string;
  actorId: string;
  action: string;
  beforeValue: string | null;
  afterValue: string | null;
  createdAt: string;
};
