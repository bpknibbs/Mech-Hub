import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { registerPushNotifications, showBrowserNotification } from '../utils/notifications';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  task_id?: string;
  priority: string;
  sent_at: string;
  read: boolean;
  read_at?: string;
}

export const useNotifications = () => {
  const { userProfile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile) {
      fetchNotifications();
      setupRealtimeSubscription();
      setupPushNotifications();
    }
  }, [userProfile]);

  const fetchNotifications = async () => {
    if (!userProfile) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`recipient_id.eq.${userProfile.id},recipient_email.eq.${userProfile.Email}`)
        .order('sent_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!userProfile) return;

    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `recipient_email=eq.${userProfile.Email}`
        }, 
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show browser notification
          showBrowserNotification(
            newNotification.title,
            newNotification.message,
            newNotification.task_id
          );
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const setupPushNotifications = async () => {
    try {
      const registered = await registerPushNotifications();
      if (registered) {
        console.log('Push notifications enabled');
      }
    } catch (error) {
      // Silently handle environments that don't support Service Workers
      console.log('Push notifications not available in this environment');
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read: true, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!userProfile) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          read: true, 
          read_at: new Date().toISOString() 
        })
        .or(`recipient_id.eq.${userProfile.id},recipient_email.eq.${userProfile.Email}`)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications
  };
};