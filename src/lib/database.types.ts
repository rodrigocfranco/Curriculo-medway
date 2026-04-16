// GERADO — não editar manualmente. Rode `supabase gen types typescript --local > src/lib/database.types.ts`.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      curriculum_fields: {
        Row: {
          category: string
          created_at: string
          display_order: number
          field_key: string
          field_type: string
          id: string
          label: string
          options: Json | null
        }
        Insert: {
          category: string
          created_at?: string
          display_order?: number
          field_key: string
          field_type: string
          id?: string
          label: string
          options?: Json | null
        }
        Update: {
          category?: string
          created_at?: string
          display_order?: number
          field_key?: string
          field_type?: string
          id?: string
          label?: string
          options?: Json | null
        }
        Relationships: []
      }
      institutions: {
        Row: {
          created_at: string
          edital_url: string | null
          id: string
          name: string
          pdf_path: string | null
          short_name: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          edital_url?: string | null
          id?: string
          name: string
          pdf_path?: string | null
          short_name?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          edital_url?: string | null
          id?: string
          name?: string
          pdf_path?: string | null
          short_name?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          graduation_year: number | null
          id: string
          name: string
          phone: string | null
          role: string
          specialty_interest: string | null
          state: string | null
          university: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          graduation_year?: number | null
          id: string
          name: string
          phone?: string | null
          role?: string
          specialty_interest?: string | null
          state?: string | null
          university?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          graduation_year?: number | null
          id?: string
          name?: string
          phone?: string | null
          role?: string
          specialty_interest?: string | null
          state?: string | null
          university?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      scoring_rules: {
        Row: {
          category: string
          created_at: string
          description: string | null
          field_key: string
          formula: Json
          id: string
          institution_id: string
          max_points: number
          specialty_id: string | null
          updated_at: string
          weight: number
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          field_key: string
          formula: Json
          id?: string
          institution_id: string
          max_points: number
          specialty_id?: string | null
          updated_at?: string
          weight: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          field_key?: string
          formula?: Json
          id?: string
          institution_id?: string
          max_points?: number
          specialty_id?: string | null
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "scoring_rules_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scoring_rules_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      specialties: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_curriculum: {
        Row: {
          data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_curriculum_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_scores: {
        Row: {
          breakdown: Json
          calculated_at: string | null
          institution_id: string
          max_score: number
          score: number
          specialty_id: string
          stale: boolean
          user_id: string
        }
        Insert: {
          breakdown?: Json
          calculated_at?: string | null
          institution_id: string
          max_score?: number
          score?: number
          specialty_id: string
          stale?: boolean
          user_id: string
        }
        Update: {
          breakdown?: Json
          calculated_at?: string | null
          institution_id?: string
          max_score?: number
          score?: number
          specialty_id?: string
          stale?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_scores_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_scores_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { uid: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

