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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          clinic_id: string
          confirmation_sent: boolean | null
          created_at: string
          dentist_id: string | null
          duration_minutes: number | null
          id: string
          notes: string | null
          patient_id: string
          reminder_sent: boolean | null
          scheduled_at: string
          status: Database["public"]["Enums"]["appointment_status"] | null
          treatment_id: string | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          confirmation_sent?: boolean | null
          created_at?: string
          dentist_id?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          patient_id: string
          reminder_sent?: boolean | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
          treatment_id?: string | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          confirmation_sent?: boolean | null
          created_at?: string
          dentist_id?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          patient_id?: string
          reminder_sent?: boolean | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
          treatment_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_items: {
        Row: {
          budget_id: string
          created_at: string
          description: string
          id: string
          quantity: number | null
          tooth_number: number | null
          total: number
          treatment_id: string | null
          unit_price: number
        }
        Insert: {
          budget_id: string
          created_at?: string
          description: string
          id?: string
          quantity?: number | null
          tooth_number?: number | null
          total: number
          treatment_id?: string | null
          unit_price: number
        }
        Update: {
          budget_id?: string
          created_at?: string
          description?: string
          id?: string
          quantity?: number | null
          tooth_number?: number | null
          total?: number
          treatment_id?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_items_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          clinic_id: string
          created_at: string
          created_by: string | null
          discount_percent: number | null
          id: string
          notes: string | null
          patient_id: string
          status: string | null
          subtotal: number | null
          tax_percent: number | null
          total: number | null
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          created_by?: string | null
          discount_percent?: number | null
          id?: string
          notes?: string | null
          patient_id: string
          status?: string | null
          subtotal?: number | null
          tax_percent?: number | null
          total?: number | null
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          discount_percent?: number | null
          id?: string
          notes?: string | null
          patient_id?: string
          status?: string | null
          subtotal?: number | null
          tax_percent?: number | null
          total?: number | null
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          clicked_at: string | null
          clinic_id: string | null
          created_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          opened_at: string | null
          recipient_email: string
          recipient_id: string | null
          recipient_type: string
          resend_id: string | null
          status: string | null
          subject: string
          template_name: string
        }
        Insert: {
          clicked_at?: string | null
          clinic_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          recipient_email: string
          recipient_id?: string | null
          recipient_type?: string
          resend_id?: string | null
          status?: string | null
          subject: string
          template_name: string
        }
        Update: {
          clicked_at?: string | null
          clinic_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          recipient_email?: string
          recipient_id?: string | null
          recipient_type?: string
          resend_id?: string | null
          status?: string | null
          subject?: string
          template_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      email_settings: {
        Row: {
          clinic_id: string | null
          created_at: string | null
          email_signature: string | null
          from_name: string | null
          id: string
          reminder_enabled: boolean | null
          reminder_hours_before: number | null
          reply_to_email: string | null
          send_appointment_cancelled: boolean | null
          send_appointment_confirmation: boolean | null
          send_appointment_reminder: boolean | null
          send_budget_created: boolean | null
          send_payment_receipt: boolean | null
          send_welcome_email: boolean | null
          updated_at: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string | null
          email_signature?: string | null
          from_name?: string | null
          id?: string
          reminder_enabled?: boolean | null
          reminder_hours_before?: number | null
          reply_to_email?: string | null
          send_appointment_cancelled?: boolean | null
          send_appointment_confirmation?: boolean | null
          send_appointment_reminder?: boolean | null
          send_budget_created?: boolean | null
          send_payment_receipt?: boolean | null
          send_welcome_email?: boolean | null
          updated_at?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string | null
          email_signature?: string | null
          from_name?: string | null
          id?: string
          reminder_enabled?: boolean | null
          reminder_hours_before?: number | null
          reply_to_email?: string | null
          send_appointment_cancelled?: boolean | null
          send_appointment_confirmation?: boolean | null
          send_appointment_reminder?: boolean | null
          send_budget_created?: boolean | null
          send_payment_receipt?: boolean | null
          send_welcome_email?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_settings_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      odontograms: {
        Row: {
          condition: Database["public"]["Enums"]["tooth_condition"] | null
          created_at: string
          id: string
          notes: string | null
          patient_id: string
          surfaces: string[] | null
          tooth_number: number
          treatment_date: string | null
          updated_at: string
        }
        Insert: {
          condition?: Database["public"]["Enums"]["tooth_condition"] | null
          created_at?: string
          id?: string
          notes?: string | null
          patient_id: string
          surfaces?: string[] | null
          tooth_number: number
          treatment_date?: string | null
          updated_at?: string
        }
        Update: {
          condition?: Database["public"]["Enums"]["tooth_condition"] | null
          created_at?: string
          id?: string
          notes?: string | null
          patient_id?: string
          surfaces?: string[] | null
          tooth_number?: number
          treatment_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "odontograms_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          allergies: string[] | null
          avatar_url: string | null
          birth_date: string | null
          city: string | null
          clinic_id: string
          created_at: string
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string
          gender: string | null
          id: string
          last_name: string
          medical_notes: string | null
          medications: string[] | null
          phone: string | null
          postal_code: string | null
          state: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          allergies?: string[] | null
          avatar_url?: string | null
          birth_date?: string | null
          city?: string | null
          clinic_id: string
          created_at?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name: string
          gender?: string | null
          id?: string
          last_name: string
          medical_notes?: string | null
          medications?: string[] | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          allergies?: string[] | null
          avatar_url?: string | null
          birth_date?: string | null
          city?: string | null
          clinic_id?: string
          created_at?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string
          gender?: string | null
          id?: string
          last_name?: string
          medical_notes?: string | null
          medications?: string[] | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_config: {
        Row: {
          clinic_id: string
          created_at: string | null
          default_currency: string | null
          id: string
          mp_access_token: string | null
          mp_country: string | null
          mp_enabled: boolean | null
          mp_public_key: string | null
          stripe_enabled: boolean | null
          stripe_mode: string | null
          stripe_publishable_key: string | null
          stripe_secret_key: string | null
          stripe_webhook_secret: string | null
          updated_at: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string | null
          default_currency?: string | null
          id?: string
          mp_access_token?: string | null
          mp_country?: string | null
          mp_enabled?: boolean | null
          mp_public_key?: string | null
          stripe_enabled?: boolean | null
          stripe_mode?: string | null
          stripe_publishable_key?: string | null
          stripe_secret_key?: string | null
          stripe_webhook_secret?: string | null
          updated_at?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string | null
          default_currency?: string | null
          id?: string
          mp_access_token?: string | null
          mp_country?: string | null
          mp_enabled?: boolean | null
          mp_public_key?: string | null
          stripe_enabled?: boolean | null
          stripe_mode?: string | null
          stripe_publishable_key?: string | null
          stripe_secret_key?: string | null
          stripe_webhook_secret?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_config_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          budget_id: string | null
          clinic_id: string
          created_at: string
          id: string
          notes: string | null
          patient_id: string
          payment_date: string | null
          payment_method: string | null
        }
        Insert: {
          amount: number
          budget_id?: string | null
          clinic_id: string
          created_at?: string
          id?: string
          notes?: string | null
          patient_id: string
          payment_date?: string | null
          payment_method?: string | null
        }
        Update: {
          amount?: number
          budget_id?: string | null
          clinic_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          patient_id?: string
          payment_date?: string | null
          payment_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_schedules: {
        Row: {
          clinic_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_working_day: boolean
          profile_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          day_of_week: number
          end_time?: string
          id?: string
          is_working_day?: boolean
          profile_id: string
          start_time?: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_working_day?: boolean
          profile_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_schedules_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_schedules_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          clinic_id: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          license_number: string | null
          phone: string | null
          specialty: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          clinic_id?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          license_number?: string | null
          phone?: string | null
          specialty?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          clinic_id?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          license_number?: string | null
          phone?: string | null
          specialty?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      treatments: {
        Row: {
          category: string | null
          clinic_id: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          category?: string | null
          clinic_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          category?: string | null
          clinic_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          clinic_id: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          clinic_id?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          clinic_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_config: {
        Row: {
          access_token: string | null
          business_account_id: string | null
          clinic_id: string
          created_at: string | null
          id: string
          is_connected: boolean | null
          last_verified_at: string | null
          phone_number_id: string | null
          updated_at: string | null
          verify_token: string | null
        }
        Insert: {
          access_token?: string | null
          business_account_id?: string | null
          clinic_id: string
          created_at?: string | null
          id?: string
          is_connected?: boolean | null
          last_verified_at?: string | null
          phone_number_id?: string | null
          updated_at?: string | null
          verify_token?: string | null
        }
        Update: {
          access_token?: string | null
          business_account_id?: string | null
          clinic_id?: string
          created_at?: string | null
          id?: string
          is_connected?: boolean | null
          last_verified_at?: string | null
          phone_number_id?: string | null
          updated_at?: string | null
          verify_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_config_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_patients_limited: {
        Args: never
        Returns: {
          address: string
          avatar_url: string
          birth_date: string
          city: string
          clinic_id: string
          created_at: string
          email: string
          first_name: string
          gender: string
          id: string
          last_name: string
          phone: string
          postal_code: string
          state: string
          updated_at: string
          whatsapp: string
        }[]
      }
      get_payment_config_safe: {
        Args: { p_clinic_id: string }
        Returns: {
          default_currency: string
          has_mp_access_token: boolean
          has_stripe_secret: boolean
          has_webhook_secret: boolean
          id: string
          mp_access_token_hint: string
          mp_country: string
          mp_enabled: boolean
          mp_public_key: string
          stripe_enabled: boolean
          stripe_mode: string
          stripe_publishable_key: string
          stripe_secret_key_hint: string
          stripe_webhook_secret_hint: string
        }[]
      }
      get_secret_hint: { Args: { secret: string }; Returns: string }
      get_user_clinic_id: { Args: { _user_id: string }; Returns: string }
      get_whatsapp_config_safe: {
        Args: { p_clinic_id: string }
        Returns: {
          access_token_hint: string
          business_account_id: string
          has_access_token: boolean
          id: string
          is_connected: boolean
          last_verified_at: string
          phone_number_id: string
          verify_token: string
        }[]
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
      app_role: "admin" | "dentist" | "assistant" | "receptionist"
      appointment_status:
        | "scheduled"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_show"
      payment_status: "pending" | "partial" | "paid" | "refunded"
      tooth_condition:
        | "healthy"
        | "cavity"
        | "filling"
        | "crown"
        | "extraction"
        | "implant"
        | "root_canal"
        | "bridge"
        | "veneer"
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
      app_role: ["admin", "dentist", "assistant", "receptionist"],
      appointment_status: [
        "scheduled",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
      ],
      payment_status: ["pending", "partial", "paid", "refunded"],
      tooth_condition: [
        "healthy",
        "cavity",
        "filling",
        "crown",
        "extraction",
        "implant",
        "root_canal",
        "bridge",
        "veneer",
      ],
    },
  },
} as const
