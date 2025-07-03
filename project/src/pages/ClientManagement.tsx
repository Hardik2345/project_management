import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../hooks/useAuth';
import { 
  Plus, 
  Search, 
  Building, 
  Mail, 
  Phone, 
  DollarSign, 
  Edit, 
  Trash2, 
  Eye,
  MoreVertical,
  Users,
  FolderOpen,
  Clock,
  TrendingUp
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';

export function ClientManagement() {
  const { state, dispatch } = useApp();
  const { profile: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    company: '',
    hourly_rate: 0,
  });

  const canManageClients = currentUser?.role === 'admin' || currentUser?.role === 'project_manager';

  const filteredClients = state.clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && client.is_active) ||
                         (statusFilter === 'inactive' && !client.is_active);
    
    return matchesSearch && matchesStatus;
  });

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageClients) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          name: newClient.name,
          email: newClient.email,
          company: newClient.company,
          hourly_rate: newClient.hourly_rate,
        })
        .select()
        .single();

      if (error) throw error;

      dispatch({ type: 'ADD_CLIENT', payload: data });
      setShowCreateModal(false);
      setNewClient({
        name: '',
        email: '',
        company: '',
        hourly_rate: 0,
      });
    } catch (error) {
      console.error('Error creating client:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageClients || !selectedClient) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .update({
          name: selectedClient.name,
          email: selectedClient.email,
          company: selectedClient.company,
          hourly_rate: selectedClient.hourly_rate,
          is_active: selectedClient.is_active,
        })
        .eq('id', selectedClient.id)
        .select()
        .single();

      if (error) throw error;

      dispatch({ type: 'UPDATE_CLIENT', payload: data });
      setShowEditModal(false);
      setSelectedClient(null);
    } catch (error) {
      console.error('Error updating client:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!canManageClients || !selectedClient) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', selectedClient.id);

      if (error) throw error;

      dispatch({
        type: 'SET_CLIENTS',
        payload: state.clients.filter(c => c.id !== selectedClient.id)
      });
      setShowDeleteModal(false);
      setSelectedClient(null);
    } catch (error) {
      console.error('Error deleting client:', error);
    } finally {
      setLoading(false);
    }
  };

  const getClientStats = (clientId: string) => {
    const clientProjects = state.projects.filter(p => p.client_id === clientId);
    const activeProjects = clientProjects.filter(p => p.status === 'in_progress').length;
    const totalProjects = clientProjects.length;
    
    const clientTimeEntries = state.timeEntries.filter(te => 
      clientProjects.some(p => p.id === te.project_id)
    );
    const totalHours = clientTimeEntries.reduce((sum, te) => sum + te.duration, 0) / 60;
    
    const clientInvoices = state.invoices.filter(inv => inv.client_id === clientId);
    const totalRevenue = clientInvoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0);
    
    return { activeProjects, totalProjects, totalHours, totalRevenue };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
        {canManageClients && (
          <Button onClick={() => setShowCreateModal(true)} icon={Plus}>
            Add Client
          </Button>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-blue-500 rounded-lg p-3">
              <Building className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900">{state.clients.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-green-500 rounded-lg p-3">
              <FolderOpen className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Projects</p>
              <p className="text-2xl font-bold text-gray-900">
                {state.projects.filter(p => p.status === 'in_progress').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-purple-500 rounded-lg p-3">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Hours</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(state.timeEntries.reduce((sum, te) => sum + te.duration, 0) / 60)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-orange-500 rounded-lg p-3">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${state.invoices
                  .filter(inv => inv.status === 'paid')
                  .reduce((sum, inv) => sum + inv.total, 0)
                  .toFixed(0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Clients</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => {
          const stats = getClientStats(client.id);
          
          return (
            <div key={client.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{client.company}</h3>
                    <Badge variant={client.is_active ? 'success' : 'secondary'}>
                      {client.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{client.name}</p>
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <Mail className="w-4 h-4 mr-1" />
                    <span>{client.email}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <DollarSign className="w-4 h-4 mr-1" />
                    <span>${client.hourly_rate}/hour</span>
                  </div>
                </div>
                {canManageClients && (
                  <div className="relative">
                    <button
                      onClick={() => {
                        setSelectedClient(client);
                        setShowEditModal(true);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{stats.activeProjects}</div>
                  <div className="text-xs text-gray-500">Active Projects</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{Math.round(stats.totalHours)}</div>
                  <div className="text-xs text-gray-500">Total Hours</div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total Revenue</span>
                  <span className="font-semibold text-gray-900">${stats.totalRevenue.toFixed(0)}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-600">Projects</span>
                  <span className="text-gray-900">{stats.totalProjects}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Added {format(new Date(client.created_at || ''), 'MMM d, yyyy')}
                  </span>
                  <Button variant="ghost" size="sm" icon={Eye} className="p-1">
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Client Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Client"
        size="lg"
      >
        <form onSubmit={handleCreateClient} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Name
              </label>
              <input
                type="text"
                required
                value={newClient.name}
                onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Smith"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={newClient.email}
                onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="john@company.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name
            </label>
            <input
              type="text"
              required
              value={newClient.company}
              onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Acme Corporation"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hourly Rate ($)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={newClient.hourly_rate}
              onChange={(e) => setNewClient({ ...newClient, hourly_rate: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="150.00"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Add Client
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Client Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Client"
        size="lg"
      >
        {selectedClient && (
          <form onSubmit={handleUpdateClient} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Name
                </label>
                <input
                  type="text"
                  required
                  value={selectedClient.name}
                  onChange={(e) => setSelectedClient({ ...selectedClient, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={selectedClient.email}
                  onChange={(e) => setSelectedClient({ ...selectedClient, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                required
                value={selectedClient.company}
                onChange={(e) => setSelectedClient({ ...selectedClient, company: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hourly Rate ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={selectedClient.hourly_rate}
                onChange={(e) => setSelectedClient({ ...selectedClient, hourly_rate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedClient.is_active}
                  onChange={(e) => setSelectedClient({ ...selectedClient, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">Active Client</span>
              </label>
            </div>

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  setShowEditModal(false);
                  setShowDeleteModal(true);
                }}
                icon={Trash2}
              >
                Delete Client
              </Button>
              <div className="flex space-x-3">
                <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={loading}>
                  Update Client
                </Button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Client Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Client"
        size="md"
      >
        {selectedClient && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Trash2 className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Delete {selectedClient.company}?
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>
                      This will permanently delete the client and all associated data. This action cannot be undone.
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
                onClick={handleDeleteClient}
                loading={loading}
                icon={Trash2}
              >
                Delete Client
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}