import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { X, Filter, CheckCircle, Clock, AlertTriangle, User } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { format } from 'date-fns';

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  filteredTasks: any[];
}

export function FilterSidebar({ isOpen, onClose, filters, filteredTasks }: FilterSidebarProps) {
  const { state } = useApp();

  if (!isOpen) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'review':
        return <AlertTriangle className="w-4 h-4 text-purple-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'medium':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const activeFilters = Object.entries(filters)
    .filter(([key, value]) => value !== 'all')
    .map(([key, value]) => ({ key, value }));

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl border-l border-gray-200 z-50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filtered Tasks</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} icon={X} className="p-2" />
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Active Filters:</h4>
          <div className="flex flex-wrap gap-2">
            {activeFilters.map(({ key, value }) => (
              <Badge key={`${key}-${value}`} variant="info" size="sm">
                {key}: {value}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} found
          </span>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span>{filteredTasks.filter(t => t.status === 'done').length} completed</span>
            <span>{filteredTasks.filter(t => t.status === 'in_progress').length} in progress</span>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredTasks.map((task) => {
          const assignee = state.profiles.find(u => u.id === task.assignee_id);
          const project = state.projects.find(p => p.id === task.project_id);

          return (
            <div
              key={task.id}
              className={`border-l-4 rounded-lg p-4 transition-all duration-200 hover:shadow-md cursor-pointer ${getPriorityColor(task.priority)}`}
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <h4 className="font-medium text-gray-900 text-sm leading-tight">
                    {task.title}
                  </h4>
                  {getStatusIcon(task.status)}
                </div>

                {/* Project and Priority */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">{project?.name}</span>
                  <Badge variant={
                    task.priority === 'critical' ? 'danger' :
                    task.priority === 'high' ? 'warning' :
                    task.priority === 'medium' ? 'info' : 'secondary'
                  } size="sm">
                    {task.priority}
                  </Badge>
                </div>

                {/* Assignee and Due Date */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    {assignee?.avatar ? (
                      <img
                        src={assignee.avatar}
                        alt={assignee.name}
                        className="w-4 h-4 rounded-full"
                      />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                    <span>{assignee?.name}</span>
                  </div>
                  {task.due_date && (
                    <span>Due {format(new Date(task.due_date), 'MMM d')}</span>
                  )}
                </div>

                {/* Description Preview */}
                {task.description && (
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {task.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Filter className="w-12 h-12 text-gray-300 mb-4" />
            <h4 className="text-sm font-medium text-gray-900 mb-2">No tasks found</h4>
            <p className="text-sm text-gray-500">
              Try adjusting your filters to see more results.
            </p>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button size="sm">
            Export Results
          </Button>
        </div>
      </div>
    </div>
  );
}