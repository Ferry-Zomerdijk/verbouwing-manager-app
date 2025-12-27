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
      contractors: {
        Row: {
          bedrijf: string | null
          created_at: string | null
          email: string | null
          id: string
          naam: string
          notities: string | null
          project_id: string
          rol: string | null
          telefoon: string | null
        }
        Insert: {
          bedrijf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          naam: string
          notities?: string | null
          project_id: string
          rol?: string | null
          telefoon?: string | null
        }
        Update: {
          bedrijf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          naam?: string
          notities?: string | null
          project_id?: string
          rol?: string | null
          telefoon?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contractors_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      costs: {
        Row: {
          bedrag: number
          beschrijving: string | null
          categorie: Database["public"]["Enums"]["cost_category"]
          created_at: string | null
          datum: string
          deel_van_huis: string | null
          factuur_url: string | null
          id: string
          koppeling_begrotingspost: string | null
          leverancier: string | null
          ocr_herkenning: Json | null
          project_id: string
          status: Database["public"]["Enums"]["cost_status"]
        }
        Insert: {
          bedrag: number
          beschrijving?: string | null
          categorie: Database["public"]["Enums"]["cost_category"]
          created_at?: string | null
          datum?: string
          deel_van_huis?: string | null
          factuur_url?: string | null
          id?: string
          koppeling_begrotingspost?: string | null
          leverancier?: string | null
          ocr_herkenning?: Json | null
          project_id: string
          status?: Database["public"]["Enums"]["cost_status"]
        }
        Update: {
          bedrag?: number
          beschrijving?: string | null
          categorie?: Database["public"]["Enums"]["cost_category"]
          created_at?: string | null
          datum?: string
          deel_van_huis?: string | null
          factuur_url?: string | null
          id?: string
          koppeling_begrotingspost?: string | null
          leverancier?: string | null
          ocr_herkenning?: Json | null
          project_id?: string
          status?: Database["public"]["Enums"]["cost_status"]
        }
        Relationships: [
          {
            foreignKeyName: "costs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          bestand_url: string
          bestandsnaam: string
          id: string
          project_id: string
          type: Database["public"]["Enums"]["document_type"]
          upload_datum: string | null
        }
        Insert: {
          bestand_url: string
          bestandsnaam: string
          id?: string
          project_id: string
          type: Database["public"]["Enums"]["document_type"]
          upload_datum?: string | null
        }
        Update: {
          bestand_url?: string
          bestandsnaam?: string
          id?: string
          project_id?: string
          type?: Database["public"]["Enums"]["document_type"]
          upload_datum?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          bericht: string
          datum: string | null
          gelezen: boolean | null
          id: string
          project_id: string | null
          titel: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          bericht: string
          datum?: string | null
          gelezen?: boolean | null
          id?: string
          project_id?: string | null
          titel: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          bericht?: string
          datum?: string | null
          gelezen?: boolean | null
          id?: string
          project_id?: string | null
          titel?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          afbeelding_url: string
          created_at: string | null
          fase: Database["public"]["Enums"]["photo_phase"]
          herkende_objecten: Json | null
          id: string
          notitie: string | null
          project_id: string
        }
        Insert: {
          afbeelding_url: string
          created_at?: string | null
          fase: Database["public"]["Enums"]["photo_phase"]
          herkende_objecten?: Json | null
          id?: string
          notitie?: string | null
          project_id: string
        }
        Update: {
          afbeelding_url?: string
          created_at?: string | null
          fase?: Database["public"]["Enums"]["photo_phase"]
          herkende_objecten?: Json | null
          id?: string
          notitie?: string | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          naam: string | null
          rol: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          naam?: string | null
          rol?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          naam?: string | null
          rol?: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: []
      }
      project_access_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          project_id: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          project_id: string
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          project_id?: string
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_access_tokens_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invite_token: string
          invited_by: string
          project_id: string
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          invite_token: string
          invited_by: string
          project_id: string
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invite_token?: string
          invited_by?: string
          project_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_invitations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_users: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_users_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          beschrijving: string | null
          created_at: string | null
          einddatum: string | null
          id: string
          naam: string
          startdatum: string | null
          status: Database["public"]["Enums"]["project_status"] | null
          totaal_begroting: number | null
          type: string | null
          updated_at: string | null
          user_id: string
          voortgang: number | null
          werkelijke_kosten: number | null
        }
        Insert: {
          beschrijving?: string | null
          created_at?: string | null
          einddatum?: string | null
          id?: string
          naam: string
          startdatum?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          totaal_begroting?: number | null
          type?: string | null
          updated_at?: string | null
          user_id: string
          voortgang?: number | null
          werkelijke_kosten?: number | null
        }
        Update: {
          beschrijving?: string | null
          created_at?: string | null
          einddatum?: string | null
          id?: string
          naam?: string
          startdatum?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          totaal_begroting?: number | null
          type?: string | null
          updated_at?: string | null
          user_id?: string
          voortgang?: number | null
          werkelijke_kosten?: number | null
        }
        Relationships: []
      }
      task_activity_log: {
        Row: {
          action: string
          changes: Json | null
          created_at: string | null
          id: string
          project_id: string
          task_id: string | null
          task_title: string
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string | null
          id?: string
          project_id: string
          task_id?: string | null
          task_title: string
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string | null
          id?: string
          project_id?: string
          task_id?: string | null
          task_title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_activity_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_activity_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_updates: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          image_urls: string[] | null
          task_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          image_urls?: string[] | null
          task_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          image_urls?: string[] | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_updates_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          begindatum: string | null
          beschrijving: string | null
          created_at: string | null
          deadline: string | null
          deel_van_huis: string | null
          id: string
          prioriteit: Database["public"]["Enums"]["task_priority"] | null
          project_id: string
          status: Database["public"]["Enums"]["task_status"] | null
          titel: string
          updated_at: string | null
          verantwoordelijke: string | null
        }
        Insert: {
          begindatum?: string | null
          beschrijving?: string | null
          created_at?: string | null
          deadline?: string | null
          deel_van_huis?: string | null
          id?: string
          prioriteit?: Database["public"]["Enums"]["task_priority"] | null
          project_id: string
          status?: Database["public"]["Enums"]["task_status"] | null
          titel: string
          updated_at?: string | null
          verantwoordelijke?: string | null
        }
        Update: {
          begindatum?: string | null
          beschrijving?: string | null
          created_at?: string | null
          deadline?: string | null
          deel_van_huis?: string | null
          id?: string
          prioriteit?: Database["public"]["Enums"]["task_priority"] | null
          project_id?: string
          status?: Database["public"]["Enums"]["task_status"] | null
          titel?: string
          updated_at?: string | null
          verantwoordelijke?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_pins: {
        Row: {
          created_at: string | null
          encrypted_password: string
          failed_attempts: number | null
          id: string
          locked_until: string | null
          pin_hash: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          encrypted_password: string
          failed_attempts?: number | null
          id?: string
          locked_until?: string | null
          pin_hash: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          encrypted_password?: string
          failed_attempts?: number | null
          id?: string
          locked_until?: string | null
          pin_hash?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_project_access: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
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
      app_role: "admin" | "project_user"
      cost_category:
        | "Materiaal"
        | "Arbeid"
        | "Vergunningen"
        | "Overig"
        | "Kluswerkzaamheden"
        | "Decoratie"
        | "Meubels"
      cost_status: "Schatting" | "Offerte" | "Factuur"
      document_type:
        | "Offerte"
        | "Vergunning"
        | "Handleiding"
        | "Garantie"
        | "Contract"
        | "Overig"
        | "Plattegrond"
      notification_type: "Taak" | "Budget" | "Document"
      photo_phase: "Voor" | "Tijdens" | "Na"
      project_status: "Gepland" | "Lopend" | "Afgerond"
      task_priority: "Laag" | "Middel" | "Hoog"
      task_status: "Te doen" | "Bezig" | "Gereed"
      user_role: "Eigenaar" | "Partner" | "Aannemer" | "Adviseur"
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
      app_role: ["admin", "project_user"],
      cost_category: [
        "Materiaal",
        "Arbeid",
        "Vergunningen",
        "Overig",
        "Kluswerkzaamheden",
        "Decoratie",
        "Meubels",
      ],
      cost_status: ["Schatting", "Offerte", "Factuur"],
      document_type: [
        "Offerte",
        "Vergunning",
        "Handleiding",
        "Garantie",
        "Contract",
        "Overig",
        "Plattegrond",
      ],
      notification_type: ["Taak", "Budget", "Document"],
      photo_phase: ["Voor", "Tijdens", "Na"],
      project_status: ["Gepland", "Lopend", "Afgerond"],
      task_priority: ["Laag", "Middel", "Hoog"],
      task_status: ["Te doen", "Bezig", "Gereed"],
      user_role: ["Eigenaar", "Partner", "Aannemer", "Adviseur"],
    },
  },
} as const
