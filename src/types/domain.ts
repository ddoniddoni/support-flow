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

export const aiCategories = [
  "technical",
  "billing",
  "account",
  "product",
  "shipping",
  "refund",
  "complaint",
  "other",
] as const;
export type AICategory = (typeof aiCategories)[number];

export const aiSentiments = ["positive", "neutral", "negative"] as const;
export type AISentiment = (typeof aiSentiments)[number];

export const aiUrgencies = ["low", "medium", "high", "critical"] as const;
export type AIUrgency = (typeof aiUrgencies)[number];

export const aiIntents = [
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
] as const;
export type AIIntent = (typeof aiIntents)[number];

export const aiValidationStatuses = ["valid", "fallback", "invalid"] as const;
export type AIValidationStatus = (typeof aiValidationStatuses)[number];

export const aiReviewDecisions = ["approved", "corrected", "rejected"] as const;
export type AIReviewDecision = (typeof aiReviewDecisions)[number];

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
