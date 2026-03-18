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
      accounting_integrations: {
        Row: {
          api_endpoint: string | null
          api_key_encrypted: string | null
          auto_export: boolean
          created_at: string
          export_day: number | null
          export_format: string
          id: string
          is_active: boolean
          last_export_at: string | null
          organization_id: string
          provider: string
          updated_at: string
        }
        Insert: {
          api_endpoint?: string | null
          api_key_encrypted?: string | null
          auto_export?: boolean
          created_at?: string
          export_day?: number | null
          export_format?: string
          id?: string
          is_active?: boolean
          last_export_at?: string | null
          organization_id: string
          provider: string
          updated_at?: string
        }
        Update: {
          api_endpoint?: string | null
          api_key_encrypted?: string | null
          auto_export?: boolean
          created_at?: string
          export_day?: number | null
          export_format?: string
          id?: string
          is_active?: boolean
          last_export_at?: string | null
          organization_id?: string
          provider?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounting_integrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          organization_id: string
          scopes: string[]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          organization_id: string
          scopes?: string[]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          organization_id?: string
          scopes?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          created_at: string
          description: string | null
          entity_id: string
          entity_type: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          organization_id: string
          storage_path: string
          thumbnail_url: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          entity_id: string
          entity_type: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id?: string
          organization_id: string
          storage_path: string
          thumbnail_url?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          entity_id?: string
          entity_type?: string
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          organization_id?: string
          storage_path?: string
          thumbnail_url?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attachments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          city: string | null
          city_ibge_code: string | null
          client_type: string
          complement: string | null
          country_code: string | null
          cpf_cnpj: string
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          ie: string | null
          is_active: boolean
          name: string
          neighborhood: string | null
          notes: string | null
          number: string | null
          organization_id: string
          phone: string | null
          state: string | null
          street: string | null
          trade_name: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          city?: string | null
          city_ibge_code?: string | null
          client_type?: string
          complement?: string | null
          country_code?: string | null
          cpf_cnpj: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          ie?: string | null
          is_active?: boolean
          name: string
          neighborhood?: string | null
          notes?: string | null
          number?: string | null
          organization_id: string
          phone?: string | null
          state?: string | null
          street?: string | null
          trade_name?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          city?: string | null
          city_ibge_code?: string | null
          client_type?: string
          complement?: string | null
          country_code?: string | null
          cpf_cnpj?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          ie?: string | null
          is_active?: boolean
          name?: string
          neighborhood?: string | null
          notes?: string | null
          number?: string | null
          organization_id?: string
          phone?: string | null
          state?: string | null
          street?: string | null
          trade_name?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_usage: {
        Row: {
          coupon_id: string
          id: string
          organization_id: string
          payment_id: string | null
          used_at: string
        }
        Insert: {
          coupon_id: string
          id?: string
          organization_id: string
          payment_id?: string | null
          used_at?: string
        }
        Update: {
          coupon_id?: string
          id?: string
          organization_id?: string
          payment_id?: string | null
          used_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usage_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "discount_coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_coupons: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          current_uses: number
          description: string | null
          discount_percent: number
          id: string
          is_active: boolean
          max_uses: number | null
          updated_at: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          description?: string | null
          discount_percent: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          description?: string | null
          discount_percent?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      driver_salaries: {
        Row: {
          created_at: string | null
          driver_id: string
          effective_date: string | null
          id: string
          notes: string | null
          salary: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          driver_id: string
          effective_date?: string | null
          id?: string
          notes?: string | null
          salary?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          driver_id?: string
          effective_date?: string | null
          id?: string
          notes?: string | null
          salary?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_salaries_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: true
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          cnh_category: string | null
          cnh_expiry: string | null
          cnh_number: string | null
          created_at: string
          emergency_contact: string | null
          emergency_phone: string | null
          hire_date: string | null
          id: string
          notes: string | null
          organization_id: string
          profile_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          cnh_category?: string | null
          cnh_expiry?: string | null
          cnh_number?: string | null
          created_at?: string
          emergency_contact?: string | null
          emergency_phone?: string | null
          hire_date?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          profile_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          cnh_category?: string | null
          cnh_expiry?: string | null
          cnh_number?: string | null
          created_at?: string
          emergency_contact?: string | null
          emergency_phone?: string | null
          hire_date?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          profile_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "drivers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drivers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_verification_codes: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          code?: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      erp_integrations: {
        Row: {
          api_endpoint: string | null
          api_key_encrypted: string | null
          created_at: string
          id: string
          is_active: boolean
          last_sync_at: string | null
          organization_id: string
          provider: string
          sync_expenses: boolean
          sync_fuel: boolean
          sync_trips: boolean
          sync_vehicles: boolean
          updated_at: string
        }
        Insert: {
          api_endpoint?: string | null
          api_key_encrypted?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          organization_id: string
          provider: string
          sync_expenses?: boolean
          sync_fuel?: boolean
          sync_trips?: boolean
          sync_vehicles?: boolean
          updated_at?: string
        }
        Update: {
          api_endpoint?: string | null
          api_key_encrypted?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          organization_id?: string
          provider?: string
          sync_expenses?: boolean
          sync_fuel?: boolean
          sync_trips?: boolean
          sync_vehicles?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_integrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          driver_id: string | null
          due_date: string | null
          expense_date: string
          expense_type: string
          id: string
          invoice_number: string | null
          notes: string | null
          organization_id: string
          paid_at: string | null
          payment_method: string | null
          status: string | null
          supplier: string | null
          trip_id: string | null
          updated_at: string
          value: number
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          driver_id?: string | null
          due_date?: string | null
          expense_date?: string
          expense_type: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          organization_id: string
          paid_at?: string | null
          payment_method?: string | null
          status?: string | null
          supplier?: string | null
          trip_id?: string | null
          updated_at?: string
          value: number
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          driver_id?: string | null
          due_date?: string | null
          expense_date?: string
          expense_type?: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          organization_id?: string
          paid_at?: string | null
          payment_method?: string | null
          status?: string | null
          supplier?: string | null
          trip_id?: string | null
          updated_at?: string
          value?: number
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_records: {
        Row: {
          city: string | null
          created_at: string
          created_by: string | null
          driver_id: string | null
          fuel_date: string
          fuel_type: string | null
          gas_station: string | null
          id: string
          liters: number
          notes: string | null
          odometer: number
          organization_id: string
          payment_method: string | null
          price_per_liter: number
          receipt_number: string | null
          state: string | null
          total_value: number
          trip_id: string | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          created_by?: string | null
          driver_id?: string | null
          fuel_date?: string
          fuel_type?: string | null
          gas_station?: string | null
          id?: string
          liters: number
          notes?: string | null
          odometer: number
          organization_id: string
          payment_method?: string | null
          price_per_liter: number
          receipt_number?: string | null
          state?: string | null
          total_value: number
          trip_id?: string | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          city?: string | null
          created_at?: string
          created_by?: string | null
          driver_id?: string | null
          fuel_date?: string
          fuel_type?: string | null
          gas_station?: string | null
          id?: string
          liters?: number
          notes?: string | null
          odometer?: number
          organization_id?: string
          payment_method?: string | null
          price_per_liter?: number
          receipt_number?: string | null
          state?: string | null
          total_value?: number
          trip_id?: string | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fuel_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_records_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_records_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_records_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          organization_id: string
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_records: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          entry_date: string
          entry_km: number | null
          exit_date: string | null
          exit_km: number | null
          expense_id: string | null
          id: string
          labor_cost: number | null
          maintenance_type: string
          next_maintenance_date: string | null
          next_maintenance_km: number | null
          notes: string | null
          organization_id: string
          parts_cost: number | null
          service_provider: string | null
          status: string | null
          total_cost: number | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          entry_date: string
          entry_km?: number | null
          exit_date?: string | null
          exit_km?: number | null
          expense_id?: string | null
          id?: string
          labor_cost?: number | null
          maintenance_type: string
          next_maintenance_date?: string | null
          next_maintenance_km?: number | null
          notes?: string | null
          organization_id: string
          parts_cost?: number | null
          service_provider?: string | null
          status?: string | null
          total_cost?: number | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          entry_date?: string
          entry_km?: number | null
          exit_date?: string | null
          exit_km?: number | null
          expense_id?: string | null
          id?: string
          labor_cost?: number | null
          maintenance_type?: string
          next_maintenance_date?: string | null
          next_maintenance_km?: number | null
          notes?: string | null
          organization_id?: string
          parts_cost?: number | null
          service_provider?: string | null
          status?: string | null
          total_cost?: number | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          organization_id: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          organization_id: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          organization_id?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_fiscal_data: {
        Row: {
          aliquota_icms: number | null
          cfop_padrao: string | null
          city: string | null
          city_ibge_code: string | null
          complement: string | null
          created_at: string
          crt: number | null
          cst_icms: string | null
          id: string
          ie: string | null
          im: string | null
          neighborhood: string | null
          number: string | null
          organization_id: string
          rntrc: string | null
          state: string | null
          street: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          aliquota_icms?: number | null
          cfop_padrao?: string | null
          city?: string | null
          city_ibge_code?: string | null
          complement?: string | null
          created_at?: string
          crt?: number | null
          cst_icms?: string | null
          id?: string
          ie?: string | null
          im?: string | null
          neighborhood?: string | null
          number?: string | null
          organization_id: string
          rntrc?: string | null
          state?: string | null
          street?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          aliquota_icms?: number | null
          cfop_padrao?: string | null
          city?: string | null
          city_ibge_code?: string | null
          complement?: string | null
          created_at?: string
          crt?: number | null
          cst_icms?: string | null
          id?: string
          ie?: string | null
          im?: string | null
          neighborhood?: string | null
          number?: string | null
          organization_id?: string
          rntrc?: string | null
          state?: string | null
          street?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_fiscal_data_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          organization_id: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          organization_id: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          organization_id?: string
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "organization_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          cnpj: string | null
          created_at: string
          currency: string | null
          duration_months: number | null
          fiscal_period_start: number | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          plan_id: string | null
          slug: string
          subscription_ends_at: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          timezone: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          currency?: string | null
          duration_months?: number | null
          fiscal_period_start?: number | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          plan_id?: string | null
          slug: string
          subscription_ends_at?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          timezone?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          currency?: string | null
          duration_months?: number | null
          fiscal_period_start?: number | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          plan_id?: string | null
          slug?: string
          subscription_ends_at?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          timezone?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_events: {
        Row: {
          amount: number | null
          created_at: string
          id: string
          organization_id: string | null
          payment_id: string
          plan_id: string | null
          processed_at: string
          status: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          id?: string
          organization_id?: string | null
          payment_id: string
          plan_id?: string | null
          processed_at?: string
          status: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          id?: string
          organization_id?: string | null
          payment_id?: string
          plan_id?: string | null
          processed_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_events_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          is_email_verified: boolean
          is_owner: boolean
          organization_id: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          is_email_verified?: boolean
          is_owner?: boolean
          organization_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_email_verified?: boolean
          is_owner?: boolean
          organization_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean
          max_trucks: number | null
          max_users: number | null
          name: string
          price_monthly: number
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean
          max_trucks?: number | null
          max_users?: number | null
          name: string
          price_monthly?: number
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean
          max_trucks?: number | null
          max_users?: number | null
          name?: string
          price_monthly?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          cargo_type: string | null
          client_name: string | null
          created_at: string
          created_by: string | null
          destination: string
          driver_id: string | null
          end_date: string | null
          end_km: number | null
          freight_value: number | null
          id: string
          invoice_number: string | null
          notes: string | null
          organization_id: string
          origin: string
          start_date: string
          start_km: number
          status: string | null
          tonnage: number | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          cargo_type?: string | null
          client_name?: string | null
          created_at?: string
          created_by?: string | null
          destination: string
          driver_id?: string | null
          end_date?: string | null
          end_km?: number | null
          freight_value?: number | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          organization_id: string
          origin: string
          start_date: string
          start_km: number
          status?: string | null
          tonnage?: number | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          cargo_type?: string | null
          client_name?: string | null
          created_at?: string
          created_by?: string | null
          destination?: string
          driver_id?: string | null
          end_date?: string | null
          end_km?: number | null
          freight_value?: number | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          organization_id?: string
          origin?: string
          start_date?: string
          start_km?: number
          status?: string | null
          tonnage?: number | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          acquisition_date: string | null
          acquisition_value: number | null
          brand: string | null
          chassis: string | null
          color: string | null
          created_at: string
          current_hours: number | null
          current_km: number | null
          driver_id: string | null
          fuel_type: string | null
          id: string
          model: string
          notes: string | null
          organization_id: string
          plate: string
          prefix: string
          renavam: string | null
          status: string | null
          tank_capacity: number | null
          updated_at: string
          year: number | null
        }
        Insert: {
          acquisition_date?: string | null
          acquisition_value?: number | null
          brand?: string | null
          chassis?: string | null
          color?: string | null
          created_at?: string
          current_hours?: number | null
          current_km?: number | null
          driver_id?: string | null
          fuel_type?: string | null
          id?: string
          model: string
          notes?: string | null
          organization_id: string
          plate: string
          prefix: string
          renavam?: string | null
          status?: string | null
          tank_capacity?: number | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          acquisition_date?: string | null
          acquisition_value?: number | null
          brand?: string | null
          chassis?: string | null
          color?: string | null
          created_at?: string
          current_hours?: number | null
          current_km?: number | null
          driver_id?: string | null
          fuel_type?: string | null
          id?: string
          model?: string
          notes?: string | null
          organization_id?: string
          plate?: string
          prefix?: string
          renavam?: string | null
          status?: string | null
          tank_capacity?: number | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_configs: {
        Row: {
          created_at: string
          events: string[]
          id: string
          is_active: boolean
          last_triggered_at: string | null
          name: string
          organization_id: string
          secret: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          events?: string[]
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          name: string
          organization_id: string
          secret?: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          events?: string[]
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          name?: string
          organization_id?: string
          secret?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_configs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          delivered_at: string
          event_type: string
          id: string
          organization_id: string
          payload: Json
          response_body: string | null
          response_status: number | null
          success: boolean
          webhook_id: string
        }
        Insert: {
          delivered_at?: string
          event_type: string
          id?: string
          organization_id: string
          payload: Json
          response_body?: string | null
          response_status?: number | null
          success?: boolean
          webhook_id: string
        }
        Update: {
          delivered_at?: string
          event_type?: string
          id?: string
          organization_id?: string
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          success?: boolean
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhook_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhook_configs_safe"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      api_keys_safe: {
        Row: {
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string | null
          is_active: boolean | null
          key_prefix: string | null
          last_used_at: string | null
          name: string | null
          organization_id: string | null
          scopes: string[] | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string | null
          is_active?: boolean | null
          key_prefix?: string | null
          last_used_at?: string | null
          name?: string | null
          organization_id?: string | null
          scopes?: string[] | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string | null
          is_active?: boolean | null
          key_prefix?: string | null
          last_used_at?: string | null
          name?: string | null
          organization_id?: string | null
          scopes?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_configs_safe: {
        Row: {
          created_at: string | null
          events: string[] | null
          id: string | null
          is_active: boolean | null
          last_triggered_at: string | null
          name: string | null
          organization_id: string | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          events?: string[] | null
          id?: string | null
          is_active?: boolean | null
          last_triggered_at?: string | null
          name?: string | null
          organization_id?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          events?: string[] | null
          id?: string | null
          is_active?: boolean | null
          last_triggered_at?: string | null
          name?: string | null
          organization_id?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_configs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_invitation: { Args: { _token: string }; Returns: Json }
      admin_delete_organization: { Args: { _org_id: string }; Returns: Json }
      admin_remove_user: { Args: { _user_id: string }; Returns: Json }
      admin_update_organization: {
        Args: {
          _is_active?: boolean
          _name?: string
          _org_id: string
          _subscription_status?: Database["public"]["Enums"]["subscription_status"]
        }
        Returns: boolean
      }
      check_cnpj_available: { Args: { p_cnpj: string }; Returns: boolean }
      complete_user_signup: {
        Args: {
          _cnpj: string
          _full_name?: string
          _organization_name: string
          _whatsapp: string
        }
        Returns: Json
      }
      get_all_organizations_for_admin: {
        Args: never
        Returns: {
          admin_count: number
          created_at: string
          id: string
          is_active: boolean
          logo_url: string
          name: string
          plan_name: string
          price_monthly: number
          slug: string
          subscription_ends_at: string
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string
          user_count: number
        }[]
      }
      get_all_users_for_admin: {
        Args: never
        Returns: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_owner: boolean
          organization_id: string
          organization_name: string
          phone: string
          role: string
        }[]
      }
      get_organization_for_user: {
        Args: { _org_id?: string }
        Returns: {
          cnpj: string
          created_at: string
          currency: string
          fiscal_period_start: number
          id: string
          is_active: boolean
          logo_url: string
          name: string
          plan_id: string
          slug: string
          subscription_ends_at: string
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          timezone: string
          trial_ends_at: string
          updated_at: string
        }[]
      }
      get_user_organization: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role_in_organization:
        | {
            Args: {
              _organization_id: string
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | {
            Args: { _organization_id: string; _role: string; _user_id: string }
            Returns: boolean
          }
      increment_coupon_usage: {
        Args: { _coupon_id: string }
        Returns: undefined
      }
      is_platform_admin: { Args: { _user_id?: string }; Returns: boolean }
      remove_user_from_organization: {
        Args: { _user_id: string }
        Returns: Json
      }
      toggle_organization_status: {
        Args: { _is_active: boolean; _org_id: string }
        Returns: boolean
      }
      validate_cnpj: { Args: { cnpj: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "manager" | "driver"
      subscription_status:
        | "active"
        | "trialing"
        | "past_due"
        | "canceled"
        | "unpaid"
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
      app_role: ["admin", "manager", "driver"],
      subscription_status: [
        "active",
        "trialing",
        "past_due",
        "canceled",
        "unpaid",
      ],
    },
  },
} as const
