export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'project_manager' | 'team_member' | 'client';
  avatar?: string;
  weeklyCapacity: number;
  isActive: boolean;
  createdAt: Date;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  hourlyRate: number;
  isActive: boolean;
  createdAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  clientId?: string;
  ownerId: string;
  teamMemberIds: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'not_started' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  deadline?: Date;
  monthlyHourAllocation: number;
  tags: string[];
  attachments: Attachment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  assigneeId: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
  estimatedHours: number;
  dueDate?: Date;
  subtasks: Subtask[];
  attachments: Attachment[];
  comments: Comment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  projectId: string;
  userId: string;
  date: Date;
  duration: number; // in minutes
  description: string;
  createdAt: Date;
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  createdAt: Date;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  createdAt: Date;
}

export interface Invoice {
  id: string;
  clientId: string;
  projectIds: string[];
  period: {
    start: Date;
    end: Date;
  };
  totalHours: number;
  hourlyRate: number;
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid';
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  createdAt: Date;
}