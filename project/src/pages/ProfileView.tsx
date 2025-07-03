import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Calendar, 
  Clock, 
  BarChart3, 
  CheckCircle, 
  Target, 
  TrendingUp,
  Edit,
  Shield,
  MapPin,
  Phone,
  Globe,
  Award,
  Activity,
  FolderOpen,
  MessageCircle,
  Settings
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { format, startOfMonth, endOfMonth, subMonths, isThisMonth } from 'date-fns';

export function ProfileView() {
  const { memberId, userId } = useParams<{ memberId?: string; userId?: string }>();
  const navigate = useNavigate();
  const { state, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState('overview');

  const profileId = memberId || userId;
  const profile = state.profiles.find(p => p.id === profileId);
  const isOwnProfile = currentUser?.id === profileId;
  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'project_manager' || isOwnProfile;

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile not found</h2>
          <p className="text-gray-600 mb-4">The user profile you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/team')} variant="outline">
            Back to Team
          </Button>
        </div>
      </div>
    );
  }

  // Calculate user statistics
  const getUserStats = () => {
    const userTasks = state.tasks.filter(t => t.assignee_id === profile.id);
    const completedTasks = userTasks.filter(t => t.status === 'done').length;
    const activeTasks = userTasks.filter(t => t.status === 'in_progress').length;
    const totalTasks = userTasks.length;
    
    const userProjects = state.projects.filter(p => 
      p.owner_id === profile.id || 
      userTasks.some(t => t.project_id === p.id)
    );
    
    const userTimeEntries = state.timeEntries.filter(te => te.user_id === profile.id);
    const totalHours = userTimeEntries.reduce((sum, te) => sum + te.duration, 0) / 60;
    
    // This month's hours
    const thisMonthEntries = userTimeEntries.filter(te => 
      isThisMonth(new Date(te.date))
    );
    const thisMonthHours = thisMonthEntries.reduce((sum, te) => sum + te.duration, 0) / 60;
    
    // Last month's hours for comparison
    const lastMonth = subMonths(new Date(), 1);
    const lastMonthStart = startOfMonth(lastMonth);
    const lastMonthEnd = endOfMonth(lastMonth);
    const lastMonthEntries = userTimeEntries.filter(te => {
      const entryDate = new Date(te.date);
      return entryDate >= lastMonthStart && entryDate <= lastMonthEnd;
    });
    const lastMonthHours = lastMonthEntries.reduce((sum, te) => sum + te.duration, 0) / 60;
    
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    return {
      totalTasks,
      completedTasks,
      activeTasks,
      totalProjects: userProjects.length,
      totalHours: Math.round(totalHours),
      thisMonthHours: Math.round(thisMonthHours * 10) / 10,
      lastMonthHours: Math.round(lastMonthHours * 10) / 10,
      completionRate: Math.round(completionRate),
      userProjects,
      userTasks: userTasks.slice(0, 5), // Recent tasks
    };
  };

  const stats = getUserStats();

  // Get recent activity
  const getRecentActivity = () => {
    const activities = [];
    
    // Recent task updates
    const recentTasks = state.tasks
      .filter(t => t.assignee_id === profile.id)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 3);
    
    recentTasks.forEach(task => {
      const project = state.projects.find(p => p.id === task.project_id);
      activities.push({
        type: 'task',
        title: `Updated task "${task.title}"`,
        subtitle: project?.name,
        date: task.updated_at,
        status: task.status,
      });
    });
    
    // Recent time entries
    const recentTimeEntries = state.timeEntries
      .filter(te => te.user_id === profile.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 2);
    
    recentTimeEntries.forEach(entry => {
      const task = state.tasks.find(t => t.id === entry.task_id);
      const project = state.projects.find(p => p.id === entry.project_id);
      activities.push({
        type: 'time',
        title: `Logged ${Math.round(entry.duration / 60 * 10) / 10} hours`,
        subtitle: `${task?.title} • ${project?.name}`,
        date: entry.created_at,
        duration: entry.duration,
      });
    });
    
    return activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);
  };

  const recentActivity = getRecentActivity();

  const tabs = [
    { id: 'overview', name: 'Overview', icon: User },
    { id: 'projects', name: 'Projects', icon: FolderOpen },
    { id: 'activity', name: 'Activity', icon: Activity },
  ];

  const handleEdit = () => {
    if (isOwnProfile) {
      navigate('/settings');
    } else {
      // In a real app, this would open an edit modal or navigate to edit page
      console.log('Edit profile:', profile.name);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
          <button
            onClick={() => navigate('/team')}
            className="hover:text-gray-700 transition-colors"
          >
            Team
          </button>
          <span>›</span>
          <span className="text-gray-900 font-medium">{profile.name}</span>
          <span>›</span>
          <span>Profile</span>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              {/* Back Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/team')}
                icon={ArrowLeft}
                className="p-2"
              />
              
              {/* Profile Picture and Basic Info */}
              <div className="flex items-center space-x-4">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-20 h-20 rounded-full object-cover ring-4 ring-gray-100"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center ring-4 ring-gray-100">
                    <User className="w-10 h-10 text-gray-600" />
                  </div>
                )}
                
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                  <div className="flex items-center space-x-3 mt-1">
                    <Badge variant={
                      profile.role === 'admin' ? 'danger' :
                      profile.role === 'project_manager' ? 'warning' : 'info'
                    }>
                      <Shield className="w-3 h-3 mr-1" />
                      {profile.role.replace('_', ' ')}
                    </Badge>
                    <Badge variant={profile.is_active ? 'success' : 'secondary'}>
                      {profile.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-1" />
                      {profile.email}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {profile.weekly_capacity}h/week
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Joined {format(new Date(profile.created_at), 'MMM yyyy')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {canEdit && (
                <Button
                  onClick={handleEdit}
                  icon={isOwnProfile ? Settings : Edit}
                  variant="outline"
                >
                  {isOwnProfile ? 'Settings' : 'Edit Profile'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-blue-500 rounded-lg p-3">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTasks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-green-500 rounded-lg p-3">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedTasks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-purple-500 rounded-lg p-3">
                <FolderOpen className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Projects</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-orange-500 rounded-lg p-3">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Hours</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalHours}h</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.name}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Performance Metrics */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Completion Rate */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">Task Completion Rate</h4>
                          <span className="text-2xl font-bold text-green-600">{stats.completionRate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${stats.completionRate}%` }}
                          />
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          {stats.completedTasks} of {stats.totalTasks} tasks completed
                        </p>
                      </div>

                      {/* Monthly Hours Comparison */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">This Month</h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl font-bold text-blue-600">{stats.thisMonthHours}h</span>
                            {stats.thisMonthHours > stats.lastMonthHours ? (
                              <TrendingUp className="w-4 h-4 text-green-500" />
                            ) : (
                              <TrendingUp className="w-4 h-4 text-red-500 transform rotate-180" />
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">
                          {stats.thisMonthHours > stats.lastMonthHours ? '+' : ''}
                          {Math.round((stats.thisMonthHours - stats.lastMonthHours) * 10) / 10}h vs last month
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Recent Tasks */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Tasks</h3>
                    <div className="space-y-3">
                      {stats.userTasks.map((task) => {
                        const project = state.projects.find(p => p.id === task.project_id);
                        return (
                          <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{task.title}</h4>
                              <p className="text-sm text-gray-600">{project?.name}</p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Badge variant={
                                task.priority === 'critical' ? 'danger' :
                                task.priority === 'high' ? 'warning' :
                                task.priority === 'medium' ? 'info' : 'secondary'
                              } size="sm">
                                {task.priority}
                              </Badge>
                              <Badge variant={
                                task.status === 'done' ? 'success' :
                                task.status === 'in_progress' ? 'info' :
                                task.status === 'review' ? 'warning' : 'secondary'
                              } size="sm">
                                {task.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                      {stats.userTasks.length === 0 && (
                        <p className="text-gray-500 text-center py-4">No tasks assigned</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                  {/* Contact Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{profile.email}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">
                          Member since {format(new Date(profile.created_at), 'MMMM yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">
                          {profile.weekly_capacity} hours per week
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Active Tasks</span>
                        <span className="text-sm font-medium text-gray-900">{stats.activeTasks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Projects Involved</span>
                        <span className="text-sm font-medium text-gray-900">{stats.totalProjects}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Completion Rate</span>
                        <span className="text-sm font-medium text-gray-900">{stats.completionRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">This Month Hours</span>
                        <span className="text-sm font-medium text-gray-900">{stats.thisMonthHours}h</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Projects Tab */}
            {activeTab === 'projects' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Projects</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.userProjects.map((project) => {
                    const projectTasks = state.tasks.filter(t => t.project_id === project.id && t.assignee_id === profile.id);
                    const completedProjectTasks = projectTasks.filter(t => t.status === 'done').length;
                    const progress = projectTasks.length > 0 ? (completedProjectTasks / projectTasks.length) * 100 : 0;
                    
                    return (
                      <div key={project.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-medium text-gray-900">{project.name}</h4>
                          <Badge variant={
                            project.status === 'completed' ? 'success' :
                            project.status === 'in_progress' ? 'info' :
                            project.status === 'on_hold' ? 'warning' : 'secondary'
                          } size="sm">
                            {project.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-medium">{Math.round(progress)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>{completedProjectTasks}/{projectTasks.length} tasks</span>
                            {project.deadline && (
                              <span>Due {format(new Date(project.deadline), 'MMM d')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {stats.userProjects.length === 0 && (
                    <div className="col-span-full text-center py-8">
                      <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No projects assigned</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.type === 'task' ? 'bg-blue-100' : 'bg-green-100'
                      }`}>
                        {activity.type === 'task' ? (
                          <CheckCircle className={`w-4 h-4 ${
                            activity.type === 'task' ? 'text-blue-600' : 'text-green-600'
                          }`} />
                        ) : (
                          <Clock className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        {activity.subtitle && (
                          <p className="text-sm text-gray-600">{activity.subtitle}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {format(new Date(activity.date), 'MMM d, h:mm a')}
                        </p>
                      </div>
                      {activity.status && (
                        <Badge variant={
                          activity.status === 'done' ? 'success' :
                          activity.status === 'in_progress' ? 'info' :
                          activity.status === 'review' ? 'warning' : 'secondary'
                        } size="sm">
                          {activity.status.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                  ))}
                  {recentActivity.length === 0 && (
                    <div className="text-center py-8">
                      <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No recent activity</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}