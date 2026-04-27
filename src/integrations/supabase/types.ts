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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      metrics_history: {
        Row: {
          carbon_offsets: number
          costs: number
          created_at: string
          growth_rate: number
          id: string
          mau: number
          month: string
          month_date: string
          revenue: number
          startup_id: string
          transactions: number
        }
        Insert: {
          carbon_offsets?: number
          costs?: number
          created_at?: string
          growth_rate?: number
          id?: string
          mau?: number
          month: string
          month_date?: string
          revenue?: number
          startup_id: string
          transactions?: number
        }
        Update: {
          carbon_offsets?: number
          costs?: number
          created_at?: string
          growth_rate?: number
          id?: string
          mau?: number
          month?: string
          month_date?: string
          revenue?: number
          startup_id?: string
          transactions?: number
        }
        Relationships: [
          {
            foreignKeyName: "metrics_history_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      pledges: {
        Row: {
          committed_date: string
          created_at: string
          id: string
          pledge_text: string
          startup_id: string
          status: string
        }
        Insert: {
          committed_date?: string
          created_at?: string
          id?: string
          pledge_text: string
          startup_id: string
          status?: string
        }
        Update: {
          committed_date?: string
          created_at?: string
          id?: string
          pledge_text?: string
          startup_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pledges_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
          visibility_public: boolean
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
          visibility_public?: boolean
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          visibility_public?: boolean
        }
        Relationships: []
      }
      proposals: {
        Row: {
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          proposer: string
          status: string
          title: string
          votes_abstain: number
          votes_against: number
          votes_for: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          proposer: string
          status?: string
          title: string
          votes_abstain?: number
          votes_against?: number
          votes_for?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          proposer?: string
          status?: string
          title?: string
          votes_abstain?: number
          votes_against?: number
          votes_for?: number
        }
        Relationships: []
      }
      startup_audit_log: {
        Row: {
          changed_at: string
          field_changed: string
          id: string
          new_value: string | null
          old_value: string | null
          startup_id: string
          tx_hash: string
          user_id: string
        }
        Insert: {
          changed_at?: string
          field_changed: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          startup_id: string
          tx_hash: string
          user_id: string
        }
        Update: {
          changed_at?: string
          field_changed?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          startup_id?: string
          tx_hash?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "startup_audit_log_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      startups: {
        Row: {
          blockchain: string
          carbon_offset_tonnes: number
          carbon_score: number
          category: string
          chain_type: string | null
          created_at: string
          description: string | null
          energy_consumption: number
          energy_per_transaction: string | null
          energy_score: number
          founded_date: string | null
          governance_score: number
          growth_rate: number
          id: string
          inflation_rate: number
          logo_url: string | null
          mrr: number
          name: string
          sustainability_score: number
          team_size: number
          token_concentration_pct: number
          tokenomics_score: number
          treasury: number
          trust_score: number
          user_id: string | null
          users: number
          verified: boolean
          website: string | null
          whale_concentration: number
        }
        Insert: {
          blockchain?: string
          carbon_offset_tonnes?: number
          carbon_score?: number
          category?: string
          chain_type?: string | null
          created_at?: string
          description?: string | null
          energy_consumption?: number
          energy_per_transaction?: string | null
          energy_score?: number
          founded_date?: string | null
          governance_score?: number
          growth_rate?: number
          id?: string
          inflation_rate?: number
          logo_url?: string | null
          mrr?: number
          name: string
          sustainability_score?: number
          team_size?: number
          token_concentration_pct?: number
          tokenomics_score?: number
          treasury?: number
          trust_score?: number
          user_id?: string | null
          users?: number
          verified?: boolean
          website?: string | null
          whale_concentration?: number
        }
        Update: {
          blockchain?: string
          carbon_offset_tonnes?: number
          carbon_score?: number
          category?: string
          chain_type?: string | null
          created_at?: string
          description?: string | null
          energy_consumption?: number
          energy_per_transaction?: string | null
          energy_score?: number
          founded_date?: string | null
          governance_score?: number
          growth_rate?: number
          id?: string
          inflation_rate?: number
          logo_url?: string | null
          mrr?: number
          name?: string
          sustainability_score?: number
          team_size?: number
          token_concentration_pct?: number
          tokenomics_score?: number
          treasury?: number
          trust_score?: number
          user_id?: string | null
          users?: number
          verified?: boolean
          website?: string | null
          whale_concentration?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      // ── Tables added in later migrations (votes, funding_rounds, token_unlocks, deal_rooms) ──
      // Hand-maintained until `supabase gen types` is re-run. Column shapes match
      // the corresponding `CREATE TABLE` statements in supabase/migrations/.
      votes: {
        Row: {
          id: string
          proposal_id: string
          user_id: string
          vote: string
          created_at: string
        }
        Insert: {
          id?: string
          proposal_id: string
          user_id: string
          vote: string
          created_at?: string
        }
        Update: {
          id?: string
          proposal_id?: string
          user_id?: string
          vote?: string
          created_at?: string
        }
        Relationships: []
      }
      funding_rounds: {
        Row: {
          id: string
          startup_id: string
          round_name: string
          amount: number
          valuation: number
          round_date: string
          investors: string[]
          created_at: string
          // Pitchbook-style additions (migration 20260422100000)
          round_type: string | null
          lead_investor: string | null
          participating: Json | null
          announcement_url: string | null
        }
        Insert: {
          id?: string
          startup_id: string
          round_name: string
          amount?: number
          valuation?: number
          round_date: string
          investors?: string[]
          created_at?: string
          round_type?: string | null
          lead_investor?: string | null
          participating?: Json | null
          announcement_url?: string | null
        }
        Update: {
          id?: string
          startup_id?: string
          round_name?: string
          amount?: number
          valuation?: number
          round_date?: string
          investors?: string[]
          created_at?: string
          round_type?: string | null
          lead_investor?: string | null
          participating?: Json | null
          announcement_url?: string | null
        }
        Relationships: []
      }
      token_unlocks: {
        Row: {
          id: string
          startup_id: string
          unlock_date: string
          amount: number
          category: string
          unlocked: boolean
          created_at: string
        }
        Insert: {
          id?: string
          startup_id: string
          unlock_date: string
          amount?: number
          category: string
          unlocked?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          startup_id?: string
          unlock_date?: string
          amount?: number
          category?: string
          unlocked?: boolean
          created_at?: string
        }
        Relationships: []
      }
      deal_rooms: {
        Row: {
          id: string
          startup_id: string
          creator_id: string
          title: string
          summary: string | null
          target_amount: number
          min_ticket: number
          raised_amount: number
          accepted_tokens: string[]
          deadline: string
          terms: Json | null
          escrow_address: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          startup_id: string
          creator_id: string
          title: string
          summary?: string | null
          target_amount: number
          min_ticket: number
          raised_amount?: number
          accepted_tokens?: string[]
          deadline: string
          terms?: Json | null
          escrow_address?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          startup_id?: string
          creator_id?: string
          title?: string
          summary?: string | null
          target_amount?: number
          min_ticket?: number
          raised_amount?: number
          accepted_tokens?: string[]
          deadline?: string
          terms?: Json | null
          escrow_address?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "investor" | "startup"
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
      app_role: ["admin", "investor", "startup"],
    },
  },
} as const
