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
      ai_usage: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          usage_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          usage_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          usage_type?: string
          user_id?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          contractor_id: string
          created_at: string
          created_by: string | null
          date: string
          end_time: string | null
          id: string
          notes: string | null
          project_id: string
          start_time: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          updated_at: string
        }
        Insert: {
          contractor_id: string
          created_at?: string
          created_by?: string | null
          date: string
          end_time?: string | null
          id?: string
          notes?: string | null
          project_id: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
        }
        Update: {
          contractor_id?: string
          created_at?: string
          created_by?: string | null
          date?: string
          end_time?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_time_presets: {
        Row: {
          color: string | null
          created_at: string
          end_time: string
          id: string
          label: string
          project_id: string
          sort_order: number
          start_time: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          end_time: string
          id?: string
          label: string
          project_id: string
          sort_order?: number
          start_time: string
        }
        Update: {
          color?: string | null
          created_at?: string
          end_time?: string
          id?: string
          label?: string
          project_id?: string
          sort_order?: number
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_time_presets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_categories: {
        Row: {
          created_at: string | null
          icoon: string | null
          id: string
          naam: string
          project_id: string
          volgorde: number | null
        }
        Insert: {
          created_at?: string | null
          icoon?: string | null
          id?: string
          naam: string
          project_id: string
          volgorde?: number | null
        }
        Update: {
          created_at?: string | null
          icoon?: string | null
          id?: string
          naam?: string
          project_id?: string
          volgorde?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_categories_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_read: boolean | null
          message: string
          name: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_read?: boolean | null
          message: string
          name: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_read?: boolean | null
          message?: string
          name?: string
        }
        Relationships: []
      }
      contractors: {
        Row: {
          achternaam: string | null
          adres: string | null
          bedrijf: string | null
          category_id: string | null
          created_at: string | null
          email: string | null
          id: string
          is_actief: boolean | null
          label: string | null
          naam: string | null
          notities: string | null
          project_id: string
          rol: string | null
          telefoon: string | null
          voornaam: string | null
          website: string | null
        }
        Insert: {
          achternaam?: string | null
          adres?: string | null
          bedrijf?: string | null
          category_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_actief?: boolean | null
          label?: string | null
          naam?: string | null
          notities?: string | null
          project_id: string
          rol?: string | null
          telefoon?: string | null
          voornaam?: string | null
          website?: string | null
        }
        Update: {
          achternaam?: string | null
          adres?: string | null
          bedrijf?: string | null
          category_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_actief?: boolean | null
          label?: string | null
          naam?: string | null
          notities?: string | null
          project_id?: string
          rol?: string | null
          telefoon?: string | null
          voornaam?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contractors_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "contact_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractors_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_categories: {
        Row: {
          created_at: string | null
          id: string
          kleur: string | null
          naam: string
          project_id: string
          volgorde: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          kleur?: string | null
          naam: string
          project_id: string
          volgorde?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          kleur?: string | null
          naam?: string
          project_id?: string
          volgorde?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cost_categories_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_payers: {
        Row: {
          created_at: string
          id: string
          naam: string
          project_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          naam: string
          project_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          naam?: string
          project_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "cost_payers_project_id_fkey"
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
          betaald_door: string | null
          categorie: string
          created_at: string | null
          datum: string
          deel_van_huis: string | null
          factuur_url: string | null
          factuur_urls: string[] | null
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
          betaald_door?: string | null
          categorie: string
          created_at?: string | null
          datum?: string
          deel_van_huis?: string | null
          factuur_url?: string | null
          factuur_urls?: string[] | null
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
          betaald_door?: string | null
          categorie?: string
          created_at?: string | null
          datum?: string
          deel_van_huis?: string | null
          factuur_url?: string | null
          factuur_urls?: string[] | null
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
      customers: {
        Row: {
          created_at: string
          id: string
          stripe_customer_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          stripe_customer_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          stripe_customer_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      document_types: {
        Row: {
          created_at: string | null
          id: string
          is_systeem: boolean | null
          kleur: string | null
          naam: string
          project_id: string
          volgorde: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_systeem?: boolean | null
          kleur?: string | null
          naam: string
          project_id: string
          volgorde?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_systeem?: boolean | null
          kleur?: string | null
          naam?: string
          project_id?: string
          volgorde?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "document_types_project_id_fkey"
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
          type_id: string | null
          upload_datum: string | null
        }
        Insert: {
          bestand_url: string
          bestandsnaam: string
          id?: string
          project_id: string
          type: Database["public"]["Enums"]["document_type"]
          type_id?: string | null
          upload_datum?: string | null
        }
        Update: {
          bestand_url?: string
          bestandsnaam?: string
          id?: string
          project_id?: string
          type?: Database["public"]["Enums"]["document_type"]
          type_id?: string | null
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
          {
            foreignKeyName: "documents_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
        ]
      }
      house_parts: {
        Row: {
          created_at: string
          id: string
          naam: string
          project_id: string
          volgorde: number
        }
        Insert: {
          created_at?: string
          id?: string
          naam: string
          project_id: string
          volgorde?: number
        }
        Update: {
          created_at?: string
          id?: string
          naam?: string
          project_id?: string
          volgorde?: number
        }
        Relationships: [
          {
            foreignKeyName: "house_parts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      key_history: {
        Row: {
          created_at: string
          holder_name: string
          id: string
          key_id: string
          notes: string | null
          received_at: string
          returned_at: string | null
        }
        Insert: {
          created_at?: string
          holder_name: string
          id?: string
          key_id: string
          notes?: string | null
          received_at: string
          returned_at?: string | null
        }
        Update: {
          created_at?: string
          holder_name?: string
          id?: string
          key_id?: string
          notes?: string | null
          received_at?: string
          returned_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "key_history_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "keys"
            referencedColumns: ["id"]
          },
        ]
      }
      keys: {
        Row: {
          created_at: string
          current_holder: string | null
          deel_van_huis: string
          id: string
          key_number: string
          notes: string | null
          project_id: string
          received_at: string | null
          sequence_number: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_holder?: string | null
          deel_van_huis: string
          id?: string
          key_number: string
          notes?: string | null
          project_id: string
          received_at?: string | null
          sequence_number: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_holder?: string | null
          deel_van_huis?: string
          id?: string
          key_number?: string
          notes?: string | null
          project_id?: string
          received_at?: string | null
          sequence_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "keys_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_instructions: {
        Row: {
          beschrijving: string | null
          bijlage_url: string | null
          contact_naam: string | null
          contact_telefoon: string | null
          created_at: string
          deel_van_huis: string | null
          document_id: string | null
          frequentie: string | null
          id: string
          periode_tot: string | null
          periode_van: string | null
          project_id: string
          status: string
          titel: string
          volgorde: number
        }
        Insert: {
          beschrijving?: string | null
          bijlage_url?: string | null
          contact_naam?: string | null
          contact_telefoon?: string | null
          created_at?: string
          deel_van_huis?: string | null
          document_id?: string | null
          frequentie?: string | null
          id?: string
          periode_tot?: string | null
          periode_van?: string | null
          project_id: string
          status?: string
          titel: string
          volgorde?: number
        }
        Update: {
          beschrijving?: string | null
          bijlage_url?: string | null
          contact_naam?: string | null
          contact_telefoon?: string | null
          created_at?: string
          deel_van_huis?: string | null
          document_id?: string | null
          frequentie?: string | null
          id?: string
          periode_tot?: string | null
          periode_van?: string | null
          project_id?: string
          status?: string
          titel?: string
          volgorde?: number
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_instructions_project_id_fkey"
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
          deel_van_huis: string
          fase: Database["public"]["Enums"]["photo_phase"]
          herkende_objecten: Json | null
          id: string
          notitie: string | null
          project_id: string
        }
        Insert: {
          afbeelding_url: string
          created_at?: string | null
          deel_van_huis?: string
          fase: Database["public"]["Enums"]["photo_phase"]
          herkende_objecten?: Json | null
          id?: string
          notitie?: string | null
          project_id: string
        }
        Update: {
          afbeelding_url?: string
          created_at?: string | null
          deel_van_huis?: string
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
      prices: {
        Row: {
          active: boolean | null
          created_at: string
          currency: string
          id: string
          interval: string | null
          interval_count: number | null
          metadata: Json | null
          product_id: string | null
          trial_period_days: number | null
          type: string | null
          unit_amount: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          currency: string
          id: string
          interval?: string | null
          interval_count?: number | null
          metadata?: Json | null
          product_id?: string | null
          trial_period_days?: number | null
          type?: string | null
          unit_amount?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          currency?: string
          id?: string
          interval?: string | null
          interval_count?: number | null
          metadata?: Json | null
          product_id?: string | null
          trial_period_days?: number | null
          type?: string | null
          unit_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          id: string
          metadata?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          naam: string | null
          onboarding_completed: boolean | null
          rol: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          naam?: string | null
          onboarding_completed?: boolean | null
          rol?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          naam?: string | null
          onboarding_completed?: boolean | null
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
      public_project_shares: {
        Row: {
          created_at: string | null
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          project_id: string
          share_token: string
          view_count: number | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          project_id: string
          share_token: string
          view_count?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          project_id?: string
          share_token?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "public_project_shares_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at: string | null
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          customer_id: string | null
          expiry_reminder_sent_at: string | null
          id: string
          metadata: Json | null
          price_id: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          tier: Database["public"]["Enums"]["subscription_tier"]
          trial_end: string | null
          trial_start: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at?: string | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          customer_id?: string | null
          expiry_reminder_sent_at?: string | null
          id: string
          metadata?: Json | null
          price_id?: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          tier?: Database["public"]["Enums"]["subscription_tier"]
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at?: string | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          customer_id?: string | null
          expiry_reminder_sent_at?: string | null
          id?: string
          metadata?: Json | null
          price_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          tier?: Database["public"]["Enums"]["subscription_tier"]
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "prices"
            referencedColumns: ["id"]
          },
        ]
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
      task_types: {
        Row: {
          created_at: string | null
          icoon: string | null
          id: string
          is_systeem: boolean | null
          kleur: string | null
          naam: string
          volgorde: number | null
        }
        Insert: {
          created_at?: string | null
          icoon?: string | null
          id?: string
          is_systeem?: boolean | null
          kleur?: string | null
          naam: string
          volgorde?: number | null
        }
        Update: {
          created_at?: string | null
          icoon?: string | null
          id?: string
          is_systeem?: boolean | null
          kleur?: string | null
          naam?: string
          volgorde?: number | null
        }
        Relationships: []
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
          image_urls: string[] | null
          prioriteit: Database["public"]["Enums"]["task_priority"] | null
          project_id: string
          status: Database["public"]["Enums"]["task_status"] | null
          titel: string
          type_id: string | null
          updated_at: string | null
          verantwoordelijke: string | null
          verwachte_leverdatum: string | null
        }
        Insert: {
          begindatum?: string | null
          beschrijving?: string | null
          created_at?: string | null
          deadline?: string | null
          deel_van_huis?: string | null
          id?: string
          image_urls?: string[] | null
          prioriteit?: Database["public"]["Enums"]["task_priority"] | null
          project_id: string
          status?: Database["public"]["Enums"]["task_status"] | null
          titel: string
          type_id?: string | null
          updated_at?: string | null
          verantwoordelijke?: string | null
          verwachte_leverdatum?: string | null
        }
        Update: {
          begindatum?: string | null
          beschrijving?: string | null
          created_at?: string | null
          deadline?: string | null
          deel_van_huis?: string | null
          id?: string
          image_urls?: string[] | null
          prioriteit?: Database["public"]["Enums"]["task_priority"] | null
          project_id?: string
          status?: Database["public"]["Enums"]["task_status"] | null
          titel?: string
          type_id?: string | null
          updated_at?: string | null
          verantwoordelijke?: string | null
          verwachte_leverdatum?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "task_types"
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
      webhook_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_id: string
          event_type: string
          id: string
          processed_at: string | null
          processing_time_ms: number | null
          status: string
          stripe_customer_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_id: string
          event_type: string
          id?: string
          processed_at?: string | null
          processing_time_ms?: number | null
          status?: string
          stripe_customer_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_id?: string
          event_type?: string
          id?: string
          processed_at?: string | null
          processing_time_ms?: number | null
          status?: string
          stripe_customer_id?: string | null
          user_id?: string | null
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
      initialize_document_types: {
        Args: { p_project_id: string }
        Returns: undefined
      }
      initialize_house_parts: {
        Args: { p_project_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "project_user"
      attendance_status: "aanwezig" | "afwezig" | "ziek" | "vakantie"
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
      subscription_status:
        | "trialing"
        | "active"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "past_due"
        | "unpaid"
        | "paused"
      subscription_tier: "free" | "basis" | "pro"
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
      attendance_status: ["aanwezig", "afwezig", "ziek", "vakantie"],
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
      subscription_status: [
        "trialing",
        "active",
        "canceled",
        "incomplete",
        "incomplete_expired",
        "past_due",
        "unpaid",
        "paused",
      ],
      subscription_tier: ["free", "basis", "pro"],
      task_priority: ["Laag", "Middel", "Hoog"],
      task_status: ["Te doen", "Bezig", "Gereed"],
      user_role: ["Eigenaar", "Partner", "Aannemer", "Adviseur"],
    },
  },
} as const
