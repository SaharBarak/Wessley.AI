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
      ab_test_participants: {
        Row: {
          ab_test_id: string
          assigned_at: string | null
          conversion_date: string | null
          conversion_value: number | null
          converted: boolean | null
          id: string
          metadata: Json | null
          user_id: string
          variant_assigned: string
        }
        Insert: {
          ab_test_id: string
          assigned_at?: string | null
          conversion_date?: string | null
          conversion_value?: number | null
          converted?: boolean | null
          id?: string
          metadata?: Json | null
          user_id: string
          variant_assigned: string
        }
        Update: {
          ab_test_id?: string
          assigned_at?: string | null
          conversion_date?: string | null
          conversion_value?: number | null
          converted?: boolean | null
          id?: string
          metadata?: Json | null
          user_id?: string
          variant_assigned?: string
        }
        Relationships: [
          {
            foreignKeyName: "ab_test_participants_ab_test_id_fkey"
            columns: ["ab_test_id"]
            isOneToOne: false
            referencedRelation: "ab_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      ab_tests: {
        Row: {
          confidence_level: number | null
          created_at: string | null
          created_by_user_id: string | null
          description: string | null
          end_date: string | null
          id: string
          minimum_sample_size: number | null
          results: Json | null
          start_date: string | null
          status: string | null
          success_criteria: string | null
          target_metric: string
          test_name: string
          traffic_allocation: Json
          updated_at: string | null
          variants: Json
          winning_variant: string | null
        }
        Insert: {
          confidence_level?: number | null
          created_at?: string | null
          created_by_user_id?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          minimum_sample_size?: number | null
          results?: Json | null
          start_date?: string | null
          status?: string | null
          success_criteria?: string | null
          target_metric: string
          test_name: string
          traffic_allocation: Json
          updated_at?: string | null
          variants: Json
          winning_variant?: string | null
        }
        Update: {
          confidence_level?: number | null
          created_at?: string | null
          created_by_user_id?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          minimum_sample_size?: number | null
          results?: Json | null
          start_date?: string | null
          status?: string | null
          success_criteria?: string | null
          target_metric?: string
          test_name?: string
          traffic_allocation?: Json
          updated_at?: string | null
          variants?: Json
          winning_variant?: string | null
        }
        Relationships: []
      }
      analysis_job_queue: {
        Row: {
          assigned_at: string | null
          attempt_count: number | null
          completed_at: string | null
          config: Json | null
          created_at: string | null
          electrical_analysis_id: string
          error_details: Json | null
          id: string
          job_type: string
          max_attempts: number | null
          next_retry_at: string | null
          priority: number | null
          result_data: Json | null
          started_at: string | null
          status: string | null
          updated_at: string | null
          worker_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          attempt_count?: number | null
          completed_at?: string | null
          config?: Json | null
          created_at?: string | null
          electrical_analysis_id: string
          error_details?: Json | null
          id?: string
          job_type: string
          max_attempts?: number | null
          next_retry_at?: string | null
          priority?: number | null
          result_data?: Json | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          worker_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          attempt_count?: number | null
          completed_at?: string | null
          config?: Json | null
          created_at?: string | null
          electrical_analysis_id?: string
          error_details?: Json | null
          id?: string
          job_type?: string
          max_attempts?: number | null
          next_retry_at?: string | null
          priority?: number | null
          result_data?: Json | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_job_queue_electrical_analysis_id_fkey"
            columns: ["electrical_analysis_id"]
            isOneToOne: false
            referencedRelation: "electrical_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_allocations: {
        Row: {
          allocated_amount: number
          budget_id: string
          created_at: string | null
          expense_id: string
          id: string
        }
        Insert: {
          allocated_amount: number
          budget_id: string
          created_at?: string | null
          expense_id: string
          id?: string
        }
        Update: {
          allocated_amount?: number
          budget_id?: string
          created_at?: string | null
          expense_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_allocations_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_allocations_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          alert_enabled: boolean | null
          alert_threshold_percentage: number | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          post_id: string | null
          remaining_amount: number | null
          spent_amount: number | null
          start_date: string | null
          total_amount: number
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          alert_enabled?: boolean | null
          alert_threshold_percentage?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          post_id?: string | null
          remaining_amount?: number | null
          spent_amount?: number | null
          start_date?: string | null
          total_amount: number
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          alert_enabled?: boolean | null
          alert_threshold_percentage?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          post_id?: string | null
          remaining_amount?: number | null
          spent_amount?: number | null
          start_date?: string | null
          total_amount?: number
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "workspace_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      business_intelligence: {
        Row: {
          created_at: string | null
          data: Json
          end_date: string
          generated_at: string | null
          generated_by_user_id: string | null
          generation_time_ms: number | null
          id: string
          report_name: string
          report_type: string
          start_date: string
          status: string | null
          time_period: string | null
        }
        Insert: {
          created_at?: string | null
          data: Json
          end_date: string
          generated_at?: string | null
          generated_by_user_id?: string | null
          generation_time_ms?: number | null
          id?: string
          report_name: string
          report_type: string
          start_date: string
          status?: string | null
          time_period?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json
          end_date?: string
          generated_at?: string | null
          generated_by_user_id?: string | null
          generation_time_ms?: number | null
          id?: string
          report_name?: string
          report_type?: string
          start_date?: string
          status?: string | null
          time_period?: string | null
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          ai_model: string | null
          branch_point_message_id: string | null
          context_data: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_archived: boolean | null
          last_message_at: string | null
          parent_conversation_id: string | null
          post_id: string | null
          system_prompt: string | null
          title: string | null
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          ai_model?: string | null
          branch_point_message_id?: string | null
          context_data?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_archived?: boolean | null
          last_message_at?: string | null
          parent_conversation_id?: string | null
          post_id?: string | null
          system_prompt?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          ai_model?: string | null
          branch_point_message_id?: string | null
          context_data?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_archived?: boolean | null
          last_message_at?: string | null
          parent_conversation_id?: string | null
          post_id?: string | null
          system_prompt?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_parent_conversation_id_fkey"
            columns: ["parent_conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversations_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "workspace_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          ai_confidence_score: number | null
          ai_model: string | null
          ai_processing_time_ms: number | null
          ai_tokens_used: number | null
          attached_media_ids: string[] | null
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
          triggered_expense_creation: boolean | null
          triggered_marketplace_suggestion: boolean | null
          triggered_media_organization: boolean | null
          triggered_neo4j_query: boolean | null
          user_id: string | null
        }
        Insert: {
          ai_confidence_score?: number | null
          ai_model?: string | null
          ai_processing_time_ms?: number | null
          ai_tokens_used?: number | null
          attached_media_ids?: string[] | null
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
          triggered_expense_creation?: boolean | null
          triggered_marketplace_suggestion?: boolean | null
          triggered_media_organization?: boolean | null
          triggered_neo4j_query?: boolean | null
          user_id?: string | null
        }
        Update: {
          ai_confidence_score?: number | null
          ai_model?: string | null
          ai_processing_time_ms?: number | null
          ai_tokens_used?: number | null
          attached_media_ids?: string[] | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
          triggered_expense_creation?: boolean | null
          triggered_marketplace_suggestion?: boolean | null
          triggered_media_organization?: boolean | null
          triggered_neo4j_query?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_payouts: {
        Row: {
          created_at: string | null
          currency: string | null
          external_payout_id: string | null
          id: string
          notes: string | null
          payment_method: string | null
          payout_amount: number
          period_end: string
          period_start: string
          processed_at: string | null
          processed_by_user_id: string | null
          status: string | null
          supplier_id: string
          total_commission: number
          total_transactions: number
          transaction_ids: string[]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          external_payout_id?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          payout_amount: number
          period_end: string
          period_start: string
          processed_at?: string | null
          processed_by_user_id?: string | null
          status?: string | null
          supplier_id: string
          total_commission: number
          total_transactions: number
          transaction_ids: string[]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          external_payout_id?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          payout_amount?: number
          period_end?: string
          period_start?: string
          processed_at?: string | null
          processed_by_user_id?: string | null
          status?: string | null
          supplier_id?: string
          total_commission?: number
          total_transactions?: number
          transaction_ids?: string[]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_payouts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      component_detection_cache: {
        Row: {
          ai_model_used: string
          analysis_version: string | null
          components_detected: Json
          created_at: string | null
          detection_confidence: number
          expires_at: string | null
          hit_count: number | null
          id: string
          image_dimensions: string | null
          image_hash: string
          image_size_bytes: number
          last_accessed_at: string | null
          processing_time_ms: number | null
        }
        Insert: {
          ai_model_used: string
          analysis_version?: string | null
          components_detected: Json
          created_at?: string | null
          detection_confidence: number
          expires_at?: string | null
          hit_count?: number | null
          id?: string
          image_dimensions?: string | null
          image_hash: string
          image_size_bytes: number
          last_accessed_at?: string | null
          processing_time_ms?: number | null
        }
        Update: {
          ai_model_used?: string
          analysis_version?: string | null
          components_detected?: Json
          created_at?: string | null
          detection_confidence?: number
          expires_at?: string | null
          hit_count?: number | null
          id?: string
          image_dimensions?: string | null
          image_hash?: string
          image_size_bytes?: number
          last_accessed_at?: string | null
          processing_time_ms?: number | null
        }
        Relationships: []
      }
      content_moderation: {
        Row: {
          action_taken: string | null
          content_id: string
          content_owner_user_id: string
          content_type: string
          created_at: string | null
          description: string | null
          id: string
          moderated_at: string | null
          moderated_by_user_id: string | null
          moderator_notes: string | null
          reason: string
          reported_by_user_id: string
          status: string | null
        }
        Insert: {
          action_taken?: string | null
          content_id: string
          content_owner_user_id: string
          content_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          moderated_at?: string | null
          moderated_by_user_id?: string | null
          moderator_notes?: string | null
          reason: string
          reported_by_user_id: string
          status?: string | null
        }
        Update: {
          action_taken?: string | null
          content_id?: string
          content_owner_user_id?: string
          content_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          moderated_at?: string | null
          moderated_by_user_id?: string | null
          moderator_notes?: string | null
          reason?: string
          reported_by_user_id?: string
          status?: string | null
        }
        Relationships: []
      }
      electrical_analyses: {
        Row: {
          ai_model_version: string | null
          analysis_prompt_used: string | null
          analysis_status: string | null
          circuits_identified_count: number | null
          completed_at: string | null
          component_visibility_score: number | null
          components_detected_count: number | null
          confidence_score: number | null
          connections_detected_count: number | null
          created_at: string | null
          error_code: string | null
          error_message: string | null
          faults_detected_count: number | null
          id: string
          image_quality_score: number | null
          last_retry_at: string | null
          max_retries: number | null
          media_file_id: string | null
          neo4j_graph_id: string | null
          neo4j_session_id: string | null
          processing_time_ms: number | null
          retry_count: number | null
          source_image_url: string | null
          user_id: string
          vehicle_signature: string
          wire_clarity_score: number | null
          workspace_id: string
        }
        Insert: {
          ai_model_version?: string | null
          analysis_prompt_used?: string | null
          analysis_status?: string | null
          circuits_identified_count?: number | null
          completed_at?: string | null
          component_visibility_score?: number | null
          components_detected_count?: number | null
          confidence_score?: number | null
          connections_detected_count?: number | null
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          faults_detected_count?: number | null
          id?: string
          image_quality_score?: number | null
          last_retry_at?: string | null
          max_retries?: number | null
          media_file_id?: string | null
          neo4j_graph_id?: string | null
          neo4j_session_id?: string | null
          processing_time_ms?: number | null
          retry_count?: number | null
          source_image_url?: string | null
          user_id: string
          vehicle_signature: string
          wire_clarity_score?: number | null
          workspace_id: string
        }
        Update: {
          ai_model_version?: string | null
          analysis_prompt_used?: string | null
          analysis_status?: string | null
          circuits_identified_count?: number | null
          completed_at?: string | null
          component_visibility_score?: number | null
          components_detected_count?: number | null
          confidence_score?: number | null
          connections_detected_count?: number | null
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          faults_detected_count?: number | null
          id?: string
          image_quality_score?: number | null
          last_retry_at?: string | null
          max_retries?: number | null
          media_file_id?: string | null
          neo4j_graph_id?: string | null
          neo4j_session_id?: string | null
          processing_time_ms?: number | null
          retry_count?: number | null
          source_image_url?: string | null
          user_id?: string
          vehicle_signature?: string
          wire_clarity_score?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "electrical_analyses_media_file_id_fkey"
            columns: ["media_file_id"]
            isOneToOne: false
            referencedRelation: "media_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "electrical_analyses_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          created_at: string | null
          endpoint: string | null
          error_code: string | null
          error_message: string
          error_type: string
          id: string
          ip_address: unknown
          method: string | null
          request_data: Json | null
          resolution_notes: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by_user_id: string | null
          response_data: Json | null
          service_name: string | null
          severity: string | null
          stack_trace: string | null
          user_agent: string | null
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint?: string | null
          error_code?: string | null
          error_message: string
          error_type: string
          id?: string
          ip_address?: unknown
          method?: string | null
          request_data?: Json | null
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by_user_id?: string | null
          response_data?: Json | null
          service_name?: string | null
          severity?: string | null
          stack_trace?: string | null
          user_agent?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string | null
          error_code?: string | null
          error_message?: string
          error_type?: string
          id?: string
          ip_address?: unknown
          method?: string | null
          request_data?: Json | null
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by_user_id?: string | null
          response_data?: Json | null
          service_name?: string | null
          severity?: string | null
          stack_trace?: string | null
          user_agent?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "error_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          color_hex: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_system_category: boolean | null
          name: string
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system_category?: boolean | null
          name: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system_category?: boolean | null
          name?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          currency: string | null
          description: string
          discount_amount: number | null
          expense_date: string
          gpt_confidence_score: number | null
          gpt_inferred_fields: Json | null
          id: string
          invoice_number: string | null
          manual_verification_required: boolean | null
          manually_verified: boolean | null
          part_descriptions: string[] | null
          part_numbers: string[] | null
          payment_method: string | null
          post_id: string | null
          quantities: number[] | null
          receipt_media_id: string | null
          receipt_number: string | null
          return_policy: string | null
          shipping_amount: number | null
          status: string | null
          tax_amount: number | null
          unit_prices: number[] | null
          updated_at: string | null
          user_id: string
          vendor_contact: string | null
          vendor_name: string | null
          vendor_website: string | null
          warranty_period_months: number | null
          workspace_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          description: string
          discount_amount?: number | null
          expense_date?: string
          gpt_confidence_score?: number | null
          gpt_inferred_fields?: Json | null
          id?: string
          invoice_number?: string | null
          manual_verification_required?: boolean | null
          manually_verified?: boolean | null
          part_descriptions?: string[] | null
          part_numbers?: string[] | null
          payment_method?: string | null
          post_id?: string | null
          quantities?: number[] | null
          receipt_media_id?: string | null
          receipt_number?: string | null
          return_policy?: string | null
          shipping_amount?: number | null
          status?: string | null
          tax_amount?: number | null
          unit_prices?: number[] | null
          updated_at?: string | null
          user_id: string
          vendor_contact?: string | null
          vendor_name?: string | null
          vendor_website?: string | null
          warranty_period_months?: number | null
          workspace_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string
          discount_amount?: number | null
          expense_date?: string
          gpt_confidence_score?: number | null
          gpt_inferred_fields?: Json | null
          id?: string
          invoice_number?: string | null
          manual_verification_required?: boolean | null
          manually_verified?: boolean | null
          part_descriptions?: string[] | null
          part_numbers?: string[] | null
          payment_method?: string | null
          post_id?: string | null
          quantities?: number[] | null
          receipt_media_id?: string | null
          receipt_number?: string | null
          return_policy?: string | null
          shipping_amount?: number | null
          status?: string | null
          tax_amount?: number | null
          unit_prices?: number[] | null
          updated_at?: string | null
          user_id?: string
          vendor_contact?: string | null
          vendor_name?: string | null
          vendor_website?: string | null
          warranty_period_months?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "workspace_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_receipt_media_id_fkey"
            columns: ["receipt_media_id"]
            isOneToOne: false
            referencedRelation: "media_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      fault_detections: {
        Row: {
          actual_repair_cost: number | null
          component_location: string | null
          component_name: string
          component_type: string | null
          created_at: string | null
          detection_confidence: number | null
          detection_source: string
          estimated_labor_hours: number | null
          estimated_parts_cost: number | null
          estimated_repair_cost: number | null
          fault_description: string
          fault_severity: string | null
          id: string
          recommended_action: string | null
          recommended_parts: string[] | null
          repair_date: string | null
          repair_notes: string | null
          source_reference_id: string | null
          status: string | null
          symptoms: string[] | null
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          actual_repair_cost?: number | null
          component_location?: string | null
          component_name: string
          component_type?: string | null
          created_at?: string | null
          detection_confidence?: number | null
          detection_source: string
          estimated_labor_hours?: number | null
          estimated_parts_cost?: number | null
          estimated_repair_cost?: number | null
          fault_description: string
          fault_severity?: string | null
          id?: string
          recommended_action?: string | null
          recommended_parts?: string[] | null
          repair_date?: string | null
          repair_notes?: string | null
          source_reference_id?: string | null
          status?: string | null
          symptoms?: string[] | null
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          actual_repair_cost?: number | null
          component_location?: string | null
          component_name?: string
          component_type?: string | null
          created_at?: string | null
          detection_confidence?: number | null
          detection_source?: string
          estimated_labor_hours?: number | null
          estimated_parts_cost?: number | null
          estimated_repair_cost?: number | null
          fault_description?: string
          fault_severity?: string | null
          id?: string
          recommended_action?: string | null
          recommended_parts?: string[] | null
          repair_date?: string | null
          repair_notes?: string | null
          source_reference_id?: string | null
          status?: string | null
          symptoms?: string[] | null
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fault_detections_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_usage_stats: {
        Row: {
          average_usage_per_user: number | null
          created_at: string | null
          date: string
          error_rate: number | null
          feature_category: string
          feature_name: string
          id: string
          median_usage_duration_seconds: number | null
          new_users: number | null
          returning_users: number | null
          satisfaction_score: number | null
          success_rate: number | null
          total_usage_count: number | null
          total_users: number | null
        }
        Insert: {
          average_usage_per_user?: number | null
          created_at?: string | null
          date: string
          error_rate?: number | null
          feature_category: string
          feature_name: string
          id?: string
          median_usage_duration_seconds?: number | null
          new_users?: number | null
          returning_users?: number | null
          satisfaction_score?: number | null
          success_rate?: number | null
          total_usage_count?: number | null
          total_users?: number | null
        }
        Update: {
          average_usage_per_user?: number | null
          created_at?: string | null
          date?: string
          error_rate?: number | null
          feature_category?: string
          feature_name?: string
          id?: string
          median_usage_duration_seconds?: number | null
          new_users?: number | null
          returning_users?: number | null
          satisfaction_score?: number | null
          success_rate?: number | null
          total_usage_count?: number | null
          total_users?: number | null
        }
        Relationships: []
      }
      marketplace_metrics: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          metric_data: Json
          metric_date: string
          metric_type: string
          part_id: string | null
          supplier_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          metric_data: Json
          metric_date: string
          metric_type: string
          part_id?: string | null
          supplier_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          metric_data?: Json
          metric_date?: string
          metric_type?: string
          part_id?: string | null
          supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_metrics_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_metrics_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_transactions: {
        Row: {
          actual_delivery_date: string | null
          commission_amount: number | null
          commission_rate: number
          created_at: string | null
          estimated_delivery_date: string | null
          expense_id: string | null
          external_order_id: string | null
          id: string
          order_number: string
          part_id: string | null
          payment_intent_id: string | null
          payment_status: string | null
          quantity: number
          shipping_amount: number | null
          status: string | null
          supplier_id: string
          tax_amount: number | null
          total_amount: number
          tracking_number: string | null
          unit_price: number
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          actual_delivery_date?: string | null
          commission_amount?: number | null
          commission_rate: number
          created_at?: string | null
          estimated_delivery_date?: string | null
          expense_id?: string | null
          external_order_id?: string | null
          id?: string
          order_number: string
          part_id?: string | null
          payment_intent_id?: string | null
          payment_status?: string | null
          quantity?: number
          shipping_amount?: number | null
          status?: string | null
          supplier_id: string
          tax_amount?: number | null
          total_amount: number
          tracking_number?: string | null
          unit_price: number
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          actual_delivery_date?: string | null
          commission_amount?: number | null
          commission_rate?: number
          created_at?: string | null
          estimated_delivery_date?: string | null
          expense_id?: string | null
          external_order_id?: string | null
          id?: string
          order_number?: string
          part_id?: string | null
          payment_intent_id?: string | null
          payment_status?: string | null
          quantity?: number
          shipping_amount?: number | null
          status?: string | null
          supplier_id?: string
          tax_amount?: number | null
          total_amount?: number
          tracking_number?: string | null
          unit_price?: number
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_transactions_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_transactions_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_transactions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_transactions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      media_files: {
        Row: {
          analysis_data: Json | null
          analysis_status: string | null
          context: string | null
          created_at: string | null
          description: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          media_type: string
          mime_type: string
          post_id: string | null
          title: string | null
          user_id: string
          vehicle_zone: string | null
          workspace_id: string
        }
        Insert: {
          analysis_data?: Json | null
          analysis_status?: string | null
          context?: string | null
          created_at?: string | null
          description?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          media_type: string
          mime_type: string
          post_id?: string | null
          title?: string | null
          user_id: string
          vehicle_zone?: string | null
          workspace_id: string
        }
        Update: {
          analysis_data?: Json | null
          analysis_status?: string | null
          context?: string | null
          created_at?: string | null
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          media_type?: string
          mime_type?: string
          post_id?: string | null
          title?: string | null
          user_id?: string
          vehicle_zone?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_files_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "workspace_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_files_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      neo4j_operation_logs: {
        Row: {
          created_at: string | null
          cypher_query: string | null
          error_message: string | null
          execution_time_ms: number | null
          id: string
          initiated_by_user_id: string | null
          operation_type: string
          query_parameters: Json | null
          records_affected: number | null
          result_summary: Json | null
          session_id: string | null
          status: string
          vehicle_signature: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          cypher_query?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          initiated_by_user_id?: string | null
          operation_type: string
          query_parameters?: Json | null
          records_affected?: number | null
          result_summary?: Json | null
          session_id?: string | null
          status: string
          vehicle_signature?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          cypher_query?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          initiated_by_user_id?: string | null
          operation_type?: string
          query_parameters?: Json | null
          records_affected?: number | null
          result_summary?: Json | null
          session_id?: string | null
          status?: string
          vehicle_signature?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "neo4j_operation_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      neo4j_sync_status: {
        Row: {
          auto_sync_enabled: boolean | null
          checksum: string | null
          circuits_synced: number | null
          components_synced: number | null
          connections_synced: number | null
          created_at: string | null
          error_count: number | null
          id: string
          last_error: string | null
          last_sync_at: string | null
          neo4j_version: string | null
          schema_version: string | null
          sync_duration_ms: number | null
          sync_frequency_minutes: number | null
          sync_status: string | null
          updated_at: string | null
          vehicle_signature: string
          workspace_id: string
        }
        Insert: {
          auto_sync_enabled?: boolean | null
          checksum?: string | null
          circuits_synced?: number | null
          components_synced?: number | null
          connections_synced?: number | null
          created_at?: string | null
          error_count?: number | null
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          neo4j_version?: string | null
          schema_version?: string | null
          sync_duration_ms?: number | null
          sync_frequency_minutes?: number | null
          sync_status?: string | null
          updated_at?: string | null
          vehicle_signature: string
          workspace_id: string
        }
        Update: {
          auto_sync_enabled?: boolean | null
          checksum?: string | null
          circuits_synced?: number | null
          components_synced?: number | null
          connections_synced?: number | null
          created_at?: string | null
          error_count?: number | null
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          neo4j_version?: string | null
          schema_version?: string | null
          sync_duration_ms?: number | null
          sync_frequency_minutes?: number | null
          sync_status?: string | null
          updated_at?: string | null
          vehicle_signature?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "neo4j_sync_status_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      part_compatibility: {
        Row: {
          compatibility_confidence: number | null
          created_at: string | null
          data_source: string | null
          engine_types: string[] | null
          id: string
          make: string
          market_regions: string[] | null
          model: string
          notes: string | null
          part_id: string
          trim_levels: string[] | null
          verified_by_user_id: string | null
          year_end: number
          year_start: number
        }
        Insert: {
          compatibility_confidence?: number | null
          created_at?: string | null
          data_source?: string | null
          engine_types?: string[] | null
          id?: string
          make: string
          market_regions?: string[] | null
          model: string
          notes?: string | null
          part_id: string
          trim_levels?: string[] | null
          verified_by_user_id?: string | null
          year_end: number
          year_start: number
        }
        Update: {
          compatibility_confidence?: number | null
          created_at?: string | null
          data_source?: string | null
          engine_types?: string[] | null
          id?: string
          make?: string
          market_regions?: string[] | null
          model?: string
          notes?: string | null
          part_id?: string
          trim_levels?: string[] | null
          verified_by_user_id?: string | null
          year_end?: number
          year_start?: number
        }
        Relationships: [
          {
            foreignKeyName: "part_compatibility_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      part_recommendations: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          estimated_price: number | null
          id: string
          part_id: string | null
          part_name: string | null
          part_number: string | null
          reason: string | null
          source_reference_id: string | null
          source_type: string
          status: string | null
          supplier_name: string | null
          updated_at: string | null
          urgency_level: string | null
          user_feedback: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          estimated_price?: number | null
          id?: string
          part_id?: string | null
          part_name?: string | null
          part_number?: string | null
          reason?: string | null
          source_reference_id?: string | null
          source_type: string
          status?: string | null
          supplier_name?: string | null
          updated_at?: string | null
          urgency_level?: string | null
          user_feedback?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          estimated_price?: number | null
          id?: string
          part_id?: string | null
          part_name?: string | null
          part_number?: string | null
          reason?: string | null
          source_reference_id?: string | null
          source_type?: string
          status?: string | null
          supplier_name?: string | null
          updated_at?: string | null
          urgency_level?: string | null
          user_feedback?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "part_recommendations_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_recommendations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      part_reviews: {
        Row: {
          created_at: string | null
          fitment_accuracy: string | null
          helpful_count: number | null
          id: string
          installation_difficulty: string | null
          not_helpful_count: number | null
          part_id: string
          quality_rating: number | null
          rating: number
          review_text: string | null
          title: string | null
          updated_at: string | null
          user_id: string
          value_rating: number | null
          verified_purchase: boolean | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          fitment_accuracy?: string | null
          helpful_count?: number | null
          id?: string
          installation_difficulty?: string | null
          not_helpful_count?: number | null
          part_id: string
          quality_rating?: number | null
          rating: number
          review_text?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
          value_rating?: number | null
          verified_purchase?: boolean | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          fitment_accuracy?: string | null
          helpful_count?: number | null
          id?: string
          installation_difficulty?: string | null
          not_helpful_count?: number | null
          part_id?: string
          quality_rating?: number | null
          rating?: number
          review_text?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
          value_rating?: number | null
          verified_purchase?: boolean | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "part_reviews_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_reviews_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      parts_catalog: {
        Row: {
          availability_status: string | null
          base_price: number
          brand: string | null
          category: string
          compatible_makes: string[] | null
          compatible_models: string[] | null
          compatible_years: number[] | null
          connector_type: string | null
          created_at: string | null
          currency: string | null
          current_rating_amps: number | null
          description: string | null
          dimensions: Json | null
          id: string
          is_active: boolean | null
          last_updated_at: string | null
          low_stock_threshold: number | null
          manufacturer_part_number: string | null
          part_name: string
          part_number: string
          power_rating_watts: number | null
          purchase_count: number | null
          quality_grade: string | null
          rating: number | null
          review_count: number | null
          sale_price: number | null
          specifications: Json | null
          stock_quantity: number | null
          subcategory: string | null
          supplier_id: string
          universal_fitment: boolean | null
          view_count: number | null
          voltage: number | null
          warranty_months: number | null
          weight_kg: number | null
          wire_gauge: string | null
        }
        Insert: {
          availability_status?: string | null
          base_price: number
          brand?: string | null
          category: string
          compatible_makes?: string[] | null
          compatible_models?: string[] | null
          compatible_years?: number[] | null
          connector_type?: string | null
          created_at?: string | null
          currency?: string | null
          current_rating_amps?: number | null
          description?: string | null
          dimensions?: Json | null
          id?: string
          is_active?: boolean | null
          last_updated_at?: string | null
          low_stock_threshold?: number | null
          manufacturer_part_number?: string | null
          part_name: string
          part_number: string
          power_rating_watts?: number | null
          purchase_count?: number | null
          quality_grade?: string | null
          rating?: number | null
          review_count?: number | null
          sale_price?: number | null
          specifications?: Json | null
          stock_quantity?: number | null
          subcategory?: string | null
          supplier_id: string
          universal_fitment?: boolean | null
          view_count?: number | null
          voltage?: number | null
          warranty_months?: number | null
          weight_kg?: number | null
          wire_gauge?: string | null
        }
        Update: {
          availability_status?: string | null
          base_price?: number
          brand?: string | null
          category?: string
          compatible_makes?: string[] | null
          compatible_models?: string[] | null
          compatible_years?: number[] | null
          connector_type?: string | null
          created_at?: string | null
          currency?: string | null
          current_rating_amps?: number | null
          description?: string | null
          dimensions?: Json | null
          id?: string
          is_active?: boolean | null
          last_updated_at?: string | null
          low_stock_threshold?: number | null
          manufacturer_part_number?: string | null
          part_name?: string
          part_number?: string
          power_rating_watts?: number | null
          purchase_count?: number | null
          quality_grade?: string | null
          rating?: number | null
          review_count?: number | null
          sale_price?: number | null
          specifications?: Json | null
          stock_quantity?: number | null
          subcategory?: string | null
          supplier_id?: string
          universal_fitment?: boolean | null
          view_count?: number | null
          voltage?: number | null
          warranty_months?: number | null
          weight_kg?: number | null
          wire_gauge?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parts_catalog_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          created_at: string | null
          environment: string | null
          id: string
          json_value: Json | null
          metric_name: string
          metric_type: string
          numeric_value: number | null
          service_name: string | null
          source: string | null
          tags: string[] | null
          text_value: string | null
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          environment?: string | null
          id?: string
          json_value?: Json | null
          metric_name: string
          metric_type: string
          numeric_value?: number | null
          service_name?: string | null
          source?: string | null
          tags?: string[] | null
          text_value?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          environment?: string | null
          id?: string
          json_value?: Json | null
          metric_name?: string
          metric_type?: string
          numeric_value?: number | null
          service_name?: string | null
          source?: string | null
          tags?: string[] | null
          text_value?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_metrics_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          parent_comment_id: string | null
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "workspace_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "workspace_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          analytics_enabled: boolean | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          data_sharing_consent: boolean | null
          display_name: string | null
          email: string | null
          experience_level: string | null
          full_name: string | null
          id: string
          image_path: string | null
          image_url: string | null
          notification_preferences: Json | null
          preferred_units: string | null
          profile_context: string | null
          total_expenses: number | null
          total_workspaces: number | null
          updated_at: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          analytics_enabled?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          data_sharing_consent?: boolean | null
          display_name?: string | null
          email?: string | null
          experience_level?: string | null
          full_name?: string | null
          id?: string
          image_path?: string | null
          image_url?: string | null
          notification_preferences?: Json | null
          preferred_units?: string | null
          profile_context?: string | null
          total_expenses?: number | null
          total_workspaces?: number | null
          updated_at?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          analytics_enabled?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          data_sharing_consent?: boolean | null
          display_name?: string | null
          email?: string | null
          experience_level?: string | null
          full_name?: string | null
          id?: string
          image_path?: string | null
          image_url?: string | null
          notification_preferences?: Json | null
          preferred_units?: string | null
          profile_context?: string | null
          total_expenses?: number | null
          total_workspaces?: number | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      shopping_cart: {
        Row: {
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopping_cart_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_cart_items: {
        Row: {
          cart_id: string
          created_at: string | null
          id: string
          original_price: number | null
          part_id: string
          price_changed: boolean | null
          quantity: number
          total_price: number | null
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          cart_id: string
          created_at?: string | null
          id?: string
          original_price?: number | null
          part_id: string
          price_changed?: boolean | null
          quantity?: number
          total_price?: number | null
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          cart_id?: string
          created_at?: string | null
          id?: string
          original_price?: number | null
          part_id?: string
          price_changed?: boolean | null
          quantity?: number
          total_price?: number | null
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopping_cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "shopping_cart"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_cart_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      social_notifications: {
        Row: {
          comment_id: string | null
          created_at: string | null
          delivered: boolean | null
          delivery_method: string[] | null
          id: string
          message: string | null
          notification_type: string
          post_id: string | null
          read: boolean | null
          read_at: string | null
          recipient_user_id: string
          sender_user_id: string | null
          title: string
          workspace_id: string | null
        }
        Insert: {
          comment_id?: string | null
          created_at?: string | null
          delivered?: boolean | null
          delivery_method?: string[] | null
          id?: string
          message?: string | null
          notification_type: string
          post_id?: string | null
          read?: boolean | null
          read_at?: string | null
          recipient_user_id: string
          sender_user_id?: string | null
          title: string
          workspace_id?: string | null
        }
        Update: {
          comment_id?: string | null
          created_at?: string | null
          delivered?: boolean | null
          delivery_method?: string[] | null
          id?: string
          message?: string | null
          notification_type?: string
          post_id?: string | null
          read?: boolean | null
          read_at?: string | null
          recipient_user_id?: string
          sender_user_id?: string | null
          title?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_notifications_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "workspace_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_notifications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          average_delivery_time_days: number | null
          business_registration_number: string | null
          city: string | null
          commission_rate: number | null
          contact_email: string | null
          contact_phone: string | null
          country: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          name: string
          on_time_delivery_percentage: number | null
          payment_terms_days: number | null
          postal_code: string | null
          rating: number | null
          registration_date: string | null
          return_rate_percentage: number | null
          state_province: string | null
          tax_id: string | null
          total_reviews: number | null
          total_sales: number | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          average_delivery_time_days?: number | null
          business_registration_number?: string | null
          city?: string | null
          commission_rate?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          name: string
          on_time_delivery_percentage?: number | null
          payment_terms_days?: number | null
          postal_code?: string | null
          rating?: number | null
          registration_date?: string | null
          return_rate_percentage?: number | null
          state_province?: string | null
          tax_id?: string | null
          total_reviews?: number | null
          total_sales?: number | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          average_delivery_time_days?: number | null
          business_registration_number?: string | null
          city?: string | null
          commission_rate?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          name?: string
          on_time_delivery_percentage?: number | null
          payment_terms_days?: number | null
          postal_code?: string | null
          rating?: number | null
          registration_date?: string | null
          return_rate_percentage?: number | null
          state_province?: string | null
          tax_id?: string | null
          total_reviews?: number | null
          total_sales?: number | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      transaction_items: {
        Row: {
          created_at: string | null
          id: string
          part_id: string
          part_name: string
          part_number: string
          quantity: number
          supplier_name: string
          total_price: number | null
          transaction_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          part_id: string
          part_name: string
          part_number: string
          quantity?: number
          supplier_name: string
          total_price?: number | null
          transaction_id: string
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          part_id?: string
          part_name?: string
          part_number?: string
          quantity?: number
          supplier_name?: string
          total_price?: number | null
          transaction_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "transaction_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "marketplace_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_behavior_analytics: {
        Row: {
          average_session_duration_seconds: number | null
          created_at: string | null
          days_active_last_30: number | null
          engagement_score: number | null
          feature_adoption_score: number | null
          features_used: string[] | null
          first_analysis_date: string | null
          first_purchase_date: string | null
          first_workspace_date: string | null
          id: string
          last_calculated_at: string | null
          lifetime_value_score: number | null
          most_used_feature: string | null
          retention_risk_score: number | null
          signup_date: string | null
          total_analyses: number | null
          total_chat_messages: number | null
          total_expenses_tracked: number | null
          total_marketplace_purchases: number | null
          total_session_duration_seconds: number | null
          total_sessions: number | null
          total_uploads: number | null
          updated_at: string | null
          user_id: string
          workspaces_created: number | null
        }
        Insert: {
          average_session_duration_seconds?: number | null
          created_at?: string | null
          days_active_last_30?: number | null
          engagement_score?: number | null
          feature_adoption_score?: number | null
          features_used?: string[] | null
          first_analysis_date?: string | null
          first_purchase_date?: string | null
          first_workspace_date?: string | null
          id?: string
          last_calculated_at?: string | null
          lifetime_value_score?: number | null
          most_used_feature?: string | null
          retention_risk_score?: number | null
          signup_date?: string | null
          total_analyses?: number | null
          total_chat_messages?: number | null
          total_expenses_tracked?: number | null
          total_marketplace_purchases?: number | null
          total_session_duration_seconds?: number | null
          total_sessions?: number | null
          total_uploads?: number | null
          updated_at?: string | null
          user_id: string
          workspaces_created?: number | null
        }
        Update: {
          average_session_duration_seconds?: number | null
          created_at?: string | null
          days_active_last_30?: number | null
          engagement_score?: number | null
          feature_adoption_score?: number | null
          features_used?: string[] | null
          first_analysis_date?: string | null
          first_purchase_date?: string | null
          first_workspace_date?: string | null
          id?: string
          last_calculated_at?: string | null
          lifetime_value_score?: number | null
          most_used_feature?: string | null
          retention_risk_score?: number | null
          signup_date?: string | null
          total_analyses?: number | null
          total_chat_messages?: number | null
          total_expenses_tracked?: number | null
          total_marketplace_purchases?: number | null
          total_session_duration_seconds?: number | null
          total_sessions?: number | null
          total_uploads?: number | null
          updated_at?: string | null
          user_id?: string
          workspaces_created?: number | null
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string | null
          followed_user_id: string
          follower_user_id: string
          id: string
          notification_enabled: boolean | null
        }
        Insert: {
          created_at?: string | null
          followed_user_id: string
          follower_user_id: string
          id?: string
          notification_enabled?: boolean | null
        }
        Update: {
          created_at?: string | null
          followed_user_id?: string
          follower_user_id?: string
          id?: string
          notification_enabled?: boolean | null
        }
        Relationships: []
      }
      user_interactions: {
        Row: {
          action_type: string
          city: string | null
          country: string | null
          created_at: string | null
          element_id: string | null
          element_type: string | null
          feature_area: string
          id: string
          ip_address: unknown
          metadata: Json | null
          page_url: string | null
          previous_action_id: string | null
          region: string | null
          response_time_ms: number | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          action_type: string
          city?: string | null
          country?: string | null
          created_at?: string | null
          element_id?: string | null
          element_type?: string | null
          feature_area: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          page_url?: string | null
          previous_action_id?: string | null
          region?: string | null
          response_time_ms?: number | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          action_type?: string
          city?: string | null
          country?: string | null
          created_at?: string | null
          element_id?: string | null
          element_type?: string | null
          feature_area?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          page_url?: string | null
          previous_action_id?: string | null
          region?: string | null
          response_time_ms?: number | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_interactions_previous_action_id_fkey"
            columns: ["previous_action_id"]
            isOneToOne: false
            referencedRelation: "user_interactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_interactions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_onboarding: {
        Row: {
          allow_community_help: boolean | null
          auto_backup_enabled: boolean | null
          completed_at: string | null
          created_at: string | null
          default_workspace_visibility: string | null
          electrical_experience: string | null
          expense_tracking_enabled: boolean | null
          has_completed: boolean | null
          id: string
          notification_timing: string | null
          preferred_assistance_style: string | null
          primary_goals: string[] | null
          share_progress: boolean | null
          share_projects: boolean | null
          started_at: string | null
          updated_at: string | null
          user_id: string
          vehicle_expertise: string | null
          vehicle_types: string[] | null
        }
        Insert: {
          allow_community_help?: boolean | null
          auto_backup_enabled?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          default_workspace_visibility?: string | null
          electrical_experience?: string | null
          expense_tracking_enabled?: boolean | null
          has_completed?: boolean | null
          id?: string
          notification_timing?: string | null
          preferred_assistance_style?: string | null
          primary_goals?: string[] | null
          share_progress?: boolean | null
          share_projects?: boolean | null
          started_at?: string | null
          updated_at?: string | null
          user_id: string
          vehicle_expertise?: string | null
          vehicle_types?: string[] | null
        }
        Update: {
          allow_community_help?: boolean | null
          auto_backup_enabled?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          default_workspace_visibility?: string | null
          electrical_experience?: string | null
          expense_tracking_enabled?: boolean | null
          has_completed?: boolean | null
          id?: string
          notification_timing?: string | null
          preferred_assistance_style?: string | null
          primary_goals?: string[] | null
          share_progress?: boolean | null
          share_projects?: boolean | null
          started_at?: string | null
          updated_at?: string | null
          user_id?: string
          vehicle_expertise?: string | null
          vehicle_types?: string[] | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          analytics_enabled: boolean | null
          community_mentions: boolean | null
          created_at: string | null
          data_sharing_consent: boolean | null
          email_notifications: boolean | null
          id: string
          language: string | null
          preferred_units: string | null
          profile_visibility: string | null
          project_updates: boolean | null
          push_notifications: boolean | null
          theme: string | null
          updated_at: string | null
          user_id: string
          weekly_digest: boolean | null
        }
        Insert: {
          analytics_enabled?: boolean | null
          community_mentions?: boolean | null
          created_at?: string | null
          data_sharing_consent?: boolean | null
          email_notifications?: boolean | null
          id?: string
          language?: string | null
          preferred_units?: string | null
          profile_visibility?: string | null
          project_updates?: boolean | null
          push_notifications?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
          weekly_digest?: boolean | null
        }
        Update: {
          analytics_enabled?: boolean | null
          community_mentions?: boolean | null
          created_at?: string | null
          data_sharing_consent?: boolean | null
          email_notifications?: boolean | null
          id?: string
          language?: string | null
          preferred_units?: string | null
          profile_visibility?: string | null
          project_updates?: boolean | null
          push_notifications?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string
          weekly_digest?: boolean | null
        }
        Relationships: []
      }
      user_social_links: {
        Row: {
          created_at: string | null
          id: string
          platform: string
          updated_at: string | null
          url: string
          user_id: string
          verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform: string
          updated_at?: string | null
          url: string
          user_id: string
          verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: string
          platform?: string
          updated_at?: string | null
          url?: string
          user_id?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      user_social_stats: {
        Row: {
          created_at: string | null
          engagement_score: number | null
          followers_count: number | null
          following_count: number | null
          id: string
          influence_score: number | null
          last_calculated_at: string | null
          public_workspaces_count: number | null
          total_comments_given: number | null
          total_comments_received: number | null
          total_likes_given: number | null
          total_likes_received: number | null
          total_posts_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          engagement_score?: number | null
          followers_count?: number | null
          following_count?: number | null
          id?: string
          influence_score?: number | null
          last_calculated_at?: string | null
          public_workspaces_count?: number | null
          total_comments_given?: number | null
          total_comments_received?: number | null
          total_likes_given?: number | null
          total_likes_received?: number | null
          total_posts_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          engagement_score?: number | null
          followers_count?: number | null
          following_count?: number | null
          id?: string
          influence_score?: number | null
          last_calculated_at?: string | null
          public_workspaces_count?: number | null
          total_comments_given?: number | null
          total_comments_received?: number | null
          total_likes_given?: number | null
          total_likes_received?: number | null
          total_posts_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          body_style: string | null
          color: string | null
          created_at: string | null
          drivetrain: string | null
          electrical_voltage: number | null
          engine_type: string | null
          fuel_type: string | null
          id: string
          make: string
          market_region: string | null
          mileage_km: number | null
          model: string
          notes: string | null
          purchase_date: string | null
          transmission_type: string | null
          trim_level: string | null
          updated_at: string | null
          vin: string | null
          workspace_id: string
          year: number
        }
        Insert: {
          body_style?: string | null
          color?: string | null
          created_at?: string | null
          drivetrain?: string | null
          electrical_voltage?: number | null
          engine_type?: string | null
          fuel_type?: string | null
          id?: string
          make: string
          market_region?: string | null
          mileage_km?: number | null
          model: string
          notes?: string | null
          purchase_date?: string | null
          transmission_type?: string | null
          trim_level?: string | null
          updated_at?: string | null
          vin?: string | null
          workspace_id: string
          year: number
        }
        Update: {
          body_style?: string | null
          color?: string | null
          created_at?: string | null
          drivetrain?: string | null
          electrical_voltage?: number | null
          engine_type?: string | null
          fuel_type?: string | null
          id?: string
          make?: string
          market_region?: string | null
          mileage_km?: number | null
          model?: string
          notes?: string | null
          purchase_date?: string | null
          transmission_type?: string | null
          trim_level?: string | null
          updated_at?: string | null
          vin?: string | null
          workspace_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_follows: {
        Row: {
          created_at: string | null
          followed_workspace_id: string
          follower_user_id: string
          id: string
          notification_enabled: boolean | null
        }
        Insert: {
          created_at?: string | null
          followed_workspace_id: string
          follower_user_id: string
          id?: string
          notification_enabled?: boolean | null
        }
        Update: {
          created_at?: string | null
          followed_workspace_id?: string
          follower_user_id?: string
          id?: string
          notification_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "workspace_follows_followed_workspace_id_fkey"
            columns: ["followed_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_likes: {
        Row: {
          created_at: string | null
          id: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_likes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_posts: {
        Row: {
          budget_allocated: number | null
          content: string | null
          created_at: string | null
          expenses_total: number | null
          id: string
          post_type: string | null
          priority: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          budget_allocated?: number | null
          content?: string | null
          created_at?: string | null
          expenses_total?: number | null
          id?: string
          post_type?: string | null
          priority?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          budget_allocated?: number | null
          content?: string | null
          created_at?: string | null
          expenses_total?: number | null
          id?: string
          post_type?: string | null
          priority?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_posts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          last_activity_at: string | null
          name: string
          status: string | null
          total_budget: number | null
          total_expenses: number | null
          updated_at: string | null
          user_id: string
          vehicle_signature: string
          visibility: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          last_activity_at?: string | null
          name: string
          status?: string | null
          total_budget?: number | null
          total_expenses?: number | null
          updated_at?: string | null
          user_id: string
          vehicle_signature: string
          visibility?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          last_activity_at?: string | null
          name?: string
          status?: string | null
          total_budget?: number | null
          total_expenses?: number | null
          updated_at?: string | null
          user_id?: string
          vehicle_signature?: string
          visibility?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_user_social_link: {
        Args: { p_platform: string; p_url: string; p_user_id: string }
        Returns: string
      }
      cache_component_detection: {
        Args: {
          p_ai_model: string
          p_components: Json
          p_confidence: number
          p_image_dimensions: string
          p_image_hash: string
          p_image_size: number
          p_processing_time: number
        }
        Returns: string
      }
      calculate_commission_payout: {
        Args: {
          p_end_date: string
          p_start_date: string
          p_supplier_id: string
        }
        Returns: {
          total_commission: number
          total_sales: number
          total_transactions: number
          transaction_ids: string[]
        }[]
      }
      calculate_user_engagement_score: {
        Args: { p_user_id: string }
        Returns: number
      }
      cleanup_expired_cache: { Args: never; Returns: number }
      complete_user_onboarding: {
        Args: { p_onboarding_updates?: Json; p_user_id: string }
        Returns: boolean
      }
      create_social_notification: {
        Args: {
          p_comment_id?: string
          p_message?: string
          p_notification_type: string
          p_post_id?: string
          p_recipient_user_id: string
          p_sender_user_id: string
          p_title: string
          p_workspace_id?: string
        }
        Returns: string
      }
      find_compatible_parts: {
        Args: {
          p_category?: string
          p_make: string
          p_model: string
          p_year: number
        }
        Returns: {
          base_price: number
          compatibility_confidence: number
          part_id: string
          part_name: string
          part_number: string
          rating: number
          supplier_name: string
        }[]
      }
      generate_bi_report: {
        Args: {
          p_end_date: string
          p_report_type: string
          p_start_date: string
        }
        Returns: string
      }
      generate_order_number: { Args: never; Returns: string }
      generate_vehicle_signature: {
        Args: {
          p_make: string
          p_model: string
          p_user_id: string
          p_year: number
        }
        Returns: string
      }
      get_cached_component_detection: {
        Args: { p_image_hash: string }
        Returns: {
          ai_model: string
          cache_age: unknown
          components: Json
          confidence: number
        }[]
      }
      get_marketplace_dashboard_metrics: {
        Args: { p_date_range?: number; p_user_id: string }
        Returns: {
          active_carts: number
          delivered_orders: number
          favorite_supplier: string
          most_purchased_category: string
          pending_orders: number
          total_purchases: number
          total_spent: number
        }[]
      }
      increment_part_view_count: {
        Args: { part_uuid: string }
        Returns: undefined
      }
      log_neo4j_operation: {
        Args: {
          p_cypher_query: string
          p_error_message?: string
          p_execution_time: number
          p_operation_type: string
          p_status: string
          p_user_id?: string
          p_vehicle_signature: string
          p_workspace_id: string
        }
        Returns: string
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      track_user_interaction: {
        Args: {
          p_action_type: string
          p_element_id?: string
          p_element_type?: string
          p_feature_area: string
          p_metadata?: Json
          p_page_url?: string
          p_response_time?: number
          p_session_id?: string
          p_user_id: string
          p_workspace_id: string
        }
        Returns: string
      }
      trigger_electrical_analysis: {
        Args: {
          p_media_file_id: string
          p_user_id: string
          p_workspace_id: string
        }
        Returns: string
      }
      update_user_behavior_analytics: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      update_user_social_stats: {
        Args: { p_user_id: string }
        Returns: undefined
      }
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
