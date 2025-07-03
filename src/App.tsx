import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { useAuth } from './hooks/useAuth';
import { AuthForm } from './components/auth/AuthForm';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { EditProject } from './pages/EditProject';
import { Tasks } from './pages/Tasks';
import { TimeTracking } from './pages/TimeTracking';
import { TeamManagement } from './pages/TeamManagement';
import { ProfileView } from './pages/ProfileView';
import { Invoices } from './pages/Invoices';
import { ClientPortal } from './pages/ClientPortal';
import { Settings } from './pages/Settings';
import { ClientManagement } from './pages/ClientManagement';
import { Meetings } from './pages/Meetings';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id/edit" element={<EditProject />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="time" element={<TimeTracking />} />
        <Route path="team" element={<TeamManagement />} />
        <Route path="team/:memberId/profile" element={<ProfileView />} />
        <Route path="profile/:userId" element={<ProfileView />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="client" element={<ClientPortal />} />
        <Route path="clients" element={<ClientManagement />} />
        <Route path="meetings" element={<Meetings />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AppProvider>
      <Router>
        <AppContent />
      </Router>
    </AppProvider>
  );
}

export default App;