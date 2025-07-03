import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  BarChart3, 
  Settings, 
  UserPlus,
  Edit,
  Trash2,
  MoreVertical,
  User,
  Shield,
  Users,
  AlertTriangle,
  CheckCircle,
  Eye,
  Filter
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { format } from 'date-fns';

export function TeamManagement() {
  const { state, dispatch, currentUser } = useApp();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    role: 'team_member' as const,
    weekly_capacity: 40,
    department: '',
    projects: [] as string[],
    sendInvite: true,
  });

  const canManageTeam = currentUser?.role === 'admin' || currentUser?.role === 'project_manager';
  const isAdmin = currentUser?.role === 'admin';

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

  const filteredMembers = state.profiles.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && member.is_active) ||
                         (statusFilter === 'inactive' && !member.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageTeam) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newMemberData = {
        id: `u${Date.now()}`,
        ...newMember,
        avatar: '',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      dispatch({ type: 'SET_PROFILES', payload: [...state.profiles, newMemberData] });
      setShowCreateModal(false);
      setNewMember({
        name: '',
        email: '',
        role: 'team_member',
        weekly_capacity: 40,
        department: '',
        projects: [],
        sendInvite: true,
      });
      setMessage({ type: 'success', text: `${newMember.sendInvite ? 'Invitation sent to' : 'Added'} ${newMember.name}` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to add team member' });
      console.error('Error creating member:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageTeam || !selectedMember) return;

    // Prevent role demotion if current user is the only admin
    if (selectedMember.role === 'admin' && selectedMember.role !== selectedMember.originalRole) {
      const adminCount = state.profiles.filter(p => p.role === 'admin' && p.is_active).length;
      if (adminCount <= 1) {
        setMessage({ type: 'error', text: 'Cannot demote the only admin. Promote another user to admin first.' });
        return;
      }
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      const updatedMember = {
        ...selectedMember,
        updated_at: new Date().toISOString(),
      };

      dispatch({
        type: 'SET_PROFILES',
        payload: state.profiles.map(p => p.id === selectedMember.id ? updatedMember : p)
      });
      
      setShowEditModal(false);
      setSelectedMember(null);
      setMessage({ type: 'success', text: 'Team member updated successfully' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update team member' });
      console.error('Error updating member:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!canManageTeam || !selectedMember) return;

    // Prevent deletion of the only admin
    if (selectedMember.role === 'admin') {
      const adminCount = state.profiles.filter(p => p.role === 'admin' && p.is_active).length;
      if (adminCount <= 1) {
        setMessage({ type: 'error', text: 'Cannot delete the only admin. Promote another user to admin first.' });
        return;
      }
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Soft delete - set as inactive instead of hard delete
      const updatedMember = {
        ...selectedMember,
        is_active: false,
        updated_at: new Date().toISOString(),
      };

      dispatch({
        type: 'SET_PROFILES',
        payload: state.profiles.map(p => p.id === selectedMember.id ? updatedMember : p)
      });
      
      setShowDeleteModal(false);
      setSelectedMember(null);
      setMessage({ type: 'success', text: 'Team member removed successfully' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to remove team member' });
      console.error('Error deleting member:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDropdownAction = (action: string, member: any) => {
    setActiveDropdown(null);
    
    switch (action) {
      case 'view':
        navigate(`/team/${member.id}/profile`);
        break;
      case 'edit':
        setSelectedMember({ ...member, originalRole: member.role });
        setShowEditModal(true);
        break;
      case 'delete':
        setSelectedMember(member);
        setShowDeleteModal(true);
        break;
    }
  };

  const getMemberStats = (memberId: string) => {
    const memberTasks = state.tasks.filter(t => t.assignee_id === memberId);
    const completedTasks = memberTasks.filter(t => t.status === 'done').length;
    const activeTasks = memberTasks.filter(t => t.status === 'in_progress').length;
    
    const thisMonthTimeEntries = state.timeEntries.filter(te => {
      const entryDate = new Date(te.date);
      const now = new Date();
      return te.user_id === memberId && 
             entryDate.getMonth() === now.getMonth() && 
             entryDate.getFullYear() === now.getFullYear();
    });
    
    const hoursThisMonth = thisMonthTimeEntries.reduce((sum, te) => sum + te.duration, 0) / 60;
    
    return { completedTasks, activeTasks, hoursThisMonth };
  };

  const getTeamStats = () => {
    const totalMembers = state.profiles.filter(p => p.is_active).length;
    const activeProjects = state.projects.filter(p => p.status === 'in_progress').length;
    const totalCapacity = state.profiles
      .filter(p => p.is_active && p.role !== 'client')
      .reduce((sum, m) => sum + m.weekly_capacity, 0);
    const thisMonthHours = Math.round(state.timeEntries
      .filter(te => {
        const entryDate = new Date(te.date);
        const now = new Date();
        return entryDate.getMonth() === now.getMonth() && 
               entryDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, te) => sum + te.duration, 0) / 60);

    return { totalMembers, activeProjects, totalCapacity, thisMonthHours };
  };

  const teamStats = getTeamStats();

  const ActionDropdown = ({ member }: { member: any }) => {
    const isOpen = activeDropdown === member.id;
    const canEdit = canManageTeam;
    const canDelete = isAdmin && member.id !== currentUser?.id;
    
    return (
      <div 
        className="relative" 
        ref={el => dropdownRefs.current[member.id] = el}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveDropdown(isOpen ? null : member.id);
          }}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Member actions"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50 py-1">
            <button
              onClick={() => handleDropdownAction('view', member)}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Eye className="w-4 h-4 mr-3 text-gray-400" />
              View Profile
            </button>
            
            {canEdit && (
              <button
                onClick={() => handleDropdownAction('edit', member)}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Edit className="w-4 h-4 mr-3 text-gray-400" />
                Edit Member
              </button>
            )}
            
            {canDelete && (
              <>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={() => handleDropdownAction('delete', member)}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-3 text-red-400" />
                  Remove Member
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 mt-1">Manage your team members and their access</p>
        </div>
        {canManageTeam && (
          <Button onClick={() => setShowCreateModal(true)} icon={UserPlus}>
            Add Member
          </Button>
        )}
      </div>

      {/* Success/Error Messages */}
      {message.text && (
        <div className={`rounded-lg p-4 border ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' :
          'bg-red-50 text-red-800 border-red-200'
        }`}>
          <div className="flex items-center">
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 mr-2" />
            ) : (
              <AlertTriangle className="w-5 h-5 mr-2" />
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-blue-500 rounded-lg p-3">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Members</p>
              <p className="text-2xl font-bold text-gray-900">{teamStats.totalMembers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-green-500 rounded-lg p-3">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Projects</p>
              <p className="text-2xl font-bold text-gray-900">{teamStats.activeProjects}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-purple-500 rounded-lg p-3">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Capacity</p>
              <p className="text-2xl font-bold text-gray-900">{teamStats.totalCapacity}h</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-orange-500 rounded-lg p-3">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">{teamStats.thisMonthHours}h</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search team members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="project_manager">Project Manager</option>
              <option value="team_member">Team Member</option>
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex rounded-lg border border-gray-300">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-2 text-sm font-medium rounded-l-lg transition-colors ${
              viewMode === 'cards' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Cards
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-2 text-sm font-medium rounded-r-lg transition-colors border-l border-gray-300 ${
              viewMode === 'table' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Table
          </button>
        </div>
      </div>

      {/* Team Members Display */}
      {viewMode === 'cards' ? (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => {
            const stats = getMemberStats(member.id);
            const memberProjects = state.projects.filter(p => 
              p.owner_id === member.id || 
              state.tasks.some(t => t.assignee_id === member.id && t.project_id === p.id)
            );

            return (
              <div 
                key={member.id} 
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/team/${member.id}/profile`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center flex-1">
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-600" />
                      </div>
                    )}
                    <div className="ml-3 flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate hover:text-blue-600 transition-colors">{member.name}</h3>
                      <p className="text-sm text-gray-600 truncate">{member.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={
                          member.role === 'admin' ? 'danger' :
                          member.role === 'project_manager' ? 'warning' : 'info'
                        } size="sm">
                          {member.role.replace('_', ' ')}
                        </Badge>
                        {!member.is_active && (
                          <Badge variant="secondary" size="sm">Inactive</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {canManageTeam && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <ActionDropdown member={member} />
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Weekly Capacity</span>
                    <span className="font-medium text-gray-900">{member.weekly_capacity}h</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-lg font-semibold text-gray-900">{stats.activeTasks}</div>
                      <div className="text-xs text-gray-500">Active Tasks</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900">{stats.completedTasks}</div>
                      <div className="text-xs text-gray-500">Completed</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900">
                        {Math.round(stats.hoursThisMonth)}h
                      </div>
                      <div className="text-xs text-gray-500">This Month</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Projects ({memberProjects.length})
                    </div>
                    <div className="space-y-1">
                      {memberProjects.slice(0, 2).map((project) => (
                        <div key={project.id} className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                          {project.name}
                        </div>
                      ))}
                      {memberProjects.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{memberProjects.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capacity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Active Tasks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Active
                  </th>
                  {canManageTeam && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMembers.map((member) => {
                  const stats = getMemberStats(member.id);
                  
                  return (
                    <tr 
                      key={member.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/team/${member.id}/profile`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {member.avatar ? (
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <User className="w-5 h-5 text-gray-600" />
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">{member.name}</div>
                            <div className="text-sm text-gray-500">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={
                          member.role === 'admin' ? 'danger' :
                          member.role === 'project_manager' ? 'warning' : 'info'
                        }>
                          {member.role.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={member.is_active ? 'success' : 'secondary'}>
                          {member.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.weekly_capacity}h/week
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stats.activeTasks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(member.updated_at), 'MMM d, yyyy')}
                      </td>
                      {canManageTeam && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div onClick={(e) => e.stopPropagation()}>
                            <ActionDropdown member={member} />
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Member Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add Team Member"
        size="lg"
      >
        <form onSubmit={handleCreateMember} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Smith"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={newMember.email}
                onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="john@company.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <select
                value={newMember.role}
                onChange={(e) => setNewMember({ ...newMember, role: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="team_member">Team Member</option>
                <option value="project_manager">Project Manager</option>
                {isAdmin && (
                  <option value="admin">Admin</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weekly Capacity (hours) *
              </label>
              <input
                type="number"
                min="1"
                max="60"
                required
                value={newMember.weekly_capacity}
                onChange={(e) => setNewMember({ ...newMember, weekly_capacity: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <input
              type="text"
              value={newMember.department}
              onChange={(e) => setNewMember({ ...newMember, department: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Engineering, Design, Marketing..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign to Projects (optional)
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {state.projects.filter(p => p.status !== 'completed' && p.status !== 'cancelled').map((project) => (
                <label key={project.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newMember.projects.includes(project.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewMember({
                          ...newMember,
                          projects: [...newMember.projects, project.id]
                        });
                      } else {
                        setNewMember({
                          ...newMember,
                          projects: newMember.projects.filter(id => id !== project.id)
                        });
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">{project.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={newMember.sendInvite}
                onChange={(e) => setNewMember({ ...newMember, sendInvite: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Send invitation email</span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Add Member
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Member Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Team Member"
        size="lg"
      >
        {selectedMember && (
          <form onSubmit={handleUpdateMember} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={selectedMember.name}
                  onChange={(e) => setSelectedMember({ ...selectedMember, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={selectedMember.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={selectedMember.role}
                  onChange={(e) => setSelectedMember({ ...selectedMember, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="team_member">Team Member</option>
                  <option value="project_manager">Project Manager</option>
                  {isAdmin && (
                    <option value="admin">Admin</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weekly Capacity (hours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  required
                  value={selectedMember.weekly_capacity}
                  onChange={(e) => setSelectedMember({ ...selectedMember, weekly_capacity: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedMember.is_active}
                  onChange={(e) => setSelectedMember({ ...selectedMember, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">Active Member</span>
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                Update Member
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Member Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Remove Team Member"
        size="md"
      >
        {selectedMember && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Remove {selectedMember.name}?
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>
                      This will deactivate the team member and remove their access to the platform. 
                      Their data and work history will be preserved.
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
                onClick={handleDeleteMember}
                loading={loading}
                icon={Trash2}
              >
                Remove Member
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}