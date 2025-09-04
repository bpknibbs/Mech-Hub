import React from 'react';
import { BellIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useNotifications } from '../hooks/useNotifications';
import { format } from 'date-fns';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  if (!isOpen) return null;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return '📋';
      case 'task_overdue':
        return '⚠️';
      case 'task_completed':
        return '✅';
      default:
        return '📢';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-error-500 bg-error-50';
      case 'medium':
        return 'border-l-warning-500 bg-warning-50';
      case 'low':
        return 'border-l-success-500 bg-success-50';
      default:
        return 'border-l-primary-500 bg-primary-50';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-16 p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl border border-secondary-200 w-full max-w-md max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BellIcon className="w-6 h-6 mr-3" />
              <h3 className="text-xl font-bold">Notifications</h3>
              {unreadCount > 0 && (
                <span className="ml-3 bg-white bg-opacity-30 text-white rounded-full px-3 py-1 text-sm font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="mt-3 text-sm text-white text-opacity-80 hover:text-white flex items-center transition-colors"
            >
              <CheckIcon className="w-4 h-4 mr-1" />
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto max-h-96">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="bg-secondary-100 rounded-full p-4 inline-block mb-3">
                <BellIcon className="h-8 w-8 text-secondary-400" />
              </div>
              <p className="text-secondary-600 font-medium">No notifications</p>
              <p className="text-sm text-secondary-500 mt-1">You're all caught up!</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-l-4 transition-all duration-200 hover:bg-secondary-50 cursor-pointer ${
                  !notification.read ? getPriorityColor(notification.priority) : 'border-l-secondary-300 bg-white'
                }`}
                onClick={() => {
                  if (!notification.read) {
                    markAsRead(notification.id);
                  }
                  if (notification.task_id) {
                    window.location.href = `/tasks/${notification.task_id}`;
                  }
                  onClose();
                }}
              >
                <div className="flex items-start">
                  <div className="text-2xl mr-3 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`text-sm font-medium ${!notification.read ? 'text-secondary-900' : 'text-secondary-700'}`}>
                        {notification.title}
                      </h4>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                      )}
                    </div>
                    <p className={`text-sm ${!notification.read ? 'text-secondary-700' : 'text-secondary-600'} mb-2`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-secondary-500">
                      {format(new Date(notification.sent_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;