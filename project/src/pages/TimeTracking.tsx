import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  Calendar, 
  Download, 
  Plus, 
  Search,
  Filter,
  ChevronDown,
  Timer,
  BarChart3,
  TrendingUp,
  Edit3,
  Trash2
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isToday, startOfDay, endOfDay } from 'date-fns';

interface ActiveTimer {
  taskId: string;
  projectId: string;
  startTime: Date;
  description: string;
}

export function TimeTracking() {
  const { state, dispatch, currentUser } = useApp();
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [timerDuration, setTimerDuration] = useState(0);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [dateFilter, setDateFilter] = useState('week');
  const [projectFilter, setProjectFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [timerForm, setTimerForm] = useState({
    taskId: '',
    projectId: '',
    description: '',
  });

  const [newTimeEntry, setNewTimeEntry] = useState({
    taskId: '',
    projectId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    duration: 60, // in minutes
    description: '',
  });

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTimer) {
      interval = setInterval(() => {
        setTimerDuration(Math.floor((Date.now() - activeTimer.startTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimer]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const startTimer = () => {
    if (!timerForm.taskId || !timerForm.projectId) return;
    
    setActiveTimer({
      taskId: timerForm.taskId,
      projectId: timerForm.projectId,
      startTime: new Date(),
      description: timerForm.description || 'Timer session',
    });
    setTimerDuration(0);
  };

  const pauseTimer = () => {
    // In a real app, you'd save the current duration and allow resuming
    // For now, we'll just stop the timer
    stopTimer();
  };

  const stopTimer = async () => {
    if (!activeTimer || !currentUser) return;

    const duration = Math.floor((Date.now() - activeTimer.startTime.getTime()) / 1000 / 60); // Convert to minutes

    if (duration > 0) {
      try {
        const newEntry = {
          id: `te${Date.now()}`,
          task_id: activeTimer.taskId,
          project_id: activeTimer.projectId,
          user_id: currentUser.id,
          date: format(new Date(), 'yyyy-MM-dd'),
          duration,
          description: activeTimer.description,
          created_at: new Date().toISOString(),
        };

        dispatch({ type: 'ADD_TIME_ENTRY', payload: newEntry });
      } catch (error) {
        console.error('Error saving time entry:', error);
      }
    }

    setActiveTimer(null);
    setTimerDuration(0);
  };

  const handleLogTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const newEntry = {
        id: `te${Date.now()}`,
        task_id: newTimeEntry.taskId,
        project_id: newTimeEntry.projectId,
        user_id: currentUser.id,
        date: newTimeEntry.date,
        duration: newTimeEntry.duration,
        description: newTimeEntry.description,
        created_at: new Date().toISOString(),
      };

      dispatch({ type: 'ADD_TIME_ENTRY', payload: newEntry });
      setShowLogModal(false);
      setNewTimeEntry({
        taskId: '',
        projectId: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        duration: 60,
        description: '',
      });
    } catch (error) {
      console.error('Error logging time:', error);
    }
  };

  const handleEditEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntry) return;

    try {
      const updatedEntry = {
        ...selectedEntry,
        duration: selectedEntry.duration,
        description: selectedEntry.description,
      };

      dispatch({
        type: 'SET_TIME_ENTRIES',
        payload: state.timeEntries.map(te => te.id === selectedEntry.id ? updatedEntry : te)
      });
      
      setShowEditModal(false);
      setSelectedEntry(null);
    } catch (error) {
      console.error('Error updating time entry:', error);
    }
  };

  const handleDeleteEntry = (entryId: string) => {
    if (window.confirm('Are you sure you want to delete this time entry?')) {
      dispatch({
        type: 'SET_TIME_ENTRIES',
        payload: state.timeEntries.filter(te => te.id !== entryId)
      });
    }
  };

  // Filter time entries
  const getFilteredTimeEntries = () => {
    let filtered = state.timeEntries.filter(te => te.user_id === currentUser?.id);

    // Date filter
    const now = new Date();
    switch (dateFilter) {
      case 'today':
        filtered = filtered.filter(te => isToday(new Date(te.date)));
        break;
      case 'week':
        const weekStart = startOfWeek(now);
        const weekEnd = endOfWeek(now);
        filtered = filtered.filter(te => {
          const date = new Date(te.date);
          return date >= weekStart && date <= weekEnd;
        });
        break;
      case 'month':
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        filtered = filtered.filter(te => {
          const date = new Date(te.date);
          return date >= monthStart && date <= monthEnd;
        });
        break;
    }

    // Project filter
    if (projectFilter !== 'all') {
      filtered = filtered.filter(te => te.project_id === projectFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(te => {
        const task = state.tasks.find(t => t.id === te.task_id);
        const project = state.projects.find(p => p.id === te.project_id);
        return (
          te.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project?.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'duration':
          aValue = a.duration;
          bValue = b.duration;
          break;
        case 'project':
          const aProject = state.projects.find(p => p.id === a.project_id)?.name || '';
          const bProject = state.projects.find(p => p.id === b.project_id)?.name || '';
          aValue = aProject.toLowerCase();
          bValue = bProject.toLowerCase();
          break;
        default:
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  const filteredTimeEntries = getFilteredTimeEntries();
  const totalHours = filteredTimeEntries.reduce((sum, te) => sum + te.duration, 0) / 60;

  // Get available tasks for timer
  const availableTasks = state.tasks.filter(task => 
    task.assignee_id === currentUser?.id && task.status !== 'done'
  );

  // Get project tasks for timer form
  const projectTasks = timerForm.projectId 
    ? state.tasks.filter(task => task.project_id === timerForm.projectId && task.assignee_id === currentUser?.id)
    : [];

  // Weekly summary
  const getWeeklySummary = () => {
    const weekStart = startOfWeek(new Date());
    const weekEnd = endOfWeek(new Date());
    const weekEntries = state.timeEntries.filter(te => {
      const date = new Date(te.date);
      return te.user_id === currentUser?.id && date >= weekStart && date <= weekEnd;
    });

    const projectSummary = weekEntries.reduce((acc, te) => {
      const project = state.projects.find(p => p.id === te.project_id);
      const projectName = project?.name || 'Unknown Project';
      acc[projectName] = (acc[projectName] || 0) + te.duration;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(projectSummary)
      .map(([project, minutes]) => ({ project, hours: minutes / 60 }))
      .sort((a, b) => b.hours - a.hours);
  };

  const weeklySummary = getWeeklySummary();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Time Tracking</h1>
          <p className="text-gray-600 mt-1">Track your time and manage logged entries</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex rounded-lg border border-gray-300">
            <button
              onClick={() => setDateFilter('today')}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                dateFilter === 'today' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateFilter('week')}
              className={`px-3 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
                dateFilter === 'week' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              This Week
            </button>
          </div>
          <Button variant="outline" icon={Download}>
            Export
          </Button>
          <Button onClick={() => setShowLogModal(true)} icon={Plus}>
            Log Manual Time
          </Button>
        </div>
      </div>

      {/* Top Section: Live Timer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timer */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Timer className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Live Timer</h3>
            </div>

            {activeTimer ? (
              /* Active Timer Display */
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold mb-1">Timer Running</h4>
                      <p className="text-blue-100 text-sm mb-1">
                        {state.tasks.find(t => t.id === activeTimer.taskId)?.title}
                      </p>
                      <p className="text-blue-200 text-xs">
                        {state.projects.find(p => p.id === activeTimer.projectId)?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-mono font-bold mb-3">
                        {formatDuration(timerDuration)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={pauseTimer}
                          icon={Pause}
                        >
                          Pause
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={stopTimer}
                          icon={Square}
                        >
                          Stop
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Timer Setup Form */
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project
                    </label>
                    <select
                      value={timerForm.projectId}
                      onChange={(e) => {
                        setTimerForm({ ...timerForm, projectId: e.target.value, taskId: '' });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select project...</option>
                      {state.projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Task
                    </label>
                    <select
                      value={timerForm.taskId}
                      onChange={(e) => setTimerForm({ ...timerForm, taskId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={!timerForm.projectId}
                    >
                      <option value="">Select task...</option>
                      {projectTasks.map((task) => (
                        <option key={task.id} value={task.id}>
                          {task.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    value={timerForm.description}
                    onChange={(e) => setTimerForm({ ...timerForm, description: e.target.value })}
                    placeholder="What are you working on?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex justify-center pt-4">
                  <Button
                    onClick={startTimer}
                    disabled={!timerForm.taskId || !timerForm.projectId}
                    icon={Play}
                    size="lg"
                    className="px-8"
                  >
                    Start Timer
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="space-y-6">
          {/* Time Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Summary</h3>
            </div>
            
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {Math.round(totalHours * 10) / 10}h
                </div>
                <div className="text-sm text-gray-600 capitalize">
                  {dateFilter === 'all' ? 'Total' : dateFilter} Hours
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Entries</span>
                  <span className="font-medium text-gray-900">{filteredTimeEntries.length}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">Avg per day</span>
                  <span className="font-medium text-gray-900">
                    {dateFilter === 'week' ? Math.round((totalHours / 7) * 10) / 10 : Math.round(totalHours * 10) / 10}h
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Project Breakdown */}
          {weeklySummary.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">This Week</h3>
              </div>
              
              <div className="space-y-3">
                {weeklySummary.slice(0, 4).map(({ project, hours }) => (
                  <div key={project} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 truncate flex-1 mr-2">{project}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {Math.round(hours * 10) / 10}h
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Logged Time Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Logged Time Entries</h3>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Projects</option>
                {state.projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order as 'asc' | 'desc');
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date-desc">Date (Newest)</option>
                <option value="date-asc">Date (Oldest)</option>
                <option value="duration-desc">Duration (Longest)</option>
                <option value="duration-asc">Duration (Shortest)</option>
                <option value="project-asc">Project (A-Z)</option>
                <option value="project-desc">Project (Z-A)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
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
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTimeEntries.map((entry) => {
                const task = state.tasks.find(t => t.id === entry.task_id);
                const project = state.projects.find(p => p.id === entry.project_id);

                return (
                  <tr 
                    key={entry.id} 
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedEntry(entry);
                      setShowEditModal(true);
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">
                          {format(new Date(entry.date), 'MMM d, yyyy')}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {format(new Date(entry.created_at), 'h:mm a')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{project?.name}</div>
                      <div className="text-sm text-gray-500">
                        <Badge variant={
                          project?.priority === 'critical' ? 'danger' :
                          project?.priority === 'high' ? 'warning' :
                          project?.priority === 'medium' ? 'info' : 'secondary'
                        } size="sm">
                          {project?.priority}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate">{task?.title}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate">{entry.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatHours(entry.duration)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {Math.round(entry.duration)} min
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEntry(entry);
                            setShowEditModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEntry(entry.id);
                          }}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredTimeEntries.length === 0 && (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-sm font-medium text-gray-900 mb-2">No time entries found</h3>
              <p className="text-sm text-gray-500">
                {searchTerm || projectFilter !== 'all' 
                  ? 'Try adjusting your filters or search terms.'
                  : 'Start tracking time to see your entries here.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Log Manual Time Modal */}
      <Modal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        title="Log Manual Time Entry"
        size="lg"
      >
        <form onSubmit={handleLogTime} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project
              </label>
              <select
                required
                value={newTimeEntry.projectId}
                onChange={(e) => {
                  setNewTimeEntry({ ...newTimeEntry, projectId: e.target.value, taskId: '' });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Project</option>
                {state.projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task
              </label>
              <select
                required
                value={newTimeEntry.taskId}
                onChange={(e) => setNewTimeEntry({ ...newTimeEntry, taskId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!newTimeEntry.projectId}
              >
                <option value="">Select Task</option>
                {state.tasks
                  .filter(task => task.project_id === newTimeEntry.projectId)
                  .map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={newTimeEntry.date}
                onChange={(e) => setNewTimeEntry({ ...newTimeEntry, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                required
                value={newTimeEntry.duration}
                onChange={(e) => setNewTimeEntry({ ...newTimeEntry, duration: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              required
              value={newTimeEntry.description}
              onChange={(e) => setNewTimeEntry({ ...newTimeEntry, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe what you worked on..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowLogModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Log Time</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Time Entry Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Time Entry"
        size="lg"
      >
        {selectedEntry && (
          <form onSubmit={handleEditEntry} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={selectedEntry.duration}
                  onChange={(e) => setSelectedEntry({ ...selectedEntry, duration: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={selectedEntry.date}
                  onChange={(e) => setSelectedEntry({ ...selectedEntry, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                required
                value={selectedEntry.description}
                onChange={(e) => setSelectedEntry({ ...selectedEntry, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Entry Details</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div>Project: {state.projects.find(p => p.id === selectedEntry.project_id)?.name}</div>
                <div>Task: {state.tasks.find(t => t.id === selectedEntry.task_id)?.title}</div>
                <div>Created: {format(new Date(selectedEntry.created_at), 'MMM d, yyyy at h:mm a')}</div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  handleDeleteEntry(selectedEntry.id);
                  setShowEditModal(false);
                }}
                icon={Trash2}
              >
                Delete Entry
              </Button>
              <div className="flex space-x-3">
                <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}