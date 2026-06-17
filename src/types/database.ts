import type { Role, TicketPriority, TicketStatus } from "@/types/domain";

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
          actor_id: string;
          action: string;
          before_value: string | null;
          after_value: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          actor_id: string;
          action: string;
          before_value?: string | null;
          after_value?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          ticket_id?: string;
          actor_id?: string;
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
    };
    Views: Record<string, never>;
    Functions: {
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
