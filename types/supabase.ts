export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      admins: {
        Row: {
          id: number
          user_id: string
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admins_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      check_ins: {
        Row: {
          id: number
          user_id: string
          check_in_date: string
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          check_in_date?: string
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          check_in_date?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          id: number
          post_id: number
          user_id: string
          content: string
          anonymous_name: string
          avatar_seed: string
          created_at: string
        }
        Insert: {
          id?: number
          post_id: number
          user_id: string
          content: string
          anonymous_name?: string
          avatar_seed?: string
          created_at?: string
        }
        Update: {
          id?: number
          post_id?: number
          user_id?: string
          content?: string
          anonymous_name?: string
          avatar_seed?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      hk_lexicon: {
        Row: {
          id: number
          category: string
          term: string
        }
        Insert: {
          id?: number
          category: string
          term: string
        }
        Update: {
          id?: number
          category?: string
          term?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: number
          user_id: string
          type: string
          content: string
          related_id: string | null
          related_type: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          type: string
          content: string
          related_id?: string | null
          related_type?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          type?: string
          content?: string
          related_id?: string | null
          related_type?: string | null
          read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          id: number
          user_id: string
          content: string
          anonymous_name: string
          avatar_seed: string
          district: string | null
          categories: string[] | null
          like_count: number
          comment_count: number
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          content: string
          anonymous_name?: string
          avatar_seed?: string
          district?: string | null
          categories?: string[] | null
          like_count?: number
          comment_count?: number
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          content?: string
          anonymous_name?: string
          avatar_seed?: string
          district?: string | null
          categories?: string[] | null
          like_count?: number
          comment_count?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          id: number
          reporter_id: string
          post_id: number | null
          comment_id: number | null
          reason: string
          status: string
          created_at: string
        }
        Insert: {
          id?: number
          reporter_id: string
          post_id?: number | null
          comment_id?: number | null
          reason: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: number
          reporter_id?: string
          post_id?: number | null
          comment_id?: number | null
          reason?: string
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_comment_id_fkey"
            columns: ["comment_id"]
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_post_id_fkey"
            columns: ["post_id"]
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          id: string
          anonymous_id: string
          vip_expires_at: string | null
          streak_days: number
          location: unknown | null
          created_at: string
        }
        Insert: {
          id: string
          anonymous_id?: string
          vip_expires_at?: string | null
          streak_days?: number
          location?: unknown | null
          created_at?: string
        }
        Update: {
          id?: string
          anonymous_id?: string
          vip_expires_at?: string | null
          streak_days?: number
          location?: unknown | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      execute_sql: {
        Args: {
          sql: string
        }
        Returns: undefined
      }
      find_nearby_vip: {
        Args: {
          lat: number
          lon: number
          radius: number
        }
        Returns: {
          id: string
          anonymous_id: string
          vip_expires_at: string
          streak_days: number
          distance: number
          created_at: string
        }[]
      }
      generate_avatar_seed: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_hk_name: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_streak_days: {
        Args: {
          user_uuid: string
        }
        Returns: number
      }
      get_vip_expiry_date: {
        Args: {
          user_uuid: string
        }
        Returns: string
      }
      has_checked_in_today: {
        Args: {
          user_uuid: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: {
          user_uuid: string
        }
        Returns: boolean
      }
      is_user_vip: {
        Args: {
          user_uuid: string
        }
        Returns: boolean
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
