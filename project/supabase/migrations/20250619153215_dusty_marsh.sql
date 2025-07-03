/*
  # Tech It! Platform Database Schema

  1. New Tables
    - `profiles` - Extended user profiles with role and capacity info
    - `clients` - Client information and billing rates
    - `projects` - Project management with status, priority, and allocations
    - `tasks` - Task management with subtasks and status tracking
    - `time_entries` - Time tracking for tasks and projects
    - `comments` - Comments on tasks and projects
    - `attachments` - File attachments for projects and tasks
    - `invoices` - Invoice generation and tracking
    - `notifications` - System notifications for users

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Ensure clients can only see their own data
    - Team members can see assigned projects/tasks

  3. Features
    - Real-time subscriptions for collaborative features
    - Automatic timestamps and user tracking
    - Proper foreign key relationships
    - Indexes for performance
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'project_manager', 'team_member', 'client');
CREATE TYPE project_status AS ENUM ('not_started', 'in_progress', 'on_hold', 'completed', 'cancelled');
CREATE TYPE project_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE task_status AS ENUM ('backlog', 'todo', 'in_progress', 'review', 'done');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid');
CREATE TYPE notification_type AS ENUM ('info', 'warning', 'error', 'success');

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'team_member',
  avatar text,
  weekly_capacity integer NOT NULL DEFAULT 40,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  company text NOT NULL,
  hourly_rate decimal(10,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  priority project_priority NOT NULL DEFAULT 'medium',
  status project_status NOT NULL DEFAULT 'not_started',
  deadline timestamptz,
  monthly_hour_allocation integer NOT NULL DEFAULT 40,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Project team members (many-to-many)
CREATE TABLE IF NOT EXISTS project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  assignee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  priority task_priority NOT NULL DEFAULT 'medium',
  status task_status NOT NULL DEFAULT 'backlog',
  estimated_hours decimal(5,2) NOT NULL DEFAULT 1,
  due_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Subtasks table
CREATE TABLE IF NOT EXISTS subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Time entries table
CREATE TABLE IF NOT EXISTS time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  duration integer NOT NULL, -- in minutes
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT comments_parent_check CHECK (
    (task_id IS NOT NULL AND project_id IS NULL) OR 
    (task_id IS NULL AND project_id IS NOT NULL)
  )
);

-- Attachments table
CREATE TABLE IF NOT EXISTS attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  type text NOT NULL,
  size integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT attachments_parent_check CHECK (
    (task_id IS NOT NULL AND project_id IS NULL) OR 
    (task_id IS NULL AND project_id IS NOT NULL)
  )
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_hours decimal(8,2) NOT NULL DEFAULT 0,
  hourly_rate decimal(10,2) NOT NULL DEFAULT 0,
  subtotal decimal(12,2) NOT NULL DEFAULT 0,
  tax decimal(12,2) NOT NULL DEFAULT 0,
  total decimal(12,2) NOT NULL DEFAULT 0,
  status invoice_status NOT NULL DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Invoice project associations
CREATE TABLE IF NOT EXISTS invoice_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE(invoice_id, project_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type notification_type NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_time_entries_user ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_project ON time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_task ON time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can read all profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- RLS Policies for clients
CREATE POLICY "Team members can read all clients" ON clients FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager', 'team_member')));
CREATE POLICY "Admins can manage clients" ON clients FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- RLS Policies for projects
CREATE POLICY "Team members can read assigned projects" ON projects FOR SELECT TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager')) OR
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM project_members WHERE project_id = id AND user_id = auth.uid())
  );
CREATE POLICY "Project managers can manage projects" ON projects FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager')));

-- RLS Policies for project_members
CREATE POLICY "Team members can read project assignments" ON project_members FOR SELECT TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager')) OR
    user_id = auth.uid()
  );
CREATE POLICY "Project managers can manage project assignments" ON project_members FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager')));

-- RLS Policies for tasks
CREATE POLICY "Team members can read assigned tasks" ON tasks FOR SELECT TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager')) OR
    assignee_id = auth.uid() OR
    EXISTS (SELECT 1 FROM project_members WHERE project_id = tasks.project_id AND user_id = auth.uid())
  );
CREATE POLICY "Team members can manage assigned tasks" ON tasks FOR ALL TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager')) OR
    assignee_id = auth.uid()
  );

-- RLS Policies for subtasks
CREATE POLICY "Users can read subtasks of accessible tasks" ON subtasks FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM tasks WHERE id = task_id AND (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager')) OR
    assignee_id = auth.uid() OR
    EXISTS (SELECT 1 FROM project_members WHERE project_id = tasks.project_id AND user_id = auth.uid())
  )));
CREATE POLICY "Users can manage subtasks of assigned tasks" ON subtasks FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM tasks WHERE id = task_id AND (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager')) OR
    assignee_id = auth.uid()
  )));

-- RLS Policies for time_entries
CREATE POLICY "Users can read relevant time entries" ON time_entries FOR SELECT TO authenticated 
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager'))
  );
CREATE POLICY "Users can manage own time entries" ON time_entries FOR ALL TO authenticated 
  USING (user_id = auth.uid());

-- RLS Policies for comments
CREATE POLICY "Users can read comments on accessible content" ON comments FOR SELECT TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager')) OR
    user_id = auth.uid() OR
    (task_id IS NOT NULL AND EXISTS (SELECT 1 FROM tasks WHERE id = task_id AND assignee_id = auth.uid())) OR
    (project_id IS NOT NULL AND EXISTS (SELECT 1 FROM project_members WHERE project_id = comments.project_id AND user_id = auth.uid()))
  );
CREATE POLICY "Users can create comments on accessible content" ON comments FOR INSERT TO authenticated 
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE TO authenticated 
  USING (user_id = auth.uid());

-- RLS Policies for attachments
CREATE POLICY "Users can read attachments on accessible content" ON attachments FOR SELECT TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager')) OR
    user_id = auth.uid() OR
    (task_id IS NOT NULL AND EXISTS (SELECT 1 FROM tasks WHERE id = task_id AND assignee_id = auth.uid())) OR
    (project_id IS NOT NULL AND EXISTS (SELECT 1 FROM project_members WHERE project_id = attachments.project_id AND user_id = auth.uid()))
  );
CREATE POLICY "Users can manage own attachments" ON attachments FOR ALL TO authenticated 
  USING (user_id = auth.uid());

-- RLS Policies for invoices
CREATE POLICY "Admins can manage all invoices" ON invoices FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Project managers can read invoices" ON invoices FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager')));

-- RLS Policies for invoice_projects
CREATE POLICY "Admins can manage invoice projects" ON invoice_projects FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Project managers can read invoice projects" ON invoice_projects FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager')));

-- RLS Policies for notifications
CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT TO authenticated 
  USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE TO authenticated 
  USING (user_id = auth.uid());
CREATE POLICY "System can create notifications" ON notifications FOR INSERT TO authenticated 
  WITH CHECK (true);

-- Create functions for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();