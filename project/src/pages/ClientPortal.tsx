import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../hooks/useAuth';
import { 
  FolderOpen, 
  CheckSquare, 
  Clock, 
  FileText, 
  Calendar,
  BarChart3,
  TrendingUp,
  DollarSign,
  Download,
  Eye
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export function ClientPortal() {
  const { state } = useApp();
  const { profile: currentUser } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');

  // For demo purposes, we'll show all data. In a real app, clients would only see their own data
  const isClient = currentUser?.role === 'client';

  // Get client's projects (in a real app, this would be filtered by client)
  const clientProjects = state.projects.filter(project => {
    // In a real implementation, you'd filter by the client's ID
    return true; // For demo, show all projects
  });

  // Get time period for filtering
  const getPeriodDates = () => {
    const now = new Date();
    switch (selectedPeriod) {
      case 'current-month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'last-month':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      default:
        return { start: new Date(0), end: new Date() };
    }
  };

  const { start: periodStart, end: periodEnd } = getPeriodDates();

  // Filter time entries for the selected period
  const periodTimeEntries = state.timeEntries.filter(te => {
    const entryDate = new Date(te.date);
    return entryDate >= periodStart && entryDate <= periodEnd;
  });

  // Calculate stats
  const totalHours = periodTimeEntries.reduce((sum, te) => sum + te.duration, 0) / 60;
  const activeProjects = clientProjects.filter(p => p.status === 'in_progress').length;
  const completedTasks = state.tasks.filter(t => 
    clientProjects.some(p => p.id === t.project_id) && t.status === 'done'
  ).length;
  const totalInvoiced = state.invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total, 0);

  // Get project progress
  const getProjectProgress = (projectId: string) => {
    const projectTasks = state.tasks.filter(t => t.project_id === projectId);
    const completedTasks = projectTasks.filter(t => t.status === 'done').length;
    return projectTasks.length > 0 ? (completedTasks / projectTasks.length) * 100 : 0;
  };

  // Get recent activity
  const recentActivity = [
    ...state.tasks
      .filter(t => clientProjects.some(p => p.id === t.project_id))
      .slice(0, 5)
      .map(task => ({
        type: 'task',
        title: `Task "${task.title}" updated`,
        date: task.updated_at || task.created_at,
        project: state.projects.find(p => p.id === task.project_id)?.name,
        status: task.status,
      })),
    ...periodTimeEntries
      .slice(0, 5)
      .map(entry => ({
        type: 'time',
        title: `${Math.round(entry.duration / 60 * 10) / 10} hours logged`,
        date: entry.created_at,
        project: state.projects.find(p => p.id === entry.project_id)?.name,
        description: entry.description,
      }))
  ]
    .sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime())
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Portal</h1>
          <p className="text-gray-600">Track your project progress and team activity</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="current-month">Current Month</option>
            <option value="last-month">Last Month</option>
            <option value="all-time">All Time</option>
          </select>
          <Button variant="outline" icon={Download}>
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-blue-500 rounded-lg p-3">
              <FolderOpen className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Projects</p>
              <p className="text-2xl font-bold text-gray-900">{activeProjects}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-green-500 rounded-lg p-3">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{completedTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-purple-500 rounded-lg p-3">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Hours This Period</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(totalHours)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-orange-500 rounded-lg p-3">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Invoiced</p>
              <p className="text-2xl font-bold text-gray-900">${totalInvoiced.toFixed(0)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Progress */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Project Progress</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {clientProjects.slice(0, 5).map((project) => {
                const progress = getProjectProgress(project.id);
                const projectTasks = state.tasks.filter(t => t.project_id === project.id);
                const completedTasks = projectTasks.filter(t => t.status === 'done').length;
                
                return (
                  <div key={project.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{project.name}</h4>
                        <p className="text-sm text-gray-600">
                          {completedTasks}/{projectTasks.length} tasks completed
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={
                          project.status === 'completed' ? 'success' :
                          project.status === 'in_progress' ? 'info' :
                          project.status === 'on_hold' ? 'warning' : 'secondary'
                        }>
                          {project.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{Math.round(progress)}% complete</span>
                      {project.deadline && (
                        <span>Due {format(new Date(project.deadline), 'MMM d, yyyy')}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.type === 'task' ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    {activity.type === 'task' ? (
                      <CheckSquare className={`w-4 h-4 ${
                        activity.type === 'task' ? 'text-green-600' : 'text-blue-600'
                      }`} />
                    ) : (
                      <Clock className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-600">{activity.project}</p>
                    {activity.description && (
                      <p className="text-xs text-gray-500 mt-1">{activity.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(activity.date || ''), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Time Tracking Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Time Tracking Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Task
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {periodTimeEntries.slice(0, 10).map((entry) => {
                const task = state.tasks.find(t => t.id === entry.task_id);
                const project = state.projects.find(p => p.id === entry.project_id);
                const user = state.profiles.find(u => u.id === entry.user_id);
                const hours = entry.duration / 60;

                return (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(entry.date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {project?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {task?.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {Math.round(hours * 100) / 100}h
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {entry.description}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoices */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Recent Invoices</h3>
          <Button variant="outline" size="sm" icon={Eye}>
            View All
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {state.invoices.slice(0, 5).map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      INV-{invoice.id.slice(-6).toUpperCase()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(invoice.created_at || ''), 'MMM d, yyyy')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(invoice.period_start), 'MMM d')} - {format(new Date(invoice.period_end), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {Math.round(invoice.total_hours * 10) / 10}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${invoice.total.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={
                      invoice.status === 'paid' ? 'success' :
                      invoice.status === 'sent' ? 'warning' : 'secondary'
                    }>
                      {invoice.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button variant="ghost" size="sm" icon={Download} className="p-1" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}