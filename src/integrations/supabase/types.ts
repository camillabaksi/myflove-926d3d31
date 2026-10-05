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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          action: string
          created_at: string
          id: string
          section: string
          session_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          section: string
          session_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          section?: string
          session_id?: string
        }
        Relationships: []
      }
      analytics_session_owners: {
        Row: {
          created_at: string
          is_internal: boolean
          marked_by: string | null
          note: string | null
          session_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          is_internal?: boolean
          marked_by?: string | null
          note?: string | null
          session_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          is_internal?: boolean
          marked_by?: string | null
          note?: string | null
          session_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      app_user_connections: {
        Row: {
          connection_key_ciphertext: string
          connector_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          connection_key_ciphertext: string
          connector_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          connection_key_ciphertext?: string
          connector_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      child_item_revisions: {
        Row: {
          archived_at: string
          id: number
          item_id: string
          operation: string
          owner_id: string
          snapshot: Json
        }
        Insert: {
          archived_at?: string
          id?: number
          item_id: string
          operation: string
          owner_id: string
          snapshot: Json
        }
        Update: {
          archived_at?: string
          id?: number
          item_id?: string
          operation?: string
          owner_id?: string
          snapshot?: Json
        }
        Relationships: []
      }
      child_item_shares: {
        Row: {
          created_at: string
          item_id: string
          notify: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          item_id: string
          notify?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          item_id?: string
          notify?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_item_shares_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "child_items"
            referencedColumns: ["id"]
          },
        ]
      }
      child_items: {
        Row: {
          child_id: string
          completed: boolean
          created_at: string
          date: string | null
          file_path: string | null
          id: string
          kind: string
          notes: string | null
          owner_id: string
          remind: boolean
          repeat: string
          share_family: boolean
          time: string | null
          title: string
          updated_at: string
        }
        Insert: {
          child_id: string
          completed?: boolean
          created_at?: string
          date?: string | null
          file_path?: string | null
          id?: string
          kind?: string
          notes?: string | null
          owner_id?: string
          remind?: boolean
          repeat?: string
          share_family?: boolean
          time?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          child_id?: string
          completed?: boolean
          created_at?: string
          date?: string | null
          file_path?: string | null
          id?: string
          kind?: string
          notes?: string | null
          owner_id?: string
          remind?: boolean
          repeat?: string
          share_family?: boolean
          time?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_items_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      child_shares: {
        Row: {
          child_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          child_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          child_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_shares_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          account_user_id: string | null
          avatar: string | null
          birthdate: string | null
          color: string
          created_at: string
          helps: string[]
          id: string
          name: string
          note: string | null
          owner_id: string
          updated_at: string
        }
        Insert: {
          account_user_id?: string | null
          avatar?: string | null
          birthdate?: string | null
          color?: string
          created_at?: string
          helps?: string[]
          id?: string
          name: string
          note?: string | null
          owner_id?: string
          updated_at?: string
        }
        Update: {
          account_user_id?: string | null
          avatar?: string | null
          birthdate?: string | null
          color?: string
          created_at?: string
          helps?: string[]
          id?: string
          name?: string
          note?: string | null
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      energy_factor_presets: {
        Row: {
          category: string
          created_at: string
          direction: string
          friction: number | null
          id: string
          kind: string
          strength: number
          title: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          direction?: string
          friction?: number | null
          id?: string
          kind?: string
          strength?: number
          title: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          direction?: string
          friction?: number | null
          id?: string
          kind?: string
          strength?: number
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      energy_factors: {
        Row: {
          category: string
          counts_toward_score: boolean
          created_at: string
          dedup_key: string | null
          direction: string
          friction: number | null
          id: string
          kind: string
          note: string | null
          occurred_at: string
          strength: number
          title: string
          user_id: string
        }
        Insert: {
          category?: string
          counts_toward_score?: boolean
          created_at?: string
          dedup_key?: string | null
          direction?: string
          friction?: number | null
          id?: string
          kind?: string
          note?: string | null
          occurred_at?: string
          strength?: number
          title: string
          user_id: string
        }
        Update: {
          category?: string
          counts_toward_score?: boolean
          created_at?: string
          dedup_key?: string | null
          direction?: string
          friction?: number | null
          id?: string
          kind?: string
          note?: string | null
          occurred_at?: string
          strength?: number
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      energy_logs: {
        Row: {
          created_at: string
          id: string
          level: number
          logged_at: string
          note: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          level: number
          logged_at?: string
          note?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: number
          logged_at?: string
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      family_share_areas: {
        Row: {
          area: string
          can_edit: boolean
          created_at: string
          editors: string[] | null
          user_id: string
          viewers: string[] | null
        }
        Insert: {
          area: string
          can_edit?: boolean
          created_at?: string
          editors?: string[] | null
          user_id: string
          viewers?: string[] | null
        }
        Update: {
          area?: string
          can_edit?: boolean
          created_at?: string
          editors?: string[] | null
          user_id?: string
          viewers?: string[] | null
        }
        Relationships: []
      }
      flow_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      flow_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flow_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "flow_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      friction_items: {
        Row: {
          category: string
          created_at: string
          description: string | null
          frequency: number
          id: string
          impact: number
          mental_load: number
          reporter_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          frequency?: number
          id?: string
          impact?: number
          mental_load?: number
          reporter_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          frequency?: number
          id?: string
          impact?: number
          mental_load?: number
          reporter_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      friction_votes: {
        Row: {
          created_at: string
          item_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          item_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friction_votes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "friction_items"
            referencedColumns: ["id"]
          },
        ]
      }
      household_events: {
        Row: {
          created_at: string
          date: string
          household_id: string
          id: number
          member_id: string
          time: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          household_id: string
          id?: never
          member_id?: string
          time?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          household_id?: string
          id?: never
          member_id?: string
          time?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_events_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      household_members: {
        Row: {
          color: string
          created_at: string
          display_name: string
          household_id: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          display_name: string
          household_id: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          display_name?: string
          household_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      household_shopping_items: {
        Row: {
          completed: boolean
          created_at: string
          created_by: string
          household_id: string
          id: number
          title: string
          updated_at: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          created_by?: string
          household_id: string
          id?: never
          title: string
          updated_at?: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          created_by?: string
          household_id?: string
          id?: never
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_shopping_items_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string
          created_by: string
          id: string
          invite_code: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          invite_code?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          invite_code?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_delivery_log: {
        Row: {
          created_at: string
          endpoint_host: string
          endpoint_tail: string
          id: number
          ref: string | null
          result: string
          source: string
          tag: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          endpoint_host: string
          endpoint_tail: string
          id?: never
          ref?: string | null
          result: string
          source: string
          tag?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          endpoint_host?: string
          endpoint_tail?: string
          id?: never
          ref?: string | null
          result?: string
          source?: string
          tag?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      push_preferences: {
        Row: {
          last_lat: number | null
          last_lon: number | null
          last_personal_sent_on: string | null
          last_weather_check_at: string | null
          loops_enabled: boolean
          medication_enabled: boolean
          personal_enabled: boolean
          personal_evening_enabled: boolean
          personal_evening_time: string
          personal_name: string | null
          personal_time: string
          tasks_enabled: boolean
          updated_at: string
          user_id: string
          wake_ack_on: string | null
          wake_enabled: boolean
          wake_interval_min: number
          wake_last_sent_at: string | null
          wake_max_followups: number
          wake_stage: number
          wake_started_on: string | null
          wake_time: string
          weather_enabled: boolean
          weather_time: string
        }
        Insert: {
          last_lat?: number | null
          last_lon?: number | null
          last_personal_sent_on?: string | null
          last_weather_check_at?: string | null
          loops_enabled?: boolean
          medication_enabled?: boolean
          personal_enabled?: boolean
          personal_evening_enabled?: boolean
          personal_evening_time?: string
          personal_name?: string | null
          personal_time?: string
          tasks_enabled?: boolean
          updated_at?: string
          user_id: string
          wake_ack_on?: string | null
          wake_enabled?: boolean
          wake_interval_min?: number
          wake_last_sent_at?: string | null
          wake_max_followups?: number
          wake_stage?: number
          wake_started_on?: string | null
          wake_time?: string
          weather_enabled?: boolean
          weather_time?: string
        }
        Update: {
          last_lat?: number | null
          last_lon?: number | null
          last_personal_sent_on?: string | null
          last_weather_check_at?: string | null
          loops_enabled?: boolean
          medication_enabled?: boolean
          personal_enabled?: boolean
          personal_evening_enabled?: boolean
          personal_evening_time?: string
          personal_name?: string | null
          personal_time?: string
          tasks_enabled?: boolean
          updated_at?: string
          user_id?: string
          wake_ack_on?: string | null
          wake_enabled?: boolean
          wake_interval_min?: number
          wake_last_sent_at?: string | null
          wake_max_followups?: number
          wake_stage?: number
          wake_started_on?: string | null
          wake_time?: string
          weather_enabled?: boolean
          weather_time?: string
        }
        Relationships: []
      }
      push_reminders: {
        Row: {
          body: string
          canceled_at: string | null
          client_key: string
          created_at: string
          deliver_at: string
          delivered_at: string | null
          id: string
          kind: string
          title: string
          url: string | null
          user_id: string
        }
        Insert: {
          body: string
          canceled_at?: string | null
          client_key: string
          created_at?: string
          deliver_at: string
          delivered_at?: string | null
          id?: string
          kind: string
          title: string
          url?: string | null
          user_id: string
        }
        Update: {
          body?: string
          canceled_at?: string | null
          client_key?: string
          created_at?: string
          deliver_at?: string
          delivered_at?: string | null
          id?: string
          kind?: string
          title?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_seen_at: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_seen_at?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_seen_at?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_kv: {
        Row: {
          key: string
          updated_at: string
          user_id: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          user_id: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          user_id?: string
          value?: Json
        }
        Relationships: []
      }
      user_kv_revisions: {
        Row: {
          archived_at: string
          id: number
          key: string
          operation: string
          source_updated_at: string | null
          user_id: string
          value: Json
        }
        Insert: {
          archived_at?: string
          id?: number
          key: string
          operation: string
          source_updated_at?: string | null
          user_id: string
          value: Json
        }
        Update: {
          archived_at?: string
          id?: number
          key?: string
          operation?: string
          source_updated_at?: string | null
          user_id?: string
          value?: Json
        }
        Relationships: []
      }
      user_last_active: {
        Row: {
          last_active_at: string
          user_id: string
        }
        Insert: {
          last_active_at?: string
          user_id: string
        }
        Update: {
          last_active_at?: string
          user_id?: string
        }
        Relationships: []
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
      admin_account_activity: {
        Args: never
        Returns: {
          active_30d: number
          active_7d: number
          unconfirmed: number
        }[]
      }
      admin_used_activity: {
        Args: never
        Returns: {
          used_1d: number
          used_30d: number
          used_7d: number
        }[]
      }
      admin_user_stats: {
        Args: never
        Returns: {
          new_users_7d: number
          signups: Json
          total_users: number
        }[]
      }
      can_edit_family_area: {
        Args: { _area: string; _owner: string; _uid: string }
        Returns: boolean
      }
      can_read_child_doc: {
        Args: { _path: string; _user_id: string }
        Returns: boolean
      }
      can_view_child: {
        Args: { _child_id: string; _user_id: string }
        Returns: boolean
      }
      can_view_child_item: {
        Args: { _item_id: string; _user_id: string }
        Returns: boolean
      }
      child_item_owner: { Args: { _item_id: string }; Returns: string }
      child_owner: { Args: { _child_id: string }; Returns: string }
      create_household: {
        Args: { _color: string; _display_name: string; _name: string }
        Returns: string
      }
      family_edit_shared: {
        Args: {
          _area: string
          _item_id: string
          _op: string
          _owner: string
          _title: string
        }
        Returns: undefined
      }
      get_family_share_permissions: {
        Args: never
        Returns: {
          area: string
          can_edit: boolean
          owner_id: string
        }[]
      }
      get_family_shared_data: {
        Args: never
        Returns: {
          area: string
          color: string
          display_name: string
          key: string
          owner_id: string
          value: Json
        }[]
      }
      get_friction_board: {
        Args: never
        Returns: {
          category: string
          created_at: string
          description: string
          frequency: number
          has_voted: boolean
          id: string
          impact: number
          is_mine: boolean
          mental_load: number
          status: string
          title: string
          updated_at: string
          vote_count: number
        }[]
      }
      get_my_child_profiles: {
        Args: never
        Returns: {
          avatar: string
          birthdate: string
          color: string
          id: string
          name: string
          owner_id: string
        }[]
      }
      get_my_child_schedule: {
        Args: never
        Returns: {
          child_id: string
          completed: boolean
          created_at: string
          date: string
          file_path: string
          id: string
          kind: string
          notes: string
          owner_id: string
          repeat: string
          time: string
          title: string
          updated_at: string
        }[]
      }
      get_my_shared_child_items: {
        Args: never
        Returns: {
          child_id: string
          completed: boolean
          created_at: string
          date: string
          file_path: string
          id: string
          kind: string
          notes: string
          owner_id: string
          repeat: string
          time: string
          title: string
          updated_at: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_child_account_of_owner: {
        Args: { _owner: string; _uid: string }
        Returns: boolean
      }
      is_household_member: {
        Args: { _household_id: string; _user_id: string }
        Returns: boolean
      }
      join_household_by_code: {
        Args: { _code: string; _color: string; _display_name: string }
        Returns: string
      }
      same_household: { Args: { _a: string; _b: string }; Returns: boolean }
      set_child_item_share_notify: {
        Args: { _item_id: string; _notify: boolean; _user_id: string }
        Returns: undefined
      }
      share_child_item: {
        Args: { _item_id: string; _user_ids: string[] }
        Returns: undefined
      }
      touch_last_active: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
    },
  },
} as const
