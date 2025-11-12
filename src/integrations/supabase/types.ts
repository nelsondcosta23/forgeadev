export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_prompts: {
        Row: {
          created_at: string
          id: string
          prompt_text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          prompt_text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          prompt_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_roadmap: {
        Row: {
          created_at: string
          id: string
          priority: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          priority: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          priority?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_recommendations: {
        Row: {
          created_at: string
          id: string
          model_used: string
          prompt_used: string
          recommendation_text: string
          session_id: string
          tokens_used: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          model_used?: string
          prompt_used: string
          recommendation_text: string
          session_id: string
          tokens_used?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          model_used?: string
          prompt_used?: string
          recommendation_text?: string
          session_id?: string
          tokens_used?: number | null
        }
        Relationships: []
      }
      clicks: {
        Row: {
          clicked_at: string
          company_id: string | null
          cost: number | null
          country_code: string | null
          country_name: string | null
          created_at: string
          fingerprint: string | null
          id: string
          invalid_reason: string | null
          ip_address: string | null
          is_valid: boolean
          link_id: string
          referer: string | null
          session_id: string | null
          source: string | null
          user_agent: string | null
        }
        Insert: {
          clicked_at?: string
          company_id?: string | null
          cost?: number | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string
          fingerprint?: string | null
          id?: string
          invalid_reason?: string | null
          ip_address?: string | null
          is_valid?: boolean
          link_id: string
          referer?: string | null
          session_id?: string | null
          source?: string | null
          user_agent?: string | null
        }
        Update: {
          clicked_at?: string
          company_id?: string | null
          cost?: number | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string
          fingerprint?: string | null
          id?: string
          invalid_reason?: string | null
          ip_address?: string | null
          is_valid?: boolean
          link_id?: string
          referer?: string | null
          session_id?: string | null
          source?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clicks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clicks_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "tracked_links"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          billing_address: string | null
          billing_email: string
          country_code: string
          country_name: string
          cpc_default: number
          created_at: string
          credits: number
          credits_used: number
          daily_limit: number | null
          id: string
          low_balance_threshold: number | null
          name: string
          status: boolean
          tax_id: string | null
          updated_at: string
          website: string
        }
        Insert: {
          billing_address?: string | null
          billing_email: string
          country_code: string
          country_name: string
          cpc_default?: number
          created_at?: string
          credits?: number
          credits_used?: number
          daily_limit?: number | null
          id?: string
          low_balance_threshold?: number | null
          name: string
          status?: boolean
          tax_id?: string | null
          updated_at?: string
          website: string
        }
        Update: {
          billing_address?: string | null
          billing_email?: string
          country_code?: string
          country_name?: string
          cpc_default?: number
          created_at?: string
          credits?: number
          credits_used?: number
          daily_limit?: number | null
          id?: string
          low_balance_threshold?: number | null
          name?: string
          status?: boolean
          tax_id?: string | null
          updated_at?: string
          website?: string
        }
        Relationships: []
      }
      country_store_links: {
        Row: {
          country_code: string
          country_name: string
          created_at: string
          id: string
          status: boolean
          store_name: string
          store_url: string
          updated_at: string
        }
        Insert: {
          country_code: string
          country_name: string
          created_at?: string
          id?: string
          status?: boolean
          store_name: string
          store_url: string
          updated_at?: string
        }
        Update: {
          country_code?: string
          country_name?: string
          created_at?: string
          id?: string
          status?: boolean
          store_name?: string
          store_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          company_id: string
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          type: string
        }
        Insert: {
          amount: number
          balance_after: number
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type: string
        }
        Update: {
          amount?: number
          balance_after?: number
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_responses: {
        Row: {
          answered_at: string
          id: string
          question_number: number
          question_text: string
          selected_answer: string
          session_id: string
        }
        Insert: {
          answered_at?: string
          id?: string
          question_number: number
          question_text: string
          selected_answer: string
          session_id: string
        }
        Update: {
          answered_at?: string
          id?: string
          question_number?: number
          question_text?: string
          selected_answer?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      quiz_sessions: {
        Row: {
          completed_at: string | null
          country_code: string | null
          country_name: string | null
          id: string
          session_id: string
          started_at: string
          total_score: number | null
        }
        Insert: {
          completed_at?: string | null
          country_code?: string | null
          country_name?: string | null
          id?: string
          session_id: string
          started_at?: string
          total_score?: number | null
        }
        Update: {
          completed_at?: string | null
          country_code?: string | null
          country_name?: string | null
          id?: string
          session_id?: string
          started_at?: string
          total_score?: number | null
        }
        Relationships: []
      }
      store_billing: {
        Row: {
          billing_email: string | null
          created_at: string
          credits: number
          credits_used: number
          id: string
          last_credit_update: string
          notes: string | null
          store_link_id: string
          updated_at: string
        }
        Insert: {
          billing_email?: string | null
          created_at?: string
          credits?: number
          credits_used?: number
          id?: string
          last_credit_update?: string
          notes?: string | null
          store_link_id: string
          updated_at?: string
        }
        Update: {
          billing_email?: string | null
          created_at?: string
          credits?: number
          credits_used?: number
          id?: string
          last_credit_update?: string
          notes?: string | null
          store_link_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_billing_store_link_id_fkey"
            columns: ["store_link_id"]
            isOneToOne: false
            referencedRelation: "country_store_links"
            referencedColumns: ["id"]
          },
        ]
      }
      tracked_links: {
        Row: {
          company_id: string | null
          cpc_override: number | null
          created_at: string
          daily_limit: number | null
          destination_url: string
          id: string
          invalid_clicks: number
          label: string | null
          short_code: string
          status: boolean
          total_clicks: number
          total_cost: number
          updated_at: string
          valid_clicks: number
        }
        Insert: {
          company_id?: string | null
          cpc_override?: number | null
          created_at?: string
          daily_limit?: number | null
          destination_url: string
          id?: string
          invalid_clicks?: number
          label?: string | null
          short_code: string
          status?: boolean
          total_clicks?: number
          total_cost?: number
          updated_at?: string
          valid_clicks?: number
        }
        Update: {
          company_id?: string | null
          cpc_override?: number | null
          created_at?: string
          daily_limit?: number | null
          destination_url?: string
          id?: string
          invalid_clicks?: number
          label?: string | null
          short_code?: string
          status?: boolean
          total_clicks?: number
          total_cost?: number
          updated_at?: string
          valid_clicks?: number
        }
        Relationships: [
          {
            foreignKeyName: "tracked_links_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      ai_link_analytics: {
        Row: {
          country_name: string | null
          destination_url: string | null
          product: string | null
          short_code: string | null
          source: string | null
          total_clicks: number | null
          unique_sessions: number | null
          valid_clicks: number | null
          valid_rate: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
