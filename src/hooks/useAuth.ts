import { useEffect, useState } from 'react';
import { apiClient } from '../lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'project_manager' | 'team_member' | 'client';
  avatar?: string;
  weekly_capacity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const getInitialUser = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        const userData = await apiClient.getCurrentUser();
        
        if (mounted) {
          setUser(userData);
          setProfile(userData);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error getting current user:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialUser();

    return () => {
      mounted = false;
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password);
      apiClient.setToken(response.token);
      setUser(response.user);
      setProfile(response.user);
      return { data: response, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const response = await apiClient.register(name, email, password);
      apiClient.setToken(response.token);
      setUser(response.user);
      setProfile(response.user);
      return { data: response, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  };

  const signOut = async () => {
    try {
      apiClient.clearToken();
      setUser(null);
      setProfile(null);
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message } };
    }
  };

  return {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
  };
}