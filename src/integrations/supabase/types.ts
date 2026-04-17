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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
          org_id: string | null
          payload: Json | null
        }
        Insert: {
          action: string
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          org_id?: string | null
          payload?: Json | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          org_id?: string | null
          payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_followups: {
        Row: {
          completed_at: string | null
          created_at: string
          customer_id: string
          due_date: string
          id: string
          notes: string | null
          org_id: string | null
          status: string
          subject: string
          type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          customer_id: string
          due_date: string
          id?: string
          notes?: string | null
          org_id?: string | null
          status?: string
          subject: string
          type?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          customer_id?: string
          due_date?: string
          id?: string
          notes?: string | null
          org_id?: string | null
          status?: string
          subject?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_followups_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_followups_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          company_name: string
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          notes: string | null
          org_id: string | null
          phone: string | null
          segment: string
          status: string
          total_orders: number | null
          total_revenue: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          company_name: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          notes?: string | null
          org_id?: string | null
          phone?: string | null
          segment?: string
          status?: string
          total_orders?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          company_name?: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          notes?: string | null
          org_id?: string | null
          phone?: string | null
          segment?: string
          status?: string
          total_orders?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_requests: {
        Row: {
          admin_notes: string | null
          business_name: string
          company_size: string | null
          contact_name: string
          created_at: string
          email: string
          id: string
          message: string | null
          phone: string | null
          source: string | null
          status: Database["public"]["Enums"]["demo_status"]
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          business_name: string
          company_size?: string | null
          contact_name: string
          created_at?: string
          email: string
          id?: string
          message?: string | null
          phone?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["demo_status"]
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          business_name?: string
          company_size?: string | null
          contact_name?: string
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          phone?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["demo_status"]
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          customer: string | null
          data: Json
          external_id: string | null
          id: string
          markdown: string | null
          org_id: string | null
          status: string | null
          total: number | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          customer?: string | null
          data?: Json
          external_id?: string | null
          id?: string
          markdown?: string | null
          org_id?: string | null
          status?: string | null
          total?: number | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          customer?: string | null
          data?: Json
          external_id?: string | null
          id?: string
          markdown?: string | null
          org_id?: string | null
          status?: string | null
          total?: number | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string
          department: string
          email: string | null
          id: string
          join_date: string
          name: string
          org_id: string | null
          phone: string | null
          role: string
          salary: number
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          department?: string
          email?: string | null
          id?: string
          join_date?: string
          name: string
          org_id?: string | null
          phone?: string | null
          role?: string
          salary?: number
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          department?: string
          email?: string | null
          id?: string
          join_date?: string
          name?: string
          org_id?: string | null
          phone?: string | null
          role?: string
          salary?: number
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string | null
          id: string
          org_id: string | null
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string
          date: string
          description?: string | null
          id?: string
          org_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          org_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice: {
        Row: {
          additional_charges: number | null
          advance_paid: number | null
          batch_id: string | null
          created_at: string | null
          customer_address: string | null
          customer_gstin: string | null
          customer_name: string | null
          delivery_challan: string | null
          delivery_date: string | null
          discount: number | null
          formulation_id: string | null
          hsn_code: number | null
          id: number
          inspection_id: string | null
          invoice_request_id: string | null
          material_cost: number | null
          order_id: string | null
          org_id: string | null
          packaging_cost: number | null
          payment_terms: string | null
          po_number: string | null
          product_description: string | null
          product_type: string | null
          production_cost: number | null
          quality_cost: number | null
          quality_decision: string | null
          quantity_delivered: number | null
          quantity_ordered: number | null
          quote_id: string | null
          subtotal: number | null
          transport_details: string | null
        }
        Insert: {
          additional_charges?: number | null
          advance_paid?: number | null
          batch_id?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_gstin?: string | null
          customer_name?: string | null
          delivery_challan?: string | null
          delivery_date?: string | null
          discount?: number | null
          formulation_id?: string | null
          hsn_code?: number | null
          id?: number
          inspection_id?: string | null
          invoice_request_id?: string | null
          material_cost?: number | null
          order_id?: string | null
          org_id?: string | null
          packaging_cost?: number | null
          payment_terms?: string | null
          po_number?: string | null
          product_description?: string | null
          product_type?: string | null
          production_cost?: number | null
          quality_cost?: number | null
          quality_decision?: string | null
          quantity_delivered?: number | null
          quantity_ordered?: number | null
          quote_id?: string | null
          subtotal?: number | null
          transport_details?: string | null
        }
        Update: {
          additional_charges?: number | null
          advance_paid?: number | null
          batch_id?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_gstin?: string | null
          customer_name?: string | null
          delivery_challan?: string | null
          delivery_date?: string | null
          discount?: number | null
          formulation_id?: string | null
          hsn_code?: number | null
          id?: number
          inspection_id?: string | null
          invoice_request_id?: string | null
          material_cost?: number | null
          order_id?: string | null
          org_id?: string | null
          packaging_cost?: number | null
          payment_terms?: string | null
          po_number?: string | null
          product_description?: string | null
          product_type?: string | null
          production_cost?: number | null
          quality_cost?: number | null
          quality_decision?: string | null
          quantity_delivered?: number | null
          quantity_ordered?: number | null
          quote_id?: string | null
          subtotal?: number | null
          transport_details?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoiceresult: {
        Row: {
          adjustments: number | null
          advance_paid: number | null
          balance_due: number | null
          cgst: number | null
          created_at: string | null
          customer_gstin: string | null
          customer_name: string | null
          delivery_challan: string | null
          delivery_date: string | null
          due_date: string | null
          grand_total: number | null
          id: number
          igst: number | null
          invoice_date: string | null
          invoice_number: string | null
          order_id: string | null
          org_id: string | null
          payment_terms: string | null
          po_number: string | null
          product: string | null
          quantity: number | null
          request_id: string | null
          sgst: number | null
          subtotal: number | null
          tax_type: string | null
          taxable_amount: number | null
          total_tax: number | null
        }
        Insert: {
          adjustments?: number | null
          advance_paid?: number | null
          balance_due?: number | null
          cgst?: number | null
          created_at?: string | null
          customer_gstin?: string | null
          customer_name?: string | null
          delivery_challan?: string | null
          delivery_date?: string | null
          due_date?: string | null
          grand_total?: number | null
          id?: number
          igst?: number | null
          invoice_date?: string | null
          invoice_number?: string | null
          order_id?: string | null
          org_id?: string | null
          payment_terms?: string | null
          po_number?: string | null
          product?: string | null
          quantity?: number | null
          request_id?: string | null
          sgst?: number | null
          subtotal?: number | null
          tax_type?: string | null
          taxable_amount?: number | null
          total_tax?: number | null
        }
        Update: {
          adjustments?: number | null
          advance_paid?: number | null
          balance_due?: number | null
          cgst?: number | null
          created_at?: string | null
          customer_gstin?: string | null
          customer_name?: string | null
          delivery_challan?: string | null
          delivery_date?: string | null
          due_date?: string | null
          grand_total?: number | null
          id?: number
          igst?: number | null
          invoice_date?: string | null
          invoice_number?: string | null
          order_id?: string | null
          org_id?: string | null
          payment_terms?: string | null
          po_number?: string | null
          product?: string | null
          quantity?: number | null
          request_id?: string | null
          sgst?: number | null
          subtotal?: number | null
          tax_type?: string | null
          taxable_amount?: number | null
          total_tax?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoiceresult_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          max_users: number
          name: string
          notes: string | null
          plan: string
          slug: string
          status: Database["public"]["Enums"]["org_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_users?: number
          name: string
          notes?: string | null
          plan?: string
          slug: string
          status?: Database["public"]["Enums"]["org_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          max_users?: number
          name?: string
          notes?: string | null
          plan?: string
          slug?: string
          status?: Database["public"]["Enums"]["org_status"]
          updated_at?: string
        }
        Relationships: []
      }
      production: {
        Row: {
          created_at: string | null
          customer: string | null
          due_date: string | null
          id: number
          notes: string | null
          order_id: string | null
          org_id: string | null
          priority: string | null
          product_type: string | null
          quantity: number | null
        }
        Insert: {
          created_at?: string | null
          customer?: string | null
          due_date?: string | null
          id?: number
          notes?: string | null
          order_id?: string | null
          org_id?: string | null
          priority?: string | null
          product_type?: string | null
          quantity?: number | null
        }
        Update: {
          created_at?: string | null
          customer?: string | null
          due_date?: string | null
          id?: number
          notes?: string | null
          order_id?: string | null
          org_id?: string | null
          priority?: string | null
          product_type?: string | null
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "production_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      productionbackup: {
        Row: {
          created_at: string | null
          customer: string | null
          due_date: string | null
          id: number
          notes: string | null
          order_id: string | null
          priority: string | null
          product_type: string | null
          quantity: number | null
        }
        Insert: {
          created_at?: string | null
          customer?: string | null
          due_date?: string | null
          id?: number
          notes?: string | null
          order_id?: string | null
          priority?: string | null
          product_type?: string | null
          quantity?: number | null
        }
        Update: {
          created_at?: string | null
          customer?: string | null
          due_date?: string | null
          id?: number
          notes?: string | null
          order_id?: string | null
          priority?: string | null
          product_type?: string | null
          quantity?: number | null
        }
        Relationships: []
      }
      productionresult: {
        Row: {
          created_at: string | null
          decision: string | null
          end_time: string | null
          id: number
          machine: string | null
          order_id: string | null
          org_id: string | null
          reason: string | null
          risk_score: number | null
          start_time: string | null
        }
        Insert: {
          created_at?: string | null
          decision?: string | null
          end_time?: string | null
          id?: number
          machine?: string | null
          order_id?: string | null
          org_id?: string | null
          reason?: string | null
          risk_score?: number | null
          start_time?: string | null
        }
        Update: {
          created_at?: string | null
          decision?: string | null
          end_time?: string | null
          id?: number
          machine?: string | null
          order_id?: string | null
          org_id?: string | null
          reason?: string | null
          risk_score?: number | null
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "productionresult_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      productionresultbackup: {
        Row: {
          created_at: string | null
          decision: string | null
          end_time: string | null
          id: number
          machine: string | null
          order_id: string | null
          reason: string | null
          risk_score: number | null
          start_time: string | null
        }
        Insert: {
          created_at?: string | null
          decision?: string | null
          end_time?: string | null
          id?: number
          machine?: string | null
          order_id?: string | null
          reason?: string | null
          risk_score?: number | null
          start_time?: string | null
        }
        Update: {
          created_at?: string | null
          decision?: string | null
          end_time?: string | null
          id?: number
          machine?: string | null
          order_id?: string | null
          reason?: string | null
          risk_score?: number | null
          start_time?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          org_id: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          org_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          org_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      quality: {
        Row: {
          batch_id: string | null
          created_at: string | null
          defects_found: string | null
          id: number
          inspection_standard: string | null
          measurements: string | null
          org_id: string | null
          product_type: string | null
          quantity: number | null
          special_requirements: string | null
          visual_inspection: string | null
        }
        Insert: {
          batch_id?: string | null
          created_at?: string | null
          defects_found?: string | null
          id?: number
          inspection_standard?: string | null
          measurements?: string | null
          org_id?: string | null
          product_type?: string | null
          quantity?: number | null
          special_requirements?: string | null
          visual_inspection?: string | null
        }
        Update: {
          batch_id?: string | null
          created_at?: string | null
          defects_found?: string | null
          id?: number
          inspection_standard?: string | null
          measurements?: string | null
          org_id?: string | null
          product_type?: string | null
          quantity?: number | null
          special_requirements?: string | null
          visual_inspection?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quality_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      qualitybackup: {
        Row: {
          batch_id: string | null
          created_at: string | null
          defects_found: string | null
          id: number
          inspection_standard: string | null
          measurements: string | null
          product_type: string | null
          quantity: number | null
          special_requirements: string | null
          visual_inspection: string | null
        }
        Insert: {
          batch_id?: string | null
          created_at?: string | null
          defects_found?: string | null
          id?: number
          inspection_standard?: string | null
          measurements?: string | null
          product_type?: string | null
          quantity?: number | null
          special_requirements?: string | null
          visual_inspection?: string | null
        }
        Update: {
          batch_id?: string | null
          created_at?: string | null
          defects_found?: string | null
          id?: number
          inspection_standard?: string | null
          measurements?: string | null
          product_type?: string | null
          quantity?: number | null
          special_requirements?: string | null
          visual_inspection?: string | null
        }
        Relationships: []
      }
      qualityresult: {
        Row: {
          batch_id: string | null
          confidence: number | null
          created_at: string | null
          critical: number | null
          decision: string | null
          defect_rate: number | null
          id: number
          inspection_id: string | null
          major: number | null
          minor: number | null
          org_id: string | null
          product_type: string | null
          quantity: number | null
          recommendation: string | null
          risk_level: string | null
          severity_level: string | null
          total_defects: number | null
        }
        Insert: {
          batch_id?: string | null
          confidence?: number | null
          created_at?: string | null
          critical?: number | null
          decision?: string | null
          defect_rate?: number | null
          id?: number
          inspection_id?: string | null
          major?: number | null
          minor?: number | null
          org_id?: string | null
          product_type?: string | null
          quantity?: number | null
          recommendation?: string | null
          risk_level?: string | null
          severity_level?: string | null
          total_defects?: number | null
        }
        Update: {
          batch_id?: string | null
          confidence?: number | null
          created_at?: string | null
          critical?: number | null
          decision?: string | null
          defect_rate?: number | null
          id?: number
          inspection_id?: string | null
          major?: number | null
          minor?: number | null
          org_id?: string | null
          product_type?: string | null
          quantity?: number | null
          recommendation?: string | null
          risk_level?: string | null
          severity_level?: string | null
          total_defects?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "qualityresult_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation: {
        Row: {
          application: string | null
          compliance: string | null
          created_at: string | null
          customer: string | null
          delivery_required: string | null
          id: number
          inspection_standard: string | null
          machine: string | null
          material_cost_kg: number | null
          material_formulation: string | null
          org_id: string | null
          priority: string | null
          product_type: string | null
          production_rate: number | null
          quality_level: string | null
          quality_standard: string | null
          quantity: number | null
          quote_request_id: string | null
          risk_level: string | null
          setup_time_hours: number | null
          special_requirements: string | null
          ul94_rating: string | null
          weight_per_unit_kg: number | null
        }
        Insert: {
          application?: string | null
          compliance?: string | null
          created_at?: string | null
          customer?: string | null
          delivery_required?: string | null
          id?: number
          inspection_standard?: string | null
          machine?: string | null
          material_cost_kg?: number | null
          material_formulation?: string | null
          org_id?: string | null
          priority?: string | null
          product_type?: string | null
          production_rate?: number | null
          quality_level?: string | null
          quality_standard?: string | null
          quantity?: number | null
          quote_request_id?: string | null
          risk_level?: string | null
          setup_time_hours?: number | null
          special_requirements?: string | null
          ul94_rating?: string | null
          weight_per_unit_kg?: number | null
        }
        Update: {
          application?: string | null
          compliance?: string | null
          created_at?: string | null
          customer?: string | null
          delivery_required?: string | null
          id?: number
          inspection_standard?: string | null
          machine?: string | null
          material_cost_kg?: number | null
          material_formulation?: string | null
          org_id?: string | null
          priority?: string | null
          product_type?: string | null
          production_rate?: number | null
          quality_level?: string | null
          quality_standard?: string | null
          quantity?: number | null
          quote_request_id?: string | null
          risk_level?: string | null
          setup_time_hours?: number | null
          special_requirements?: string | null
          ul94_rating?: string | null
          weight_per_unit_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quotation_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotationbackup: {
        Row: {
          application: string | null
          compliance: string | null
          created_at: string | null
          customer: string | null
          delivery_required: string | null
          id: number
          inspection_standard: string | null
          machine: string | null
          material_cost_kg: number | null
          material_formulation: string | null
          priority: string | null
          product_type: string | null
          production_rate: number | null
          quality_level: string | null
          quality_standard: string | null
          quantity: number | null
          quote_request_id: string | null
          risk_level: string | null
          setup_time_hours: number | null
          special_requirements: string | null
          ul94_rating: string | null
          weight_per_unit_kg: number | null
        }
        Insert: {
          application?: string | null
          compliance?: string | null
          created_at?: string | null
          customer?: string | null
          delivery_required?: string | null
          id?: number
          inspection_standard?: string | null
          machine?: string | null
          material_cost_kg?: number | null
          material_formulation?: string | null
          priority?: string | null
          product_type?: string | null
          production_rate?: number | null
          quality_level?: string | null
          quality_standard?: string | null
          quantity?: number | null
          quote_request_id?: string | null
          risk_level?: string | null
          setup_time_hours?: number | null
          special_requirements?: string | null
          ul94_rating?: string | null
          weight_per_unit_kg?: number | null
        }
        Update: {
          application?: string | null
          compliance?: string | null
          created_at?: string | null
          customer?: string | null
          delivery_required?: string | null
          id?: number
          inspection_standard?: string | null
          machine?: string | null
          material_cost_kg?: number | null
          material_formulation?: string | null
          priority?: string | null
          product_type?: string | null
          production_rate?: number | null
          quality_level?: string | null
          quality_standard?: string | null
          quantity?: number | null
          quote_request_id?: string | null
          risk_level?: string | null
          setup_time_hours?: number | null
          special_requirements?: string | null
          ul94_rating?: string | null
          weight_per_unit_kg?: number | null
        }
        Relationships: []
      }
      quotationresult: {
        Row: {
          created_at: string | null
          customer: string | null
          grand_total: number | null
          gst: number | null
          id: number
          lead_time_days: number | null
          material_cost: number | null
          org_id: string | null
          payment_terms: string | null
          product: string | null
          production_cost: number | null
          profit_amount: number | null
          profit_margin: number | null
          quality_cost: number | null
          quantity: number | null
          quote_id: string | null
          request_id: string | null
          risk_premium: number | null
          subtotal: number | null
          total_before_tax: number | null
          unit_price: number | null
          valid_until: string | null
        }
        Insert: {
          created_at?: string | null
          customer?: string | null
          grand_total?: number | null
          gst?: number | null
          id?: number
          lead_time_days?: number | null
          material_cost?: number | null
          org_id?: string | null
          payment_terms?: string | null
          product?: string | null
          production_cost?: number | null
          profit_amount?: number | null
          profit_margin?: number | null
          quality_cost?: number | null
          quantity?: number | null
          quote_id?: string | null
          request_id?: string | null
          risk_premium?: number | null
          subtotal?: number | null
          total_before_tax?: number | null
          unit_price?: number | null
          valid_until?: string | null
        }
        Update: {
          created_at?: string | null
          customer?: string | null
          grand_total?: number | null
          gst?: number | null
          id?: number
          lead_time_days?: number | null
          material_cost?: number | null
          org_id?: string | null
          payment_terms?: string | null
          product?: string | null
          production_cost?: number | null
          profit_amount?: number | null
          profit_margin?: number | null
          quality_cost?: number | null
          quantity?: number | null
          quote_id?: string | null
          request_id?: string | null
          risk_premium?: number | null
          subtotal?: number | null
          total_before_tax?: number | null
          unit_price?: number | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotationresult_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rnd: {
        Row: {
          application: string | null
          chemical_resistance: string | null
          constraints: string | null
          cost_target_kg: number | null
          created_at: string | null
          id: number
          org_id: string | null
          request_id: string | null
          special_notes: string | null
          standards: string | null
          tensile_min_mpa: number | null
        }
        Insert: {
          application?: string | null
          chemical_resistance?: string | null
          constraints?: string | null
          cost_target_kg?: number | null
          created_at?: string | null
          id?: number
          org_id?: string | null
          request_id?: string | null
          special_notes?: string | null
          standards?: string | null
          tensile_min_mpa?: number | null
        }
        Update: {
          application?: string | null
          chemical_resistance?: string | null
          constraints?: string | null
          cost_target_kg?: number | null
          created_at?: string | null
          id?: number
          org_id?: string | null
          request_id?: string | null
          special_notes?: string | null
          standards?: string | null
          tensile_min_mpa?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rnd_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rndbackup: {
        Row: {
          application: string | null
          chemical_resistance: string | null
          constraints: string | null
          cost_target_kg: number | null
          created_at: string | null
          id: number
          request_id: string | null
          special_notes: string | null
          standards: string | null
          tensile_min_mpa: number | null
        }
        Insert: {
          application?: string | null
          chemical_resistance?: string | null
          constraints?: string | null
          cost_target_kg?: number | null
          created_at?: string | null
          id?: number
          request_id?: string | null
          special_notes?: string | null
          standards?: string | null
          tensile_min_mpa?: number | null
        }
        Update: {
          application?: string | null
          chemical_resistance?: string | null
          constraints?: string | null
          cost_target_kg?: number | null
          created_at?: string | null
          id?: number
          request_id?: string | null
          special_notes?: string | null
          standards?: string | null
          tensile_min_mpa?: number | null
        }
        Relationships: []
      }
      rndresult: {
        Row: {
          ai_confidence: string | null
          base_polymer: string | null
          cost_kg: number | null
          created_at: string | null
          formulation_id: string | null
          id: number
          key_additives: string | null
          loi: number | null
          org_id: string | null
          reach: string | null
          recommendation: string | null
          request_id: string | null
          rohs: string | null
          tensile_mpa: number | null
          ul94_rating: string | null
        }
        Insert: {
          ai_confidence?: string | null
          base_polymer?: string | null
          cost_kg?: number | null
          created_at?: string | null
          formulation_id?: string | null
          id?: number
          key_additives?: string | null
          loi?: number | null
          org_id?: string | null
          reach?: string | null
          recommendation?: string | null
          request_id?: string | null
          rohs?: string | null
          tensile_mpa?: number | null
          ul94_rating?: string | null
        }
        Update: {
          ai_confidence?: string | null
          base_polymer?: string | null
          cost_kg?: number | null
          created_at?: string | null
          formulation_id?: string | null
          id?: number
          key_additives?: string | null
          loi?: number | null
          org_id?: string | null
          reach?: string | null
          recommendation?: string | null
          request_id?: string | null
          rohs?: string | null
          tensile_mpa?: number | null
          ul94_rating?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rndresult_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_records: {
        Row: {
          base_salary: number
          bonus: number
          created_at: string
          deductions: number
          employee_id: string
          id: string
          month: string
          net_pay: number
          org_id: string | null
          paid_at: string | null
          payment_method: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          base_salary?: number
          bonus?: number
          created_at?: string
          deductions?: number
          employee_id: string
          id?: string
          month: string
          net_pay?: number
          org_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          base_salary?: number
          bonus?: number
          created_at?: string
          deductions?: number
          employee_id?: string
          id?: string
          month?: string
          net_pay?: number
          org_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salary_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_records_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          created_at: string
          employee_id: string
          end_time: string
          id: string
          org_id: string | null
          shift_date: string
          shift_type: string
          start_time: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          employee_id: string
          end_time: string
          id?: string
          org_id?: string | null
          shift_date: string
          shift_type?: string
          start_time: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          employee_id?: string
          end_time?: string
          id?: string
          org_id?: string | null
          shift_date?: string
          shift_type?: string
          start_time?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shifts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      [_ in never]: never
    }
    Functions: {
      get_user_org: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "org_admin" | "org_user"
      demo_status: "new" | "contacted" | "qualified" | "closed"
      org_status: "active" | "suspended" | "trial"
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
      app_role: ["super_admin", "org_admin", "org_user"],
      demo_status: ["new", "contacted", "qualified", "closed"],
      org_status: ["active", "suspended", "trial"],
    },
  },
} as const
