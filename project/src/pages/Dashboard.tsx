import React, { useState } from 'react';
import { PersonalSnapshot } from '../components/dashboard/PersonalSnapshot';
import { TaskBoard } from '../components/dashboard/TaskBoard';
import { StatusOverview } from '../components/dashboard/StatusOverview';
import { CollaborationTimeline } from '../components/dashboard/CollaborationTimeline';
import { FilterSidebar } from '../components/dashboard/FilterSidebar';
import { useApp } from '../contexts/AppContext';

export function Dashboard() {
  const { state, currentUser } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentFilters, setCurrentFilters] = useState({
    priority: 'all',
    tags: 'all',
    assignee: 'all'
  });

  // Filter tasks based on current filters
  const filteredTasks = state.tasks.filter(task => {
    const matchesPriority = currentFilters.priority === 'all' || task.priority === currentFilters.priority;
    const matchesAssignee = currentFilters.assignee === 'all' || task.assignee_id === currentFilters.assignee;
    return matchesPriority && matchesAssignee;
  });

  const handleFilterChange = (filters: any) => {
    setCurrentFilters(filters);
    // Open sidebar when filters are applied (except for 'all' values)
    const hasActiveFilters = Object.values(filters).some(value => value !== 'all');
    setSidebarOpen(hasActiveFilters);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {currentUser?.name?.split(' ')[0]}
              </h1>
              <p className="text-gray-600 mt-1">
                Here's what's happening with your projects today.
              </p>
            </div>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Personal Snapshot - Takes up more space on larger screens */}
            <div className="xl:col-span-8">
              <PersonalSnapshot />
            </div>

            {/* Status Overview - Sidebar on larger screens */}
            <div className="xl:col-span-4">
              <StatusOverview />
            </div>
          </div>

          {/* Task Board - Full width */}
          <div className="grid grid-cols-1 gap-6">
            <TaskBoard onFilterChange={handleFilterChange} />
          </div>

          {/* Collaboration Timeline - Full width */}
          <div className="grid grid-cols-1 gap-6">
            <CollaborationTimeline />
          </div>
        </div>
      </div>

      {/* Filter Sidebar */}
      <FilterSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        filters={currentFilters}
        filteredTasks={filteredTasks}
      />

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}