import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../contexts/AppContext';
import { 
  X, 
  Calendar, 
  User, 
  Clock, 
  Flag, 
  Tag, 
  Trash2, 
  Save,
  Plus,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { format } from 'date-fns';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string | null;
}

export function TaskModal({ isOpen, onClose, taskId }: TaskModalProps) {
  const { state, dispatch } = useApp();
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newTag, setNewTag] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  const task = taskId ? state.tasks.find(t => t.id === taskId) : null;
  const project = task ? state.projects.find(p => p.id === task.project_id) : null;
  const assignee = task ? state.profiles.find(u => u.id === task.assignee_id) : null;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'backlog' as const,
    priority: 'medium' as const,
    project_id: '',
    assignee_id: '',
    due_date: '',
    estimated_hours: 1,
    tags: [] as string[],
  });

  // Time tracking data
  const timeEntries = task ? state.timeEntries.filter(te => te.task_id === task.id) : [];
  const loggedHours = timeEntries.reduce((sum, te) => sum + te.duration, 0) / 60;

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        project_id: task.project_id,
        assignee_id: task.assignee_id,
        due_date: task.due_date ? format(new Date(task.due_date), 'yyyy-MM-dd') : '',
        estimated_hours: task.estimated_hours,
        tags: project?.tags || [],
      });
      setHasChanges(false);
    }
  }, [task, project]);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !task) return null;

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      handleInputChange('tags', [...formData.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = async () => {
    if (!task) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const updatedTask = {
        ...task,
        ...formData,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : undefined,
        updated_at: new Date().toISOString(),
      };

      // Update project tags if they changed
      if (project && JSON.stringify(project.tags) !== JSON.stringify(formData.tags)) {
        const updatedProject = {
          ...project,
          tags: formData.tags,
          updated_at: new Date().toISOString(),
        };
        dispatch({ type: 'UPDATE_PROJECT', payload: updatedProject });
      }

      dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
      setHasChanges(false);
      
      // Show success feedback
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      dispatch({
        type: 'SET_TASKS',
        payload: state.tasks.filter(t => t.id !== task.id)
      });
      
      onClose();
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (confirmed) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              task.status === 'done' ? 'bg-green-100' :
              task.status === 'in_progress' ? 'bg-blue-100' :
              task.status === 'review' ? 'bg-purple-100' : 'bg-gray-100'
            }`}>
              <CheckCircle className={`w-5 h-5 ${
                task.status === 'done' ? 'text-green-600' :
                task.status === 'in_progress' ? 'text-blue-600' :
                task.status === 'review' ? 'text-purple-600' : 'text-gray-600'
              }`} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Task Details</h2>
              <p className="text-sm text-gray-600">{project?.name}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {hasChanges && (
              <div className="flex items-center space-x-2 text-amber-600 mr-4">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Unsaved changes</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              icon={X}
              className="p-2"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full text-lg font-semibold px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter task title"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Describe the task in detail..."
              />
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Status & Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="backlog">Backlog</option>
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                {/* Project & Assignee */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project
                    </label>
                    <select
                      value={formData.project_id}
                      onChange={(e) => handleInputChange('project_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {state.projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assignee
                    </label>
                    <select
                      value={formData.assignee_id}
                      onChange={(e) => handleInputChange('assignee_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {state.profiles.filter(u => u.role !== 'client').map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => handleInputChange('due_date', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {isOverdue && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      </div>
                    )}
                  </div>
                  {isOverdue && (
                    <p className="text-sm text-red-600 mt-1">This task is overdue</p>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Hours */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estimated Hours
                    </label>
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={formData.estimated_hours}
                      onChange={(e) => handleInputChange('estimated_hours', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Logged Hours
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                      <span className="text-gray-900 font-medium">{Math.round(loggedHours * 10) / 10}h</span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Time Progress</span>
                    <span>{Math.round((loggedHours / formData.estimated_hours) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        loggedHours > formData.estimated_hours ? 'bg-red-500' :
                        loggedHours > formData.estimated_hours * 0.8 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min((loggedHours / formData.estimated_hours) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="flex items-center space-x-1 px-3 py-1"
                        >
                          <Tag className="w-3 h-3" />
                          <span>{tag}</span>
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                        placeholder="Add a tag"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <Button
                        onClick={handleAddTag}
                        disabled={!newTag.trim()}
                        size="sm"
                        icon={Plus}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Task Info */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <h4 className="text-sm font-medium text-gray-900">Task Information</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>Created: {format(new Date(task.created_at), 'MMM d, yyyy')}</div>
                    <div>Updated: {format(new Date(task.updated_at), 'MMM d, yyyy')}</div>
                    <div>Time entries: {timeEntries.length}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              icon={Trash2}
            >
              Delete Task
            </Button>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handleClose}
            >
              {hasChanges ? 'Cancel' : 'Close'}
            </Button>
            <Button
              onClick={handleSave}
              loading={loading}
              disabled={!hasChanges || !formData.title.trim()}
              icon={Save}
            >
              Save Changes
            </Button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Task</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete "{task.title}"? This will permanently remove the task and all associated time entries.
              </p>
              
              <div className="flex items-center justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  loading={loading}
                  icon={Trash2}
                >
                  Delete Task
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}