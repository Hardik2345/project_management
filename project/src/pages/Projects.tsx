import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Users, 
  Calendar, 
  Clock, 
  Edit, 
  Copy, 
  Archive, 
  Trash2,
  X,
  Tag,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  StopCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { format } from 'date-fns';

export function Projects() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [newTag, setNewTag] = useState('');
  
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    client_id: '',
    owner_id: '',
    priority: 'medium' as const,
    status: 'not_started' as const,
    deadline: '',
    monthly_hour_allocation: 40,
    tags: [] as string[],
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (activeDropdown && dropdownRefs.current[activeDropdown]) {
        const dropdownElement = dropdownRefs.current[activeDropdown];
        if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
          setActiveDropdown(null);
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);

  const filteredProjects = state.projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const newProjectData = {
        id: `p${Date.now()}`,
        ...newProject,
        deadline: newProject.deadline ? new Date(newProject.deadline).toISOString() : undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      dispatch({ type: 'ADD_PROJECT', payload: newProjectData });
      setShowCreateModal(false);
      setNewProject({
        name: '',
        description: '',
        client_id: '',
        owner_id: '',
        priority: 'medium',
        status: 'not_started',
        deadline: '',
        monthly_hour_allocation: 40,
        tags: [],
      });
      setNewTag('');
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const handleCardClick = (projectId: string, event: React.MouseEvent) => {
    // Prevent navigation if clicking on the dropdown or its trigger
    const target = event.target as HTMLElement;
    if (target.closest('[data-dropdown-trigger]') || target.closest('[data-dropdown-menu]')) {
      return;
    }
    
    navigate(`/projects/${projectId}/edit`);
  };

  const handleDropdownAction = (action: string, project: any) => {
    setActiveDropdown(null);
    
    switch (action) {
      case 'edit':
        navigate(`/projects/${project.id}/edit`);
        break;
      case 'duplicate':
        const duplicatedProject = {
          ...project,
          id: `p${Date.now()}`,
          name: `${project.name} (Copy)`,
          status: 'not_started' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        dispatch({ type: 'ADD_PROJECT', payload: duplicatedProject });
        break;
      case 'archive':
        const archivedProject = {
          ...project,
          status: 'cancelled' as const,
          updated_at: new Date().toISOString(),
        };
        dispatch({ type: 'UPDATE_PROJECT', payload: archivedProject });
        break;
      case 'delete':
        setSelectedProject(project);
        setShowDeleteModal(true);
        break;
    }
  };

  const handleDeleteProject = () => {
    if (selectedProject) {
      dispatch({
        type: 'SET_PROJECTS',
        payload: state.projects.filter(p => p.id !== selectedProject.id)
      });
      setShowDeleteModal(false);
      setSelectedProject(null);
    }
  };

  const getProjectStats = (projectId: string) => {
    const projectTasks = state.tasks.filter(t => t.project_id === projectId);
    const completedTasks = projectTasks.filter(t => t.status === 'done').length;
    const totalTasks = projectTasks.length;
    const projectTimeEntries = state.timeEntries.filter(te => te.project_id === projectId);
    const totalHours = projectTimeEntries.reduce((sum, te) => sum + te.duration, 0) / 60;
    
    return { completedTasks, totalTasks, totalHours };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'not_started':
        return <StopCircle className="w-4 h-4" />;
      case 'in_progress':
        return <PlayCircle className="w-4 h-4" />;
      case 'on_hold':
        return <PauseCircle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <StopCircle className="w-4 h-4" />;
    }
  };

  // Tag management functions - matching EditProject exactly
  const handleAddTag = () => {
    if (newTag.trim() && !newProject.tags.includes(newTag.trim())) {
      setNewProject(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewProject(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const ActionDropdown = ({ project }: { project: any }) => {
    const isOpen = activeDropdown === project.id;
    
    return (
      <div 
        className="relative" 
        ref={el => dropdownRefs.current[project.id] = el}
        data-dropdown-trigger
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveDropdown(isOpen ? null : project.id);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              setActiveDropdown(isOpen ? null : project.id);
            }
          }}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Project actions"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {isOpen && (
          <div 
            className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50 py-1"
            data-dropdown-menu
          >
            <button
              onClick={() => handleDropdownAction('edit', project)}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Edit className="w-4 h-4 mr-3 text-gray-400" />
              Edit Project
            </button>
            
            <button
              onClick={() => handleDropdownAction('duplicate', project)}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Copy className="w-4 h-4 mr-3 text-gray-400" />
              Duplicate
            </button>
            
            <button
              onClick={() => handleDropdownAction('archive', project)}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Archive className="w-4 h-4 mr-3 text-gray-400" />
              Archive Project
            </button>
            
            <div className="border-t border-gray-100 my-1" />
            
            <button
              onClick={() => handleDropdownAction('delete', project)}
              className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-3 text-red-400" />
              Delete Project
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <Button onClick={() => setShowCreateModal(true)} icon={Plus}>
          New Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {filteredProjects.map((project) => {
          const client = state.clients.find(c => c.id === project.client_id);
          const owner = state.profiles.find(u => u.id === project.owner_id);
          const stats = getProjectStats(project.id);
          const progressPercentage = stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0;
          const hourUsagePercentage = (stats.totalHours / project.monthly_hour_allocation) * 100;

          return (
            <div 
              key={project.id} 
              onClick={(e) => handleCardClick(project.id, e)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer group"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCardClick(project.id, e);
                }
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{project.description}</p>
                  {client && (
                    <p className="text-sm text-gray-500 mb-2">Client: {client.company}</p>
                  )}
                </div>
                <ActionDropdown project={project} />
              </div>

              <div className="flex items-center space-x-2 mb-4">
                <Badge
                  variant={
                    project.status === 'completed' ? 'success' :
                    project.status === 'in_progress' ? 'info' :
                    project.status === 'on_hold' ? 'warning' : 'secondary'
                  }
                  className="flex items-center space-x-1"
                >
                  {getStatusIcon(project.status)}
                  <span>{project.status.replace('_', ' ')}</span>
                </Badge>
                <Badge variant={
                  project.priority === 'critical' ? 'danger' :
                  project.priority === 'high' ? 'warning' :
                  project.priority === 'medium' ? 'info' : 'secondary'
                }>
                  {project.priority}
                </Badge>
              </div>

              <div className="space-y-3">
                {/* Progress */}
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{stats.completedTasks}/{stats.totalTasks} tasks</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Hour Usage */}
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Hour Usage</span>
                    <span>{Math.round(stats.totalHours)}/{project.monthly_hour_allocation}h</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        hourUsagePercentage > 100 ? 'bg-red-500' :
                        hourUsagePercentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(hourUsagePercentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="w-4 h-4 mr-1" />
                  <span>{owner?.name}</span>
                </div>
                {project.deadline && (
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>{format(new Date(project.deadline), 'MMM d, yyyy')}</span>
                  </div>
                )}
              </div>

              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {project.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Project Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Project"
        size="lg"
      >
        <form onSubmit={handleCreateProject} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter project name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  required
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe your project"
                />
              </div>
            </div>
          </div>

          {/* Project Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Project Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client
                </label>
                <select
                  value={newProject.client_id}
                  onChange={(e) => setNewProject({ ...newProject, client_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">No client assigned</option>
                  {state.clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.company}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Owner
                </label>
                <select
                  required
                  value={newProject.owner_id}
                  onChange={(e) => setNewProject({ ...newProject, owner_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Owner</option>
                  {state.profiles.filter(u => u.role !== 'client').map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={newProject.priority}
                  onChange={(e) => setNewProject({ ...newProject, priority: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={newProject.status}
                  onChange={(e) => setNewProject({ ...newProject, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deadline
                </label>
                <input
                  type="date"
                  value={newProject.deadline}
                  onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Hour Allocation
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newProject.monthly_hour_allocation}
                  onChange={(e) => setNewProject({ ...newProject, monthly_hour_allocation: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Tags - Matching EditProject exactly */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Tags</h3>
            
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {newProject.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center space-x-1 px-3 py-1"
                  >
                    <Tag className="w-3 h-3" />
                    <span>{tag}</span>
                    <button
                      type="button"
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
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Button
                  type="button"
                  onClick={handleAddTag}
                  disabled={!newTag.trim()}
                  size="sm"
                >
                  Add Tag
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Project</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Project"
        size="md"
      >
        {selectedProject && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Trash2 className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Delete "{selectedProject.name}"?
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>
                      This will permanently delete the project and all associated tasks, time entries, and comments. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteProject}
                icon={Trash2}
              >
                Delete Project
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}