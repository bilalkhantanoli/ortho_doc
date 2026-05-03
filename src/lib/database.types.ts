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
      analysis_runs: {
        Row: {
          case_id: string;
          completed_at: string | null;
          created_at: string;
          failure_reason: string | null;
          id: string;
          metrics: Json | null;
          model_name: string | null;
          notes: string | null;
          provider: string | null;
          raw_response: Json | null;
          recommended_brace_option_id: string | null;
          requested_by: string;
          status: string;
          summary: string | null;
          updated_at: string;
        };
        Insert: {
          case_id: string;
          completed_at?: string | null;
          created_at?: string;
          failure_reason?: string | null;
          id?: string;
          metrics?: Json | null;
          model_name?: string | null;
          notes?: string | null;
          provider?: string | null;
          raw_response?: Json | null;
          recommended_brace_option_id?: string | null;
          requested_by: string;
          status?: string;
          summary?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["analysis_runs"]["Insert"]>;
        Relationships: [];
      };
      appointments: {
        Row: {
          appointment_type: string;
          created_at: string;
          created_by: string;
          doctor_id: string;
          duration_minutes: number;
          id: string;
          notes: string | null;
          patient_id: string;
          scheduled_at: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          appointment_type: string;
          created_at?: string;
          created_by: string;
          doctor_id: string;
          duration_minutes?: number;
          id?: string;
          notes?: string | null;
          patient_id: string;
          scheduled_at: string;
          status?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["appointments"]["Insert"]>;
        Relationships: [];
      };
      brace_options: {
        Row: {
          code: string;
          created_at: string;
          default_color_hex: string | null;
          description: string | null;
          id: string;
          is_active: boolean;
          name: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          default_color_hex?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["brace_options"]["Insert"]>;
        Relationships: [];
      };
      brace_preferences: {
        Row: {
          brace_option_id: string;
          case_id: string;
          color_hex: string;
          created_at: string;
          id: string;
          notes: string | null;
          patient_id: string;
          selected_by: string;
          updated_at: string;
        };
        Insert: {
          brace_option_id: string;
          case_id: string;
          color_hex: string;
          created_at?: string;
          id?: string;
          notes?: string | null;
          patient_id: string;
          selected_by: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["brace_preferences"]["Insert"]>;
        Relationships: [];
      };
      case_records: {
        Row: {
          created_at: string;
          doctor_id: string | null;
          error_message: string | null;
          id: string;
          image_bucket: string;
          image_path: string;
          latest_analysis_id: string | null;
          mime_type: string;
          original_filename: string;
          patient_id: string;
          size_bytes: number;
          status: string;
          title: string;
          updated_at: string;
          uploaded_by: string;
        };
        Insert: {
          created_at?: string;
          doctor_id?: string | null;
          error_message?: string | null;
          id?: string;
          image_bucket?: string;
          image_path: string;
          latest_analysis_id?: string | null;
          mime_type: string;
          original_filename: string;
          patient_id: string;
          size_bytes: number;
          status?: string;
          title: string;
          updated_at?: string;
          uploaded_by: string;
        };
        Update: Partial<Database["public"]["Tables"]["case_records"]["Insert"]>;
        Relationships: [];
      };
      doctor_patient_links: {
        Row: {
          created_at: string;
          doctor_id: string;
          id: string;
          patient_id: string;
          relationship_status: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          doctor_id: string;
          id?: string;
          patient_id: string;
          relationship_status?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["doctor_patient_links"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          age: number | null;
          avatar_path: string | null;
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          phone: string | null;
          role: string;
          updated_at: string;
        };
        Insert: {
          age?: number | null;
          avatar_path?: string | null;
          created_at?: string;
          email: string;
          full_name: string;
          id: string;
          phone?: string | null;
          role: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      case_details: {
        Row: {
          analysis_completed_at: string | null;
          analysis_failure_reason: string | null;
          analysis_id: string | null;
          analysis_metrics: Json | null;
          analysis_notes: string | null;
          analysis_raw_response: Json | null;
          analysis_status: string | null;
          analysis_summary: string | null;
          brace_color_hex: string | null;
          brace_option_code: string | null;
          brace_option_name: string | null;
          case_created_at: string;
          case_id: string;
          case_status: string;
          doctor_id: string | null;
          doctor_name: string | null;
          image_bucket: string;
          image_path: string;
          patient_id: string;
          patient_name: string;
          title: string;
          updated_at: string;
          uploaded_by: string;
        };
      };
    };
    Functions: {
      current_profile_role: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_dashboard_metrics: {
        Args: { target_role: string };
        Returns: Json;
      };
    };
    Enums: {
      appointment_status: "scheduled" | "completed" | "cancelled";
      appointment_type: "consultation" | "follow_up" | "check_up" | "treatment" | "emergency";
      analysis_status: "queued" | "processing" | "completed" | "partial" | "failed" | "rate_limited";
      case_status: "uploading" | "processing" | "analyzed" | "approved" | "failed";
      relationship_status: "active" | "inactive";
      user_role: "doctor" | "patient";
    };
  };
};
