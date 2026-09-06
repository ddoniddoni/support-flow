import type {
  AICategory,
  AIIntent,
  AIReviewDecision,
  AISentiment,
  AIUrgency,
  AIValidationStatus,
  Role,
  TicketPriority,
  TicketStatus,
} from "@/types/domain";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      user_management_events: {
        Row: { id: string; actor_id: string | null; target_id: string | null; target_email: string; action: string; previous_role: Role | null; next_role: Role; created_at: string };
        Insert: { actor_id?: string | null; target_id?: string | null; target_email: string; action: string; previous_role?: Role | null; next_role: Role };
        Update: never;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: Role;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role?: Role;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: Role;
          created_at?: string;
        };
        Relationships: [];
      };
      tickets: {
        Row: {
          id: string;
          title: string;
          content: string;
          status: TicketStatus;
          priority: TicketPriority;
          category: string;
          ticket_number: number;
          customer_id: string;
          assignee_id: string | null;
          latest_ai_analysis_id: string | null;
          ai_needs_review: boolean;
          ai_sentiment: AISentiment | null;
          ai_urgency: AIUrgency | null;
          ai_confidence: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          status?: TicketStatus;
          priority?: TicketPriority;
          category: string;
          ticket_number?: number;
          customer_id: string;
          assignee_id?: string | null;
          latest_ai_analysis_id?: string | null;
          ai_needs_review?: boolean;
          ai_sentiment?: AISentiment | null;
          ai_urgency?: AIUrgency | null;
          ai_confidence?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          status?: TicketStatus;
          priority?: TicketPriority;
          category?: string;
          ticket_number?: number;
          customer_id?: string;
          assignee_id?: string | null;
          latest_ai_analysis_id?: string | null;
          ai_needs_review?: boolean;
          ai_sentiment?: AISentiment | null;
          ai_urgency?: AIUrgency | null;
          ai_confidence?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tickets_customer_id_fkey";
            columns: ["customer_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tickets_assignee_id_fkey";
            columns: ["assignee_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tickets_latest_ai_analysis_id_fkey";
            columns: ["latest_ai_analysis_id"];
            referencedRelation: "ticket_ai_analyses";
            referencedColumns: ["id"];
          },
        ];
      };
      ticket_replies: {
        Row: {
          id: string;
          ticket_id: string;
          author_id: string;
          content: string;
          is_internal: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          author_id: string;
          content: string;
          is_internal?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          ticket_id?: string;
          author_id?: string;
          content?: string;
          is_internal?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ticket_replies_ticket_id_fkey";
            columns: ["ticket_id"];
            referencedRelation: "tickets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ticket_replies_author_id_fkey";
            columns: ["author_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      ticket_logs: {
        Row: {
          id: string;
          ticket_id: string;
          actor_id: string | null;
          action: string;
          before_value: string | null;
          after_value: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          actor_id: string | null;
          action: string;
          before_value?: string | null;
          after_value?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          ticket_id?: string;
          actor_id?: string | null;
          action?: string;
          before_value?: string | null;
          after_value?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ticket_logs_ticket_id_fkey";
            columns: ["ticket_id"];
            referencedRelation: "tickets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ticket_logs_actor_id_fkey";
            columns: ["actor_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_prompt_versions: {
        Row: {
          id: string;
          name: string;
          version: string;
          provider: string;
          model: string | null;
          prompt_text: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          version: string;
          provider: string;
          model?: string | null;
          prompt_text: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          version?: string;
          provider?: string;
          model?: string | null;
          prompt_text?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      ticket_ai_analyses: {
        Row: {
          id: string;
          ticket_id: string;
          prompt_version_id: string | null;
          provider: string;
          model: string | null;
          category: AICategory;
          sentiment: AISentiment;
          urgency: AIUrgency;
          intent: AIIntent;
          suggested_priority: TicketPriority | null;
          suggested_status: TicketStatus | null;
          suggested_assignee_role: string | null;
          tags: string[];
          summary: string;
          reason: string;
          reply_draft: string | null;
          confidence: number;
          needs_review: boolean;
          escalation_reason: string | null;
          review_decision: AIReviewDecision | null;
          raw_response: Json;
          validation_status: AIValidationStatus;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          prompt_version_id?: string | null;
          provider: string;
          model?: string | null;
          category: AICategory;
          sentiment: AISentiment;
          urgency: AIUrgency;
          intent: AIIntent;
          suggested_priority?: TicketPriority | null;
          suggested_status?: TicketStatus | null;
          suggested_assignee_role?: string | null;
          tags?: string[];
          summary: string;
          reason: string;
          reply_draft?: string | null;
          confidence: number;
          needs_review?: boolean;
          escalation_reason?: string | null;
          review_decision?: AIReviewDecision | null;
          raw_response?: Json;
          validation_status?: AIValidationStatus;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          ticket_id?: string;
          prompt_version_id?: string | null;
          provider?: string;
          model?: string | null;
          category?: AICategory;
          sentiment?: AISentiment;
          urgency?: AIUrgency;
          intent?: AIIntent;
          suggested_priority?: TicketPriority | null;
          suggested_status?: TicketStatus | null;
          suggested_assignee_role?: string | null;
          tags?: string[];
          summary?: string;
          reason?: string;
          reply_draft?: string | null;
          confidence?: number;
          needs_review?: boolean;
          escalation_reason?: string | null;
          review_decision?: AIReviewDecision | null;
          raw_response?: Json;
          validation_status?: AIValidationStatus;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ticket_ai_analyses_ticket_id_fkey";
            columns: ["ticket_id"];
            referencedRelation: "tickets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ticket_ai_analyses_prompt_version_id_fkey";
            columns: ["prompt_version_id"];
            referencedRelation: "ai_prompt_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ticket_ai_analyses_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      ticket_ai_review_events: {
        Row: {
          id: string;
          ticket_ai_analysis_id: string;
          ticket_id: string;
          reviewer_id: string;
          decision: AIReviewDecision;
          before_value: Json | null;
          after_value: Json | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_ai_analysis_id: string;
          ticket_id: string;
          reviewer_id: string;
          decision: AIReviewDecision;
          before_value?: Json | null;
          after_value?: Json | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          ticket_ai_analysis_id?: string;
          ticket_id?: string;
          reviewer_id?: string;
          decision?: AIReviewDecision;
          before_value?: Json | null;
          after_value?: Json | null;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ticket_ai_review_events_ticket_ai_analysis_id_fkey";
            columns: ["ticket_ai_analysis_id"];
            referencedRelation: "ticket_ai_analyses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ticket_ai_review_events_ticket_id_fkey";
            columns: ["ticket_id"];
            referencedRelation: "tickets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ticket_ai_review_events_reviewer_id_fkey";
            columns: ["reviewer_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      ticket_workspace: {
        Row: Database["public"]["Tables"]["tickets"]["Row"] & {
          ai_review_decision: AIReviewDecision | null;
          ai_urgency_rank: number;
          priority_rank: number;
          customer: { id: string; email: string; name: string } | null;
          assignee: { id: string; email: string; name: string } | null;
          latest_ai_analysis: Pick<Database["public"]["Tables"]["ticket_ai_analyses"]["Row"], "intent" | "summary" | "tags"> | null;
          ai_analysis: Omit<Database["public"]["Tables"]["ticket_ai_analyses"]["Row"], "raw_response"> | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      bulk_assign_tickets: { Args: { p_ticket_ids: string[]; p_assignee_id: string }; Returns: Json };
      admin_change_user_role: { Args: { p_target: string; p_role: Role }; Returns: Json };
      admin_finalize_user: { Args: { p_actor: string; p_target: string; p_role: Role }; Returns: Json };
      support_ticket_command: {
        Args: { p_ticket_id: string; p_action: string; p_payload?: Json };
        Returns: Json;
      };
      create_ticket_reply: {
        Args: {
          p_ticket_id: string;
          p_content: string;
          p_is_internal?: boolean;
        };
        Returns: {
          id: string;
          ticket_id: string;
          author_id: string;
          content: string;
          is_internal: boolean;
          created_at: string;
        };
      };
    };
    Enums: {
      user_role: Role;
      ticket_status: TicketStatus;
      ticket_priority: TicketPriority;
      ai_category: AICategory;
      ai_sentiment: AISentiment;
      ai_urgency: AIUrgency;
      ai_intent: AIIntent;
      ai_validation_status: AIValidationStatus;
      ai_review_decision: AIReviewDecision;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type Updates<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
