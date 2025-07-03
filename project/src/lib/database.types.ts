export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      attachments: {
        Row: {
          created_at: string | null
          id: string
          name: string
          project_id: string | null
          size: number
          task_id: string | null
          type: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          project_id?: string | null
          size: number
          task_id?: string | null
          type: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          project_id?: string | null
          size?: number
          task_id?: string | null
          type?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      clients: {
        Row: {
          company: string
          created_at: string | null
          email: string
          hourly_rate: number
          id: string
          is_active: boolean
          name: string
          updated_at: string | null
        }
        Insert: {
          company: string
          created_at?: string | null
          email: string
          hourly_rate?: number
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string | null
        }
        Update: {
          company?: string
          created_at?: string | null
          email?: string
          hourly_rate?: number
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          project_id: string | null
          task_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          project_id?: string | null
          task_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          project_id?: string | null
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      invoice_projects: {
        Row: {
          id: string
          invoice_id: string
          project_id: string
        }
        Insert: {
          id?: string
          invoice_id: string
          project_id: string
        }
        Update: {
          id?: string
          invoice_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_projects_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      invoices: {
        Row: {
          client_id: string
          created_at: string | null
          hourly_rate: number
          id: string
          period_end: string
          period_start: string
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          tax: number
          total: number
          total_hours: number
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          hourly_rate?: number
          id?: string
          period_end: string
          period_start: string
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax?: number
          total?: number
          total_hours?: number
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          hourly_rate?: number
          id?: string
          period_end?: string
          period_start?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax?: number
          total?: number
          total_hours?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          avatar: string | null
          created_at: string | null
          email: string
          id: string
          is_active: boolean
          name: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
          weekly_capacity: number
        }
        Insert: {
          avatar?: string | null
          created_at?: string | null
          email: string
          id: string
          is_active?: boolean
          name: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          weekly_capacity?: number
        }
        Update: {
          avatar?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          weekly_capacity?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      project_members: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      projects: {
        Row: {
          client_id: string | null
          created_at: string | null
          deadline: string | null
          description: string
          id: string
          monthly_hour_allocation: number
          name: string
          owner_id: string
          priority: Database["public"]["Enums"]["project_priority"]
          status: Database["public"]["Enums"]["project_status"]
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          deadline?: string | null
          description: string
          id?: string
          monthly_hour_allocation?: number
          name: string
          owner_id: string
          priority?: Database["public"]["Enums"]["project_priority"]
          status?: Database["public"]["Enums"]["project_status"]
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string
          id?: string
          monthly_hour_allocation?: number
          name?: string
          owner_id?: string
          priority?: Database["public"]["Enums"]["project_priority"]
          status?: Database["public"]["Enums"]["project_status"]
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      subtasks: {
        Row: {
          completed: boolean
          created_at: string | null
          id: string
          task_id: string
          title: string
        }
        Insert: {
          completed?: boolean
          created_at?: string | null
          id?: string
          task_id: string
          title: string
        }
        Update: {
          completed?: boolean
          created_at?: string | null
          id?: string
          task_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          }
        ]
      }
      tasks: {
        Row: {
          assignee_id: string
          created_at: string | null
          description: string
          due_date: string | null
          estimated_hours: number
          id: string
          priority: Database["public"]["Enums"]["task_priority"]
          project_id: string
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string | null
        }
        Insert: {
          assignee_id: string
          created_at?: string | null
          description: string
          due_date?: string | null
          estimated_hours?: number
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id: string
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string | null
        }
        Update: {
          assignee_id?: string
          created_at?: string | null
          description?: string
          due_date?: string | null
          estimated_hours?: number
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      time_entries: {
        Row: {
          created_at: string | null
          date: string
          description: string
          duration: number
          id: string
          project_id: string
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string
          description: string
          duration: number
          id?: string
          project_id: string
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          description?: string
          duration?: number
          id?: string
          project_id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      invoice_status: "draft" | "sent" | "paid"
      notification_type: "info" | "warning" | "error" | "success"
      project_priority: "low" | "medium" | "high" | "critical"
      project_status: "not_started" | "in_progress" | "on_hold" | "completed" | "cancelled"
      task_priority: "low" | "medium" | "high" | "critical"
      task_status: "backlog" | "todo" | "in_progress" | "review" | "done"
      user_role: "admin" | "project_manager" | "team_member" | "client"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}