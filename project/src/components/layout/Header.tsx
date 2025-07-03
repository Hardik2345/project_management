import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, ChevronDown, User, LogOut, Settings, HelpCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const { state, currentUser } = useApp();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const unreadNotifications = state.notifications.filter(n => !n.read);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle keyboard navigation
  const handleProfileKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setShowProfile(!showProfile);
    }
    if (event.key === 'Escape') {
      setShowProfile(false);
    }
  };

  const handleMenuItemClick = (action: string) => {
    setShowProfile(false);
    
    switch (action) {
      case 'profile':
        // Navigate to profile/dashboard
        navigate('/');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'help':
        // In a real app, this would open help docs or feedback form
        console.log('Help/Feedback clicked');
        break;
      case 'logout':
        // In a real app, this would handle logout
        console.log('Logout clicked');
        break;
    }
  };

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center border-b border-gray-200 bg-white px-4 shadow-sm sm:px-6 lg:px-8">
      {/* Left side - Search */}
      <div className="flex flex-1 items-center">
        <div className="relative flex flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search projects, tasks, or team members..."
            className="block w-full rounded-lg border-0 py-2.5 pl-9 pr-3 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 h-10"
          />
        </div>
      </div>
      
      {/* Right side - Notifications and Profile */}
      <div className="flex items-center space-x-4">
        {/* Notifications Bell */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg transition-colors"
            aria-label="View notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadNotifications.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium leading-none">
                {unreadNotifications.length}
              </span>
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
              <div className="py-1">
                <div className="px-4 py-3 text-sm font-semibold text-gray-900 border-b border-gray-100">
                  Notifications ({unreadNotifications.length} unread)
                </div>
                {state.notifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${
                      notification.read ? 'text-gray-600' : 'text-gray-900 bg-blue-50'
                    }`}
                  >
                    <div className="font-medium">{notification.title}</div>
                    <div className="text-gray-500 mt-1">{notification.message}</div>
                  </div>
                ))}
                {state.notifications.length === 0 && (
                  <div className="px-4 py-6 text-center text-sm text-gray-500">
                    No notifications
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown - Modern Design */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            onKeyDown={handleProfileKeyDown}
            className="flex items-center space-x-2 p-1.5 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg transition-all duration-200"
            aria-label="Open user menu"
            aria-expanded={showProfile}
            aria-haspopup="true"
          >
            {/* Avatar */}
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="h-8 w-8 rounded-full object-cover ring-2 ring-gray-200"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center ring-2 ring-gray-200">
                <User className="h-4 w-4 text-gray-600" />
              </div>
            )}
            
            {/* Dropdown Caret */}
            <ChevronDown 
              className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                showProfile ? 'rotate-180' : ''
              }`} 
            />
          </button>

          {/* Dropdown Menu */}
          {showProfile && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50 py-1">
              {/* User Info Header */}
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  {currentUser?.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {currentUser?.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {currentUser?.email}
                    </div>
                    <div className="text-xs text-gray-400 capitalize mt-0.5">
                      {currentUser?.role.replace('_', ' ')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <button
                  onClick={() => handleMenuItemClick('profile')}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User className="w-4 h-4 mr-3 text-gray-400" />
                  Profile
                </button>
                
                <button
                  onClick={() => handleMenuItemClick('settings')}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="w-4 h-4 mr-3 text-gray-400" />
                  Settings
                </button>
                
                <button
                  onClick={() => handleMenuItemClick('help')}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <HelpCircle className="w-4 h-4 mr-3 text-gray-400" />
                  Help & Feedback
                </button>
              </div>

              {/* Logout - Separated */}
              <div className="border-t border-gray-100 py-1">
                <button
                  onClick={() => handleMenuItemClick('logout')}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-3 text-gray-400" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}