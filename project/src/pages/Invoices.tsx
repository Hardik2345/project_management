import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../hooks/useAuth';
import { Plus, Search, Download, Eye, Send, DollarSign, Calendar, FileText } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { supabase } from '../lib/supabase';

export function Invoices() {
  const { state, dispatch } = useApp();
  const { profile: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [newInvoice, setNewInvoice] = useState({
    clientId: '',
    periodStart: format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
    periodEnd: format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
    projectIds: [] as string[],
    hourlyRate: 0,
    taxRate: 10, // 10% tax
  });

  const canManageInvoices = currentUser?.role === 'admin' || currentUser?.role === 'project_manager';

  const filteredInvoices = state.invoices.filter(invoice => {
    const client = state.clients.find(c => c.id === invoice.client_id);
    const matchesSearch = client?.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageInvoices) return;

    try {
      // Calculate totals based on time entries
      const timeEntries = state.timeEntries.filter(te => {
        const entryDate = new Date(te.date);
        const startDate = new Date(newInvoice.periodStart);
        const endDate = new Date(newInvoice.periodEnd);
        
        return entryDate >= startDate && 
               entryDate <= endDate && 
               newInvoice.projectIds.includes(te.project_id);
      });

      const totalHours = timeEntries.reduce((sum, te) => sum + te.duration, 0) / 60;
      const subtotal = totalHours * newInvoice.hourlyRate;
      const tax = subtotal * (newInvoice.taxRate / 100);
      const total = subtotal + tax;

      const { data: invoice, error } = await supabase
        .from('invoices')
        .insert({
          client_id: newInvoice.clientId,
          period_start: newInvoice.periodStart,
          period_end: newInvoice.periodEnd,
          total_hours: totalHours,
          hourly_rate: newInvoice.hourlyRate,
          subtotal,
          tax,
          total,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;

      // Add project associations
      if (newInvoice.projectIds.length > 0) {
        const { error: projectError } = await supabase
          .from('invoice_projects')
          .insert(
            newInvoice.projectIds.map(projectId => ({
              invoice_id: invoice.id,
              project_id: projectId,
            }))
          );

        if (projectError) throw projectError;
      }

      // Add client data for display
      const client = state.clients.find(c => c.id === newInvoice.clientId);
      const invoiceWithClient = { ...invoice, client };

      dispatch({ type: 'ADD_INVOICE', payload: invoiceWithClient });
      setShowCreateModal(false);
      setNewInvoice({
        clientId: '',
        periodStart: format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
        periodEnd: format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
        projectIds: [],
        hourlyRate: 0,
        taxRate: 10,
      });
    } catch (error) {
      console.error('Error creating invoice:', error);
    }
  };

  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    if (!canManageInvoices) return;

    try {
      const { data, error } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) throw error;

      const client = state.clients.find(c => c.id === data.client_id);
      const updatedInvoice = { ...data, client };

      dispatch({
        type: 'SET_INVOICES',
        payload: state.invoices.map(inv => inv.id === invoiceId ? updatedInvoice : inv)
      });
    } catch (error) {
      console.error('Error updating invoice status:', error);
    }
  };

  const getInvoiceStats = () => {
    const totalRevenue = state.invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0);
    
    const pendingRevenue = state.invoices
      .filter(inv => inv.status === 'sent')
      .reduce((sum, inv) => sum + inv.total, 0);
    
    const draftInvoices = state.invoices.filter(inv => inv.status === 'draft').length;
    
    return { totalRevenue, pendingRevenue, draftInvoices };
  };

  const stats = getInvoiceStats();

  const getClientProjects = (clientId: string) => {
    return state.projects.filter(p => p.client_id === clientId);
  };

  const calculateInvoicePreview = () => {
    if (!newInvoice.clientId || newInvoice.projectIds.length === 0) return null;

    const timeEntries = state.timeEntries.filter(te => {
      const entryDate = new Date(te.date);
      const startDate = new Date(newInvoice.periodStart);
      const endDate = new Date(newInvoice.periodEnd);
      
      return entryDate >= startDate && 
             entryDate <= endDate && 
             newInvoice.projectIds.includes(te.project_id);
    });

    const totalHours = timeEntries.reduce((sum, te) => sum + te.duration, 0) / 60;
    const subtotal = totalHours * newInvoice.hourlyRate;
    const tax = subtotal * (newInvoice.taxRate / 100);
    const total = subtotal + tax;

    return { totalHours, subtotal, tax, total, timeEntries };
  };

  const preview = calculateInvoicePreview();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        {canManageInvoices && (
          <Button onClick={() => setShowCreateModal(true)} icon={Plus}>
            Create Invoice
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-green-500 rounded-lg p-3">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-yellow-500 rounded-lg p-3">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${stats.pendingRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-blue-500 rounded-lg p-3">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Draft Invoices</p>
              <p className="text-2xl font-bold text-gray-900">{stats.draftInvoices}</p>
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
            placeholder="Search invoices..."
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
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
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
              {filteredInvoices.map((invoice) => {
                const client = state.clients.find(c => c.id === invoice.client_id);
                
                return (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        INV-{invoice.id.slice(-6).toUpperCase()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(invoice.created_at || ''), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{client?.company}</div>
                      <div className="text-sm text-gray-500">{client?.name}</div>
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
                      {canManageInvoices ? (
                        <select
                          value={invoice.status}
                          onChange={(e) => handleStatusChange(invoice.id, e.target.value)}
                          className="text-sm rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="draft">Draft</option>
                          <option value="sent">Sent</option>
                          <option value="paid">Paid</option>
                        </select>
                      ) : (
                        <Badge variant={
                          invoice.status === 'paid' ? 'success' :
                          invoice.status === 'sent' ? 'warning' : 'secondary'
                        }>
                          {invoice.status}
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setShowPreviewModal(true);
                          }}
                          icon={Eye}
                          className="p-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Download}
                          className="p-1"
                        />
                        {canManageInvoices && invoice.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(invoice.id, 'sent')}
                            icon={Send}
                            className="p-1"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Invoice"
        size="xl"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client
              </label>
              <select
                required
                value={newInvoice.clientId}
                onChange={(e) => {
                  setNewInvoice({ ...newInvoice, clientId: e.target.value, projectIds: [] });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Client</option>
                {state.clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.company}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hourly Rate
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={newInvoice.hourlyRate}
                onChange={(e) => setNewInvoice({ ...newInvoice, hourlyRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Period Start
              </label>
              <input
                type="date"
                required
                value={newInvoice.periodStart}
                onChange={(e) => setNewInvoice({ ...newInvoice, periodStart: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Period End
              </label>
              <input
                type="date"
                required
                value={newInvoice.periodEnd}
                onChange={(e) => setNewInvoice({ ...newInvoice, periodEnd: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {newInvoice.clientId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Projects to Include
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {getClientProjects(newInvoice.clientId).map((project) => (
                  <label key={project.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newInvoice.projectIds.includes(project.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewInvoice({
                            ...newInvoice,
                            projectIds: [...newInvoice.projectIds, project.id]
                          });
                        } else {
                          setNewInvoice({
                            ...newInvoice,
                            projectIds: newInvoice.projectIds.filter(id => id !== project.id)
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
          )}

          {preview && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Invoice Preview</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Hours:</span>
                  <span>{Math.round(preview.totalHours * 10) / 10}h</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${preview.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax ({newInvoice.taxRate}%):</span>
                  <span>${preview.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium text-gray-900 border-t pt-2">
                  <span>Total:</span>
                  <span>${preview.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!preview || preview.totalHours === 0}>
              Create Invoice
            </Button>
          </div>
        </form>
      </Modal>

      {/* Invoice Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Invoice Preview"
        size="xl"
      >
        {selectedInvoice && (
          <div className="space-y-6">
            <div className="bg-white p-8 border border-gray-200 rounded-lg">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
                  <p className="text-gray-600">INV-{selectedInvoice.id.slice(-6).toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">{format(new Date(selectedInvoice.created_at || ''), 'MMM d, yyyy')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">From:</h3>
                  <p className="text-gray-600">Tech It!</p>
                  <p className="text-gray-600">Project Management Platform</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">To:</h3>
                  {(() => {
                    const client = state.clients.find(c => c.id === selectedInvoice.client_id);
                    return (
                      <>
                        <p className="text-gray-600">{client?.company}</p>
                        <p className="text-gray-600">{client?.name}</p>
                        <p className="text-gray-600">{client?.email}</p>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="mb-8">
                <h3 className="font-medium text-gray-900 mb-2">Invoice Period:</h3>
                <p className="text-gray-600">
                  {format(new Date(selectedInvoice.period_start), 'MMMM d, yyyy')} - {format(new Date(selectedInvoice.period_end), 'MMMM d, yyyy')}
                </p>
              </div>

              <table className="w-full mb-8">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2">Description</th>
                    <th className="text-right py-2">Hours</th>
                    <th className="text-right py-2">Rate</th>
                    <th className="text-right py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-2">Professional Services</td>
                    <td className="text-right py-2">{Math.round(selectedInvoice.total_hours * 10) / 10}</td>
                    <td className="text-right py-2">${selectedInvoice.hourly_rate.toFixed(2)}</td>
                    <td className="text-right py-2">${selectedInvoice.subtotal.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="flex justify-end">
                <div className="w-64">
                  <div className="flex justify-between py-2">
                    <span>Subtotal:</span>
                    <span>${selectedInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span>Tax:</span>
                    <span>${selectedInvoice.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t border-gray-200 font-medium">
                    <span>Total:</span>
                    <span>${selectedInvoice.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" icon={Download}>
                Download PDF
              </Button>
              {canManageInvoices && selectedInvoice.status === 'draft' && (
                <Button
                  onClick={() => {
                    handleStatusChange(selectedInvoice.id, 'sent');
                    setShowPreviewModal(false);
                  }}
                  icon={Send}
                >
                  Send Invoice
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}