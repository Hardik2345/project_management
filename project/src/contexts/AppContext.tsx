import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { mockData } from '../utils/mockData';

// Type definitions
type Profile = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'project_manager' | 'team_member' | 'client';
  avatar?: string;
  weekly_capacity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type Client = {
  id: string;
  name: string;
  email: string;
  company: string;
  hourly_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type Project = {
  id: string;
  name: string;
  description: string;
  client_id?: string;
  owner_id: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'not_started' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  deadline?: string;
  monthly_hour_allocation: number;
  tags?: string[];
  created_at: string;
  updated_at: string;
  client?: Client;
  owner?: Profile;
  team_members?: Profile[];
};

type Task = {
  id: string;
  title: string;
  description: string;
  project_id: string;
  assignee_id: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
  estimated_hours: number;
  due_date?: string;
  created_at: string;
  updated_at: string;
  assignee?: Profile;
  project?: Project;
  subtasks?: any[];
};

type TimeEntry = {
  id: string;
  task_id: string;
  project_id: string;
  user_id: string;
  date: string;
  duration: number;
  description: string;
  created_at: string;
};

type Invoice = {
  id: string;
  client_id: string;
  period_start: string;
  period_end: string;
  total_hours: number;
  hourly_rate: number;
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid';
  created_at: string;
  updated_at: string;
  client?: Client;
  projects?: Project[];
};

type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  created_at: string;
};

interface AppState {
  profiles: Profile[];
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  timeEntries: TimeEntry[];
  invoices: Invoice[];
  notifications: Notification[];
  isLoading: boolean;
}

type AppAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PROFILES'; payload: Profile[] }
  | { type: 'SET_CLIENTS'; payload: Client[] }
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'SET_TIME_ENTRIES'; payload: TimeEntry[] }
  | { type: 'SET_INVOICES'; payload: Invoice[] }
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'ADD_TIME_ENTRY'; payload: TimeEntry }
  | { type: 'ADD_CLIENT'; payload: Client }
  | { type: 'UPDATE_CLIENT'; payload: Client }
  | { type: 'ADD_INVOICE'; payload: Invoice }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string };

const initialState: AppState = {
  profiles: [],
  clients: [],
  projects: [],
  tasks: [],
  timeEntries: [],
  invoices: [],
  notifications: [],
  isLoading: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_PROFILES':
      return { ...state, profiles: action.payload };
    case 'SET_CLIENTS':
      return { ...state, clients: action.payload };
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };
    case 'SET_TIME_ENTRIES':
      return { ...state, timeEntries: action.payload };
    case 'SET_INVOICES':
      return { ...state, invoices: action.payload };
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload };
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(p => p.id === action.payload.id ? action.payload : p)
      };
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t)
      };
    case 'ADD_TIME_ENTRY':
      return { ...state, timeEntries: [...state.timeEntries, action.payload] };
    case 'ADD_CLIENT':
      return { ...state, clients: [...state.clients, action.payload] };
    case 'UPDATE_CLIENT':
      return {
        ...state,
        clients: state.clients.map(c => c.id === action.payload.id ? action.payload : c)
      };
    case 'ADD_INVOICE':
      return { ...state, invoices: [...state.invoices, action.payload] };
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => 
          n.id === action.payload ? { ...n, read: true } : n
        )
      };
    default:
      return state;
  }
}

// Mock current user
const mockCurrentUser: Profile = {
  id: '1',
  name: 'Alex Johnson',
  email: 'alex@techit.com',
  role: 'admin',
  avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
  weekly_capacity: 40,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  currentUser: Profile | null;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load mock data on mount
  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    // Simulate loading delay
    setTimeout(() => {
      dispatch({ type: 'SET_PROFILES', payload: mockData.users });
      dispatch({ type: 'SET_CLIENTS', payload: mockData.clients });
      dispatch({ type: 'SET_PROJECTS', payload: mockData.projects });
      dispatch({ type: 'SET_TASKS', payload: mockData.tasks });
      dispatch({ type: 'SET_TIME_ENTRIES', payload: mockData.timeEntries });
      dispatch({ type: 'SET_INVOICES', payload: mockData.invoices });
      dispatch({ type: 'SET_NOTIFICATIONS', payload: mockData.notifications });
      dispatch({ type: 'SET_LOADING', payload: false });
    }, 1000);
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, currentUser: mockCurrentUser }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}