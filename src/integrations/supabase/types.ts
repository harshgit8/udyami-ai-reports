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
          payload: Json | null
        }
        Insert: {
          action: string
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          payload?: Json | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          payload?: Json | null
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
          status?: string | null
          total?: number | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
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
        Relationships: []
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
      quality: {
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
          product_type?: string | null
          quantity?: number | null
          recommendation?: string | null
          risk_level?: string | null
          severity_level?: string | null
          total_defects?: number | null
        }
        Relationships: []
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
        Relationships: []
      }
      rnd: {
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
          reach?: string | null
          recommendation?: string | null
          request_id?: string | null
          rohs?: string | null
          tensile_mpa?: number | null
          ul94_rating?: string | null
        }
        Relationships: []
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
