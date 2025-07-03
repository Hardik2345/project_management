import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { 
  User, 
  Bell, 
  Shield, 
  Save,
  Upload,
  Key,
  RefreshCw,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Camera
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

export function Settings() {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState('account');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [hasChanges, setHasChanges] = useState(false);

  // Profile settings
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    avatar: currentUser?.avatar || '',
    weekly_capacity: currentUser?.weekly_capacity || 40,
  });

  // Password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    taskAssignments: true,
    projectUpdates: true,
    deadlineReminders: true,
    weeklyReports: true,
    invoiceUpdates: true,
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setHasChanges(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setMessage({ type: 'success', text: 'Notification preferences updated!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setLoading(true);
    try {
      // In a real app, you'd upload to your storage service
      setMessage({ type: 'info', text: 'Avatar upload feature coming soon!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      // Export user's data
      const userData = {
        profile: currentUser,
        exportDate: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `techit-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: 'Data exported successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to export data' });
    }
  };

  const tabs = [
    { id: 'account', name: 'Account', icon: User, description: 'Profile and personal information' },
    { id: 'notifications', name: 'Notifications', icon: Bell, description: 'Email and notification preferences' },
    { id: 'security', name: 'Security', icon: Shield, description: 'Password and security settings' },
  ];

  const handleInputChange = (field: string, value: any) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-1">Manage your account and preferences</p>
            </div>
            <Badge variant="info" className="capitalize">
              {currentUser?.role?.replace('_', ' ')}
            </Badge>
          </div>

          {/* Success/Error Messages */}
          {message.text && (
            <div className={`rounded-lg p-4 border ${
              message.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' :
              message.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' :
              'bg-blue-50 text-blue-800 border-blue-200'
            }`}>
              <div className="flex items-center">
                {message.type === 'success' && <CheckCircle className="w-5 h-5 mr-2" />}
                {message.type === 'error' && <AlertTriangle className="w-5 h-5 mr-2" />}
                <span>{message.text}</span>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <tab.icon className="w-4 h-4" />
                      <span>{tab.name}</span>
                    </div>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Account Tab */}
              {activeTab === 'account' && (
                <div className="space-y-8">
                  {/* Account Overview */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Account Overview</h3>
                    
                    {/* Profile Picture Section */}
                    <div className="flex items-center space-x-6 mb-8">
                      <div className="relative">
                        {profileData.avatar ? (
                          <img
                            src={profileData.avatar}
                            alt="Profile"
                            className="w-20 h-20 rounded-full object-cover ring-4 ring-gray-100"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center ring-4 ring-gray-100">
                            <User className="w-8 h-8 text-gray-600" />
                          </div>
                        )}
                        <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                          <Camera className="w-4 h-4" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-semibold text-gray-900">{profileData.name}</h4>
                        <p className="text-gray-600">{profileData.email}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <Badge variant="info" className="capitalize">
                            {currentUser?.role?.replace('_', ' ')}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {profileData.weekly_capacity}h/week capacity
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Profile Form */}
                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={profileData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            placeholder="Enter your full name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={profileData.email}
                            disabled
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                          />
                          <p className="text-xs text-gray-500 mt-1 italic">
                            Email cannot be changed here
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Weekly Capacity (hours)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="60"
                            value={profileData.weekly_capacity}
                            onChange={(e) => handleInputChange('weekly_capacity', parseInt(e.target.value))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          />
                        </div>
                      </div>

                      {/* Save Button */}
                      {hasChanges && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <AlertTriangle className="w-5 h-5 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800">
                                You have unsaved changes
                              </span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setProfileData({
                                    name: currentUser?.name || '',
                                    email: currentUser?.email || '',
                                    avatar: currentUser?.avatar || '',
                                    weekly_capacity: currentUser?.weekly_capacity || 40,
                                  });
                                  setHasChanges(false);
                                }}
                              >
                                Discard
                              </Button>
                              <Button
                                type="submit"
                                loading={loading}
                                icon={Save}
                                size="sm"
                              >
                                Save Changes
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </form>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Notification Preferences</h3>
                    <p className="text-gray-600 mb-6">Choose how you want to be notified about updates and activities.</p>
                    
                    <div className="space-y-6">
                      {/* Email Notifications */}
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="text-md font-semibold text-gray-900 mb-4">Email Notifications</h4>
                        <div className="space-y-4">
                          {Object.entries(notificationSettings).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between py-3">
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900">
                                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                </h5>
                                <p className="text-sm text-gray-600 mt-1">
                                  {key === 'emailNotifications' && 'Receive notifications via email'}
                                  {key === 'taskAssignments' && 'Get notified when tasks are assigned to you'}
                                  {key === 'projectUpdates' && 'Receive updates about project changes'}
                                  {key === 'deadlineReminders' && 'Get reminded about upcoming deadlines'}
                                  {key === 'weeklyReports' && 'Receive weekly summary reports'}
                                  {key === 'invoiceUpdates' && 'Get notified about invoice status changes'}
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer ml-4">
                                <input
                                  type="checkbox"
                                  checked={value}
                                  onChange={(e) => setNotificationSettings({
                                    ...notificationSettings,
                                    [key]: e.target.checked
                                  })}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          onClick={handleNotificationUpdate}
                          loading={loading}
                          icon={Save}
                        >
                          Save Preferences
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Security Settings</h3>
                    <p className="text-gray-600 mb-6">Manage your account security and access.</p>
                    
                    <div className="space-y-4">
                      {/* Password */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                              <Key className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">Password</h4>
                              <p className="text-sm text-gray-600">Change your account password</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => setShowPasswordModal(true)}
                            icon={Key}
                          >
                            Change Password
                          </Button>
                        </div>
                      </div>

                      {/* Two-Factor Authentication */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                              <Shield className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                              <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                            </div>
                          </div>
                          <Badge variant="secondary">Coming Soon</Badge>
                        </div>
                      </div>

                      {/* Active Sessions */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 bg-purple-100 rounded-lg">
                              <RefreshCw className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">Active Sessions</h4>
                              <p className="text-sm text-gray-600">Manage your active login sessions</p>
                            </div>
                          </div>
                          <Button variant="outline" icon={RefreshCw}>
                            View Sessions
                          </Button>
                        </div>
                      </div>

                      {/* Data Export */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 bg-indigo-100 rounded-lg">
                              <Download className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">Export Data</h4>
                              <p className="text-sm text-gray-600">Download a copy of your data</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            onClick={exportData}
                            icon={Download}
                          >
                            Export Data
                          </Button>
                        </div>
                      </div>

                      {/* Danger Zone */}
                      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 bg-red-100 rounded-lg">
                              <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-red-900">Delete Account</h4>
                              <p className="text-sm text-red-700">Permanently delete your account and all data</p>
                            </div>
                          </div>
                          <Button
                            variant="danger"
                            onClick={() => setShowDeleteModal(true)}
                            icon={Trash2}
                          >
                            Delete Account
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Password"
        size="md"
      >
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowPasswordModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Update Password
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Trash2 className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  This action cannot be undone
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    Deleting your account will permanently remove all your data, including:
                  </p>
                  <ul className="list-disc list-inside mt-2">
                    <li>Profile information</li>
                    <li>Time entries</li>
                    <li>Task assignments</li>
                    <li>Comments and attachments</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type "DELETE" to confirm
            </label>
            <input
              type="text"
              placeholder="DELETE"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" icon={Trash2}>
              Delete Account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}