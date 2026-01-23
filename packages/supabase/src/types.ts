export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      context_set_general: {
        Row: {
          context_set_id: string
          created_at: string | null
          id: string
          key: string
          value: string
        }
        Insert: {
          context_set_id: string
          created_at?: string | null
          id?: string
          key: string
          value: string
        }
        Update: {
          context_set_id?: string
          created_at?: string | null
          id?: string
          key?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "context_set_general_context_set_id_fkey"
            columns: ["context_set_id"]
            isOneToOne: false
            referencedRelation: "context_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      context_set_terms: {
        Row: {
          context_set_id: string
          created_at: string | null
          id: string
          sort_order: number | null
          term: string
        }
        Insert: {
          context_set_id: string
          created_at?: string | null
          id?: string
          sort_order?: number | null
          term: string
        }
        Update: {
          context_set_id?: string
          created_at?: string | null
          id?: string
          sort_order?: number | null
          term?: string
        }
        Relationships: [
          {
            foreignKeyName: "context_set_terms_context_set_id_fkey"
            columns: ["context_set_id"]
            isOneToOne: false
            referencedRelation: "context_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      context_set_translation_terms: {
        Row: {
          context_set_id: string
          created_at: string | null
          id: string
          sort_order: number | null
          source: string
          target: string
        }
        Insert: {
          context_set_id: string
          created_at?: string | null
          id?: string
          sort_order?: number | null
          source: string
          target: string
        }
        Update: {
          context_set_id?: string
          created_at?: string | null
          id?: string
          sort_order?: number | null
          source?: string
          target?: string
        }
        Relationships: [
          {
            foreignKeyName: "context_set_translation_terms_context_set_id_fkey"
            columns: ["context_set_id"]
            isOneToOne: false
            referencedRelation: "context_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      context_sets: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          text: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          text?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          text?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      join_requests: {
        Row: {
          email: string | null
          id: string
          message: string | null
          name: string
          requested_at: string | null
          responded_at: string | null
          responded_by_user_id: string | null
          session_id: string
          status: string | null
        }
        Insert: {
          email?: string | null
          id?: string
          message?: string | null
          name: string
          requested_at?: string | null
          responded_at?: string | null
          responded_by_user_id?: string | null
          session_id: string
          status?: string | null
        }
        Update: {
          email?: string | null
          id?: string
          message?: string | null
          name?: string
          requested_at?: string | null
          responded_at?: string | null
          responded_by_user_id?: string | null
          session_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "join_requests_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      meet_session_participants: {
        Row: {
          display_name: string
          email: string | null
          id: string
          is_active: boolean | null
          joined_at: string | null
          left_at: string | null
          session_id: string
          user_id: string
        }
        Insert: {
          display_name: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          left_at?: string | null
          session_id: string
          user_id: string
        }
        Update: {
          display_name?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          left_at?: string | null
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meet_session_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "meet_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      meet_sessions: {
        Row: {
          created_at: string | null
          ended_at: string | null
          id: string
          meeting_code: string
          status: string | null
          total_participants: number | null
          total_transcripts: number | null
        }
        Insert: {
          created_at?: string | null
          ended_at?: string | null
          id?: string
          meeting_code: string
          status?: string | null
          total_participants?: number | null
          total_transcripts?: number | null
        }
        Update: {
          created_at?: string | null
          ended_at?: string | null
          id?: string
          meeting_code?: string
          status?: string | null
          total_participants?: number | null
          total_transcripts?: number | null
        }
        Relationships: []
      }
      meet_transcripts: {
        Row: {
          created_at: string | null
          end_time: string | null
          id: string
          is_final: boolean | null
          participant_id: string
          session_id: string
          start_time: string
          text: string
          translated_text: string | null
        }
        Insert: {
          created_at?: string | null
          end_time?: string | null
          id?: string
          is_final?: boolean | null
          participant_id: string
          session_id: string
          start_time: string
          text: string
          translated_text?: string | null
        }
        Update: {
          created_at?: string | null
          end_time?: string | null
          id?: string
          is_final?: boolean | null
          participant_id?: string
          session_id?: string
          start_time?: string
          text?: string
          translated_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meet_transcripts_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "meet_session_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meet_transcripts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "meet_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          id: string
          is_host: boolean | null
          joined_at: string | null
          left_at: string | null
          name: string
          preferred_language: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          is_host?: boolean | null
          joined_at?: string | null
          left_at?: string | null
          name: string
          preferred_language?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          is_host?: boolean | null
          joined_at?: string | null
          left_at?: string | null
          name?: string
          preferred_language?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      session_context_sets: {
        Row: {
          added_at: string | null
          context_set_id: string
          id: string
          session_id: string
          sort_order: number | null
        }
        Insert: {
          added_at?: string | null
          context_set_id: string
          id?: string
          session_id: string
          sort_order?: number | null
        }
        Update: {
          added_at?: string | null
          context_set_id?: string
          id?: string
          session_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "session_context_sets_context_set_id_fkey"
            columns: ["context_set_id"]
            isOneToOne: false
            referencedRelation: "context_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_context_sets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_invitations: {
        Row: {
          email: string
          id: string
          invited_at: string | null
          invited_by_user_id: string | null
          responded_at: string | null
          session_id: string
          status: string | null
        }
        Insert: {
          email: string
          id?: string
          invited_at?: string | null
          invited_by_user_id?: string | null
          responded_at?: string | null
          session_id: string
          status?: string | null
        }
        Update: {
          email?: string
          id?: string
          invited_at?: string | null
          invited_by_user_id?: string | null
          responded_at?: string | null
          session_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_invitations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          allow_join_requests: boolean | null
          code: string
          created_at: string | null
          creator_user_id: string | null
          description: string | null
          enable_speaker_diarization: boolean | null
          ended_at: string | null
          host_name: string
          id: string
          is_public: boolean | null
          language_a: string | null
          language_b: string | null
          mode: string
          scheduled_start_time: string | null
          status: string | null
          target_language: string | null
          title: string | null
        }
        Insert: {
          allow_join_requests?: boolean | null
          code: string
          created_at?: string | null
          creator_user_id?: string | null
          description?: string | null
          enable_speaker_diarization?: boolean | null
          ended_at?: string | null
          host_name: string
          id?: string
          is_public?: boolean | null
          language_a?: string | null
          language_b?: string | null
          mode: string
          scheduled_start_time?: string | null
          status?: string | null
          target_language?: string | null
          title?: string | null
        }
        Update: {
          allow_join_requests?: boolean | null
          code?: string
          created_at?: string | null
          creator_user_id?: string | null
          description?: string | null
          enable_speaker_diarization?: boolean | null
          ended_at?: string | null
          host_name?: string
          id?: string
          is_public?: boolean | null
          language_a?: string | null
          language_b?: string | null
          mode?: string
          scheduled_start_time?: string | null
          status?: string | null
          target_language?: string | null
          title?: string | null
        }
        Relationships: []
      }
      transcripts: {
        Row: {
          created_at: string | null
          id: string
          is_final: boolean | null
          original_text: string
          participant_id: string | null
          participant_name: string
          sequence_number: number
          session_id: string | null
          source_language: string | null
          speaker_id: string | null
          target_language: string | null
          translated_text: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_final?: boolean | null
          original_text: string
          participant_id?: string | null
          participant_name: string
          sequence_number?: number
          session_id?: string | null
          source_language?: string | null
          speaker_id?: string | null
          target_language?: string | null
          translated_text?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_final?: boolean | null
          original_text?: string
          participant_id?: string | null
          participant_name?: string
          sequence_number?: number
          session_id?: string | null
          source_language?: string | null
          speaker_id?: string | null
          target_language?: string | null
          translated_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transcripts_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transcripts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const

