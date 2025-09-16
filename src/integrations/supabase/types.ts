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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      branches: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      inventory: {
        Row: {
          batch_id: string | null
          branch_id: string
          id: string
          last_updated: string
          product_id: string
          quantity: number
        }
        Insert: {
          batch_id?: string | null
          branch_id: string
          id?: string
          last_updated?: string
          product_id: string
          quantity?: number
        }
        Update: {
          batch_id?: string | null
          branch_id?: string
          id?: string
          last_updated?: string
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_inventory_branch_id"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_inventory_product_id"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "product_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_id: string | null
          related_type: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_id?: string | null
          related_type?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_id?: string | null
          related_type?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          from_stock: number | null
          id: string
          notes: string | null
          order_id: string
          product_id: string
          production_needed: boolean | null
          quantity: number
          stock_status: string | null
          subtotal: number
          to_produce: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          from_stock?: number | null
          id?: string
          notes?: string | null
          order_id: string
          product_id: string
          production_needed?: boolean | null
          quantity: number
          stock_status?: string | null
          subtotal: number
          to_produce?: number | null
          unit_price: number
        }
        Update: {
          created_at?: string
          from_stock?: number | null
          id?: string
          notes?: string | null
          order_id?: string
          product_id?: string
          production_needed?: boolean | null
          quantity?: number
          stock_status?: string | null
          subtotal?: number
          to_produce?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_at: string | null
          changed_by: string
          id: string
          new_status: string
          notes: string | null
          old_status: string | null
          order_id: string
        }
        Insert: {
          changed_at?: string | null
          changed_by: string
          id?: string
          new_status: string
          notes?: string | null
          old_status?: string | null
          order_id: string
        }
        Update: {
          changed_at?: string | null
          changed_by?: string
          id?: string
          new_status?: string
          notes?: string | null
          old_status?: string | null
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          branch_id: string
          branch_name: string | null
          created_at: string
          created_by: string
          customer_name: string
          customer_phone: string | null
          delivery_address: string | null
          delivery_date: string
          dp_amount: number | null
          id: string
          is_preorder: boolean | null
          items: Json | null
          linked_transaction_id: string | null
          notes: string | null
          order_date: string
          order_number: string
          payment_status: string | null
          payment_type: string
          phone_number: string | null
          pickup_branch_id: string | null
          remaining_amount: number | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          branch_id: string
          branch_name?: string | null
          created_at?: string
          created_by: string
          customer_name: string
          customer_phone?: string | null
          delivery_address?: string | null
          delivery_date: string
          dp_amount?: number | null
          id?: string
          is_preorder?: boolean | null
          items?: Json | null
          linked_transaction_id?: string | null
          notes?: string | null
          order_date?: string
          order_number: string
          payment_status?: string | null
          payment_type?: string
          phone_number?: string | null
          pickup_branch_id?: string | null
          remaining_amount?: number | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          branch_id?: string
          branch_name?: string | null
          created_at?: string
          created_by?: string
          customer_name?: string
          customer_phone?: string | null
          delivery_address?: string | null
          delivery_date?: string
          dp_amount?: number | null
          id?: string
          is_preorder?: boolean | null
          items?: Json | null
          linked_transaction_id?: string | null
          notes?: string | null
          order_date?: string
          order_number?: string
          payment_status?: string | null
          payment_type?: string
          phone_number?: string | null
          pickup_branch_id?: string | null
          remaining_amount?: number | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_orders_linked_transaction"
            columns: ["linked_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_pickup_branch_id_fkey"
            columns: ["pickup_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_history: {
        Row: {
          amount_paid: number
          cashier_id: string
          created_at: string | null
          id: string
          notes: string | null
          payment_date: string | null
          payment_method: string
          transaction_id: string
        }
        Insert: {
          amount_paid: number
          cashier_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method: string
          transaction_id: string
        }
        Update: {
          amount_paid?: number
          cashier_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_history_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      product_batches: {
        Row: {
          batch_number: string
          branch_id: string
          created_at: string | null
          expiry_date: string
          id: string
          product_id: string
          production_date: string
          quantity: number
          status: string | null
          updated_at: string | null
        }
        Insert: {
          batch_number: string
          branch_id: string
          created_at?: string | null
          expiry_date: string
          id?: string
          product_id: string
          production_date?: string
          quantity?: number
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          batch_number?: string
          branch_id?: string
          created_at?: string | null
          expiry_date?: string
          id?: string
          product_id?: string
          production_date?: string
          quantity?: number
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_batches_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_packages: {
        Row: {
          component_product_id: string
          created_at: string | null
          id: string
          parent_product_id: string
          quantity: number
        }
        Insert: {
          component_product_id: string
          created_at?: string | null
          id?: string
          parent_product_id: string
          quantity?: number
        }
        Update: {
          component_product_id?: string
          created_at?: string | null
          id?: string
          parent_product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_packages_component_product_id_fkey"
            columns: ["component_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_packages_parent_product_id_fkey"
            columns: ["parent_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      production_batches: {
        Row: {
          batch_number: string
          created_at: string
          id: string
          produced_by: string
          production_end: string | null
          production_request_id: string
          production_start: string | null
          quality_notes: string | null
          quantity_produced: number
        }
        Insert: {
          batch_number: string
          created_at?: string
          id?: string
          produced_by: string
          production_end?: string | null
          production_request_id: string
          production_start?: string | null
          quality_notes?: string | null
          quantity_produced: number
        }
        Update: {
          batch_number?: string
          created_at?: string
          id?: string
          produced_by?: string
          production_end?: string | null
          production_request_id?: string
          production_start?: string | null
          quality_notes?: string | null
          quantity_produced?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_production_batches_produced_by"
            columns: ["produced_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_production_batches_production_request_id"
            columns: ["production_request_id"]
            isOneToOne: false
            referencedRelation: "production_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_batches_production_request_id_fkey"
            columns: ["production_request_id"]
            isOneToOne: false
            referencedRelation: "production_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      production_requests: {
        Row: {
          branch_id: string
          created_at: string
          id: string
          notes: string | null
          order_id: string | null
          produced_by: string | null
          product_id: string
          production_date: string
          quantity_produced: number | null
          quantity_requested: number
          requested_by: string
          status: string
          updated_at: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          produced_by?: string | null
          product_id: string
          production_date: string
          quantity_produced?: number | null
          quantity_requested: number
          requested_by: string
          status?: string
          updated_at?: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          produced_by?: string | null
          product_id?: string
          production_date?: string
          quantity_produced?: number | null
          quantity_requested?: number
          requested_by?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_production_requests_branch_id"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_production_requests_produced_by"
            columns: ["produced_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_production_requests_product_id"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_production_requests_requested_by"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_requests_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          created_at: string
          default_expiry_days: number | null
          description: string | null
          has_expiry: boolean | null
          id: string
          image_url: string | null
          name: string
          price: number
          product_type: Database["public"]["Enums"]["product_type"] | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          default_expiry_days?: number | null
          description?: string | null
          has_expiry?: boolean | null
          id?: string
          image_url?: string | null
          name: string
          price: number
          product_type?: Database["public"]["Enums"]["product_type"] | null
        }
        Update: {
          active?: boolean
          created_at?: string
          default_expiry_days?: number | null
          description?: string | null
          has_expiry?: boolean | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          product_type?: Database["public"]["Enums"]["product_type"] | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          name: string
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          name: string
          role: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      return_items: {
        Row: {
          batch_id: string | null
          condition: string | null
          created_at: string | null
          id: string
          product_id: string
          quantity: number
          reason: string
          return_id: string
        }
        Insert: {
          batch_id?: string | null
          condition?: string | null
          created_at?: string | null
          id?: string
          product_id: string
          quantity: number
          reason: string
          return_id: string
        }
        Update: {
          batch_id?: string | null
          condition?: string | null
          created_at?: string | null
          id?: string
          product_id?: string
          quantity?: number
          reason?: string
          return_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "return_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "product_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_items_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "returns"
            referencedColumns: ["id"]
          },
        ]
      }
      returns: {
        Row: {
          branch_id: string
          created_at: string | null
          id: string
          notes: string | null
          processed_by: string
          reason: string
          return_date: string | null
          status: string | null
          transaction_id: string | null
        }
        Insert: {
          branch_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          processed_by: string
          reason: string
          return_date?: string | null
          status?: string | null
          transaction_id?: string | null
        }
        Update: {
          branch_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          processed_by?: string
          reason?: string
          return_date?: string | null
          status?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "returns_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          batch_id: string | null
          branch_id: string
          created_at: string | null
          id: string
          movement_date: string | null
          movement_type: string
          performed_by: string | null
          product_id: string
          quantity_change: number
          reason: string | null
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          batch_id?: string | null
          branch_id: string
          created_at?: string | null
          id?: string
          movement_date?: string | null
          movement_type: string
          performed_by?: string | null
          product_id: string
          quantity_change: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          batch_id?: string | null
          branch_id?: string
          created_at?: string | null
          id?: string
          movement_date?: string | null
          movement_type?: string
          performed_by?: string | null
          product_id?: string
          quantity_change?: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "product_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_items: {
        Row: {
          id: string
          price_per_item: number
          product_id: string
          quantity: number
          subtotal: number
          transaction_id: string
        }
        Insert: {
          id?: string
          price_per_item: number
          product_id: string
          quantity: number
          subtotal: number
          transaction_id: string
        }
        Update: {
          id?: string
          price_per_item?: number
          product_id?: string
          quantity?: number
          subtotal?: number
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_transaction_items_product_id"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_transaction_items_transaction_id"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount_paid: number | null
          amount_remaining: number | null
          branch_id: string
          cashier_id: string
          due_date: string | null
          id: string
          installment_plan: Json | null
          notes: string | null
          payment_method: string
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          status: string
          total_amount: number
          transaction_date: string
        }
        Insert: {
          amount_paid?: number | null
          amount_remaining?: number | null
          branch_id: string
          cashier_id: string
          due_date?: string | null
          id?: string
          installment_plan?: Json | null
          notes?: string | null
          payment_method?: string
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          status?: string
          total_amount?: number
          transaction_date?: string
        }
        Update: {
          amount_paid?: number | null
          amount_remaining?: number | null
          branch_id?: string
          cashier_id?: string
          due_date?: string | null
          id?: string
          installment_plan?: Json | null
          notes?: string | null
          payment_method?: string
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          status?: string
          total_amount?: number
          transaction_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_transactions_branch_id"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_transactions_cashier_id"
            columns: ["cashier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      user_branches: {
        Row: {
          branch_id: string
          user_id: string
        }
        Insert: {
          branch_id: string
          user_id: string
        }
        Update: {
          branch_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_branches_branch_id"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user_branches_user_id"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_branches_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bulk_update_order_status: {
        Args: { new_status: string; notes?: string; order_ids: string[] }
        Returns: number
      }
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_expiring_products: {
        Args: { days_ahead?: number }
        Returns: {
          batch_number: string
          branch_name: string
          days_until_expiry: number
          expiry_date: string
          product_name: string
          quantity: number
        }[]
      }
      get_order_calendar_data: {
        Args: { p_branch_id?: string; p_month?: number; p_year?: number }
        Returns: {
          delivery_date: string
          order_count: number
          status_breakdown: Json
          total_amount: number
        }[]
      }
      get_order_statistics: {
        Args: {
          p_branch_id?: string
          p_end_date?: string
          p_start_date?: string
        }
        Returns: {
          average_order_value: number
          cancelled_orders: number
          completed_orders: number
          confirmed_orders: number
          in_production_orders: number
          pending_orders: number
          ready_orders: number
          total_orders: number
          total_revenue: number
        }[]
      }
      get_orders_for_user: {
        Args: { p_branch_id?: string }
        Returns: {
          branch_id: string
          branch_name: string
          created_at: string
          created_by: string
          customer_name: string
          customer_phone: string
          delivery_date: string
          id: string
          items: Json
          notes: string
          order_date: string
          order_number: string
          status: string
          total_amount: number
        }[]
      }
      update_inventory: {
        Args: {
          p_branch_id: string
          p_movement_type: string
          p_performed_by: string
          p_product_id: string
          p_quantity_change: number
          p_reference_id: string
          p_reference_type: string
        }
        Returns: undefined
      }
    }
    Enums: {
      payment_status: "paid" | "pending" | "partial" | "cancelled"
      product_type: "regular" | "package" | "bundle"
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
      payment_status: ["paid", "pending", "partial", "cancelled"],
      product_type: ["regular", "package", "bundle"],
    },
  },
} as const
