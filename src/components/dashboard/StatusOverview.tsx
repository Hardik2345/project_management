import React, { useEffect, useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { apiClient } from '../../lib/api';
import { AlertTriangle, CheckCircle, Clock, Target, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { isBefore, isThisWeek } from 'date-fns';

export function StatusOverview() {
  const { state, currentUser } = useApp();
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Load dashboard stats from backend
  useEffect(() => {
    const loadStats = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      try {
        const stats = await apiClient.getDashboardStats();
        setDashboardStats(stats);
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
        // Fallback to calculating from local state
        calculateLocalStats();
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [currentUser, state.tasks]);

  const calculateLocalStats = () => {
    // Get user's tasks
    const userTasks = state.tasks.filter(task => task.assignee_id === currentUser?.id);
    
    // Calculate metrics
    const totalTasks = userTasks.length;
    const completedTasks = userTasks.filter(task => task.status === 'done').length;
    const overdueTasks = userTasks.filter(task => 
      task.due_date && 
      isBefore(new Date(task.due_date), new Date()) && 
      task.status !== 'done'
    ).length;

    setDashboardStats({
      totalTasks,
      completedTasks,
      overdueTasks,
      atRiskTasks: 0 // This would need more complex calculation
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!dashboardStats) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <div className="text-center text-gray-500">
          Unable to load dashboard statistics
        </div>
      </div>
    );
  }

  const atRiskTasks = state.tasks.filter(task => {
    if (!task.due_date || task.status === 'done') return false;
    const daysUntilDue = Math.ceil((new Date(task.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 2 && daysUntilDue >= 0;
  }).length;

  // Sprint completion (mock calculation)
  const sprintTasks = state.tasks.filter(task => 
    task.created_at && isThisWeek(new Date(task.created_at))
  );
  const sprintCompletion = sprintTasks.length > 0 
    ? Math.round((sprintTasks.filter(task => task.status === 'done').length / sprintTasks.length) * 100)
    : 0;

  // Weekly progress comparison (mock data)
  const weeklyProgress = {
    current: dashboardStats.completedTasks,
    previous: Math.max(0, dashboardStats.completedTasks - 3),
    trend: 'up' as 'up' | 'down'
  };

  const metrics = [
    {
      title: 'Total Assigned',
      value: dashboardStats.totalTasks,
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      description: 'Active tasks'
    },
    {
      title: 'At Risk',
      value: atRiskTasks + dashboardStats.overdueTasks,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      description: `${dashboardStats.overdueTasks} overdue, ${atRiskTasks} due soon`,
      alert: (atRiskTasks + dashboardStats.overdueTasks) > 0
    },
    {
      title: 'Completion Rate',
      value: `${dashboardStats.totalTasks > 0 ? Math.round((dashboardStats.completedTasks / dashboardStats.totalTasks) * 100) : 0}%`,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      description: `${dashboardStats.completedTasks} of ${dashboardStats.totalTasks} completed`,
      progress: dashboardStats.totalTasks > 0 ? (dashboardStats.completedTasks / dashboardStats.totalTasks) * 100 : 0
    },
    {
      title: 'Sprint Progress',
      value: `${sprintCompletion}%`,
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      description: 'Current sprint completion',
      progress: sprintCompletion
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Status Overview</h3>
        <div className="flex items-center space-x-1">
          {weeklyProgress.trend === 'up' ? (
            <TrendingUp className="w-4 h-4 text-green-600" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-600" />
          )}
          <span className="text-xs text-gray-600">
            {weeklyProgress.current > weeklyProgress.previous ? '+' : ''}
            {weeklyProgress.current - weeklyProgress.previous} this week
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className={`relative p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-sm ${
              metric.alert ? 'border-red-200 bg-red-50' : `${metric.borderColor} ${metric.bgColor}`
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <metric.icon className={`w-4 h-4 ${metric.color}`} />
              </div>
              {metric.alert && (
                <Badge variant="danger" size="sm">
                  Alert
                </Badge>
              )}
            </div>
            
            <div className="space-y-1">
              <div className="text-xl font-bold text-gray-900">{metric.value}</div>
              <div className="text-sm font-medium text-gray-700">{metric.title}</div>
              <div className="text-xs text-gray-500">{metric.description}</div>
            </div>

            {/* Progress bar for completion metrics */}
            {metric.progress !== undefined && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      metric.title.includes('Sprint') ? 'bg-purple-600' : 'bg-green-600'
                    }`}
                    style={{ width: `${metric.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      {(dashboardStats.overdueTasks > 0 || atRiskTasks > 0) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900">Quick Actions</h4>
            <div className="space-y-1">
              {dashboardStats.overdueTasks > 0 && (
                <button className="text-xs text-red-600 hover:text-red-800 font-medium block">
                  Review {dashboardStats.overdueTasks} overdue task{dashboardStats.overdueTasks > 1 ? 's' : ''}
                </button>
              )}
              {atRiskTasks > 0 && (
                <button className="text-xs text-orange-600 hover:text-orange-800 font-medium block">
                  Check {atRiskTasks} at-risk task{atRiskTasks > 1 ? 's' : ''}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}