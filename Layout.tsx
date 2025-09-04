import React from 'react';
import { useAuth } from './src/contexts/AuthContext';
import { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import NotificationCenter from './NotificationCenter';
import { 
  Home,
  Building,
  Settings,
  ClipboardList,
  Users,
  FileText,
  LogOut,
  Bell,
  Calendar,
  Wrench
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage }) => {
  const { userProfile, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home, id: 'dashboard' },
    { name: 'Plant Rooms', href: '/plant-rooms', icon: Building, id: 'plant-rooms' },
    { name: 'Assets', href: '/assets', icon: Settings, id: 'assets' },
    { name: 'Tasks', href: '/tasks', icon: ClipboardList, id: 'tasks' },
    { name: 'Logs', href: '/logs', icon: FileText, id: 'logs' },
    { name: 'Team', href: '/team', icon: Users, id: 'team' },
    { name: 'Forms', href: '/forms', icon: FileText, id: 'forms' },
    { name: 'DRS', href: '/drs', icon: Users, id: 'drs' },
    { name: 'Availability', href: '/availability', icon: Calendar, id: 'availability' },
    { name: 'Parts', href: '/parts', icon: Wrench, id: 'parts' },
  ];

  const filteredNavigation = navigation.filter(item => {
    if (userProfile?.Role === 'Viewer') {
      return ['dashboard'].includes(item.id);
    }
    if (userProfile?.Role === 'Engineer') {
      // Engineers see: Dashboard, Tasks, Logs, Forms, Assets, Plant Rooms, Availability
      return !['team', 'drs'].includes(item.id);
    }
    if (userProfile?.Role === 'Access All') {
      return true; // Access all pages
    }
    return true; // Admin sees all
  });

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-gradient-to-r from-primary-600 to-primary-700 border-b border-primary-800 z-50 shadow-lg">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold text-white">Mech Hub</h1>
          <div className="flex items-center space-x-4">
            {/* Mobile Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-white hover:text-primary-200 transition-colors"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-error-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
            <span className="text-sm text-white font-medium">{userProfile?.Name}</span>
            <button
              onClick={signOut}
              className="p-2 text-white hover:text-primary-200 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="lg:flex">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
          <div className="flex flex-col flex-grow gradient-bg border-r border-primary-800">
            <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-primary-800">
              <h1 className="text-xl font-bold text-white">Mech Hub</h1>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2">
              {filteredNavigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={`${
                    currentPage === item.id
                      ? 'bg-white bg-opacity-20 border-accent-400 text-white shadow-lg'
                      : 'border-transparent text-primary-100 hover:text-white hover:bg-white hover:bg-opacity-10'
                  } group flex items-center px-3 py-2 text-sm font-medium border-l-4 transition-colors`}
                >
                  <item.icon
                    className={`${
                      currentPage === item.id ? 'text-white' : 'text-primary-200 group-hover:text-white'
                    } mr-3 h-5 w-5 transition-colors`}
                  />
                  {item.name}
                </a>
              ))}
            </nav>
            <div className="flex-shrink-0 border-t border-primary-800 p-4">
              <div className="flex items-center">
                {/* Desktop Notifications */}
                <div className="mr-3">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-primary-200 hover:text-white transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-error-500 text-white rounded-full text-xs w-4 h-4 flex items-center justify-center font-bold animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{userProfile?.Name}</p>
                  <p className="text-xs text-primary-200">{userProfile?.Role}</p>
                </div>
                <button
                  onClick={signOut}
                  className="ml-3 p-2 text-primary-200 hover:text-white transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:pl-64 flex flex-col flex-1">
          <main className="flex-1 pt-16 lg:pt-0">
            <div className="p-4 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Enhanced Mobile bottom navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-r from-primary-600 to-primary-700 border-t border-primary-800 z-50 shadow-2xl">
        <nav className="flex">
          {filteredNavigation.slice(0, 5).map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={`${
                currentPage === item.id
                  ? 'text-white bg-white bg-opacity-20'
                  : 'text-primary-200 hover:text-white hover:bg-white hover:bg-opacity-10'
              } flex-1 flex flex-col items-center py-3 text-xs transition-all duration-200 rounded-lg mx-1 my-2`}
            >
              <item.icon className="w-7 h-7 mb-1" />
              <span className="font-medium">{item.name}</span>
            </a>
          ))}
        </nav>
      </div>
      
      {/* Notification Center */}
      <NotificationCenter 
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </div>
  );
};

export default Layout;