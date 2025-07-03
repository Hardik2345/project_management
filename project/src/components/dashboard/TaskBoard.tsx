import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { Filter, Plus, AlertTriangle, CheckCircle, Clock, User } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { format, isBefore, isToday } from 'date-fns';
import { supabase } from '../../lib/supabase';

interface TaskBoardProps {
  onFilterChange?: (filters: any) => void;
}

export function TaskBoard({ onFilterChange }: TaskBoardProps) {
  const { state, dispatch } = useApp();
  const { profile: currentUser } = useAuth();
  const [filters, setFilters] = useState({
    priority: 'all',
    tags: 'all',
    assignee: 'all',
    project: 'all'
  });

  const statusColumns = [
    { id: 'todo', title: 'To Do', color: 'bg-blue-50 border-blue-200', count: 0 },
    { id: 'in_progress', title: 'In Progress', color: 'bg-yellow-50 border-yellow-200', count: 0 },
    { id: 'review', title: 'Review', color: 'bg-purple-50 border-purple-200', count: 0 },
    { id: 'done', title: 'Done', color: 'bg-green-50 border-green-200', count: 0 },
  ];

  // Filter tasks based on current filters
  const filteredTasks = state.tasks.filter(task => {
    const matchesPriority = filters.priority === 'all' || task.priority === filters.priority;
    const matchesAssignee = filters.assignee === 'all' || task.assignee_id === filters.assignee;
    const matchesProject = filters.project === 'all' || task.project_id === filters.project;
    // For tags, we'd need to add tags to tasks in the database schema
    return matchesPriority && matchesAssignee && matchesProject;
  });

  // Update column counts
  statusColumns.forEach(column => {
    column.count = filteredTasks.filter(task => task.status === column.id).length;
  });

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId)
        .select(`
          *,
          assignee:profiles!tasks_assignee_id_fkey(*),
          project:projects(*),
          subtasks(*)
        `)
        .single();

      if (error) throw error;
      dispatch({ type: 'UPDATE_TASK', payload: data });
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleFilterChange = (filterType: string, value: string) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  // Get unique tags from projects (since tasks don't have tags in current schema)
  const availableTags = Array.from(new Set(
    state.projects.flatMap(project => project.tags || [])
  ));

  const TaskCard = ({ task }: { task: any }) => {
    const assignee = task.assignee || state.profiles.find(u => u.id === task.assignee_id);
    const project = task.project || state.projects.find(p => p.id === task.project_id);
    const isOverdue = task.due_date && isBefore(new Date(task.due_date), new Date()) && task.status !== 'done';
    const isDueToday = task.due_date && isToday(new Date(task.due_date));

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <h4 className="font-medium text-gray-900 text-sm leading-tight">{task.title}</h4>
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleStatusChange(task.id, task.status === 'done' ? 'in_progress' : 'done')}
                className="p-1 text-gray-400 hover:text-green-600 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Priority and Status Indicators */}
          <div className="flex items-center space-x-2">
            <Badge variant={
              task.priority === 'critical' ? 'danger' :
              task.priority === 'high' ? 'warning' :
              task.priority === 'medium' ? 'info' : 'secondary'
            } size="sm">
              {task.priority}
            </Badge>
            {isOverdue && (
              <Badge variant="danger" size="sm">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Overdue
              </Badge>
            )}
            {isDueToday && !isOverdue && (
              <Badge variant="warning" size="sm">
                Due Today
              </Badge>
            )}
          </div>

          {/* Project and Tags */}
          <div className="space-y-2">
            <div className="text-xs text-gray-600">{project?.name}</div>
            {project?.tags && project.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {project.tags.slice(0, 2).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md"
                  >
                    {tag}
                  </span>
                ))}
                {project.tags.length > 2 && (
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md">
                    +{project.tags.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              {assignee?.avatar ? (
                <img
                  src={assignee.avatar}
                  alt={assignee.name}
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                  <User className="w-3 h-3 text-gray-600" />
                </div>
              )}
              <span className="text-xs text-gray-600">{assignee?.name}</span>
            </div>
            {task.due_date && (
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{format(new Date(task.due_date), 'MMM d')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filters</h3>
          </div>
          <Button size="sm" icon={Plus}>
            New Task
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Priority:</label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Tags:</label>
            <select
              value={filters.tags}
              onChange={(e) => handleFilterChange('tags', e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All</option>
              {availableTags.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Assignee:</label>
            <select
              value={filters.assignee}
              onChange={(e) => handleFilterChange('assignee', e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All</option>
              {state.profiles.filter(u => u.role !== 'client').map((user) => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Project:</label>
            <select
              value={filters.project}
              onChange={(e) => handleFilterChange('project', e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All</option>
              {state.projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statusColumns.map((column) => {
          const columnTasks = filteredTasks.filter(task => task.status === column.id);
          
          return (
            <div key={column.id} className="space-y-4">
              <div className={`${column.color} rounded-lg p-4 border-2`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{column.title}</h3>
                  <Badge variant="secondary" size="sm">{column.count}</Badge>
                </div>
              </div>
              
              <div className="space-y-3 min-h-[400px]">
                {columnTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {columnTasks.length === 0 && (
                  <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-500">No tasks</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}