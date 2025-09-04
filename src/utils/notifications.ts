import { supabase } from '../lib/supabase';

interface NotificationOptions {
  type: 'task_assigned' | 'task_overdue' | 'task_completed' | 'general';
  recipientEmail?: string;
  recipientId?: string;
  taskId?: string;
  message: string;
  title: string;
  priority?: 'low' | 'medium' | 'high';
}

export const sendNotification = async (options: NotificationOptions): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // The service key is now passed directly to the Edge Function, not from the client
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(options)
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Failed to send notification' };
    }

    return { success: true };

  } catch (error) {
    console.error('Error sending notification:', error);
    return { success: false, error: 'Network error sending notification' };
  }
};

// Send task assignment notification
export const notifyTaskAssigned = async (taskId: string, assignedToId: string, assignedToEmail: string) => {
  // Get task details
  const { data: task } = await supabase
    .from('tasks')
    .select(`
      task_id,
      type_of_task,
      due_date,
      priority,
      assets("Asset Name"),
      plant_rooms("Block")
    `)
    .eq('id', taskId)
    .single();

  if (!task) return { success: false, error: 'Task not found' };

  return await sendNotification({
    type: 'task_assigned',
    recipientId: assignedToId,
    recipientEmail: assignedToEmail,
    taskId,
    title: 'New Task Assigned',
    message: `You have been assigned a new ${task.type_of_task} task for ${(task.assets as any)?.["Asset Name"] || 'general maintenance'} at ${(task.plant_rooms as any)?.["Block"] || 'plant room'}. Due: ${new Date(task.due_date).toLocaleDateString()}`,
    priority: task.priority?.toLowerCase() as 'low' | 'medium' | 'high' || 'medium'
  });
};

// Send overdue task notification
export const notifyTaskOverdue = async (taskId: string, assignedToId: string, assignedToEmail: string, daysPastDue: number) => {
  const { data: task } = await supabase
    .from('tasks')
    .select(`
      task_id,
      type_of_task,
      due_date,
      assets("Asset Name"),
      plant_rooms("Block")
    `)
    .eq('id', taskId)
    .single();

  if (!task) return { success: false, error: 'Task not found' };

  return await sendNotification({
    type: 'task_overdue',
    recipientId: assignedToId,
    recipientEmail: assignedToEmail,
    taskId,
    title: 'Task Overdue Alert',
    message: `Your ${task.type_of_task} task for ${(task.assets as any)?.["Asset Name"] || 'general maintenance'} at ${(task.plant_rooms as any)?.["Block"] || 'plant room'} is ${daysPastDue} days overdue. Please complete as soon as possible.`,
    priority: 'high'
  });
};

// Send task completion notification
export const notifyTaskCompleted = async (taskId: string, completedByName: string, managerEmails: string[]) => {
  const { data: task } = await supabase
    .from('tasks')
    .select(`
      task_id,
      type_of_task,
      date_completed,
      assets("Asset Name"),
      plant_rooms("Block")
    `)
    .eq('id', taskId)
    .single();

  if (!task) return { success: false, error: 'Task not found' };

  // Send to all managers
  const results = await Promise.all(
    managerEmails.map(email =>
      sendNotification({
        type: 'task_completed',
        recipientEmail: email,
        taskId,
        title: 'Task Completed',
        message: `${completedByName} has completed the ${task.type_of_task} task for ${(task.assets as any)?.["Asset Name"] || 'general maintenance'} at ${(task.plant_rooms as any)?.["Block"] || 'plant room'}.`,
        priority: 'low'
      })
    )
  );

  return { success: results.every(r => r.success) };
};

// Register service worker for push notifications
export const registerPushNotifications = async (): Promise<boolean> => {
  // Skip service worker registration in StackBlitz/WebContainer environments
  const isStackBlitz = typeof window !== 'undefined' && (
    window.location.hostname.includes('stackblitz') ||
    window.location.hostname.includes('webcontainer') ||
    window.location.hostname.includes('local-credentialless') ||
    window.location.hostname.includes('oci3')
  );

  if (isStackBlitz || typeof navigator === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push notifications not available in this environment (StackBlitz limitation)');
    return false;
  }

  if (!('Notification' in window)) {
    console.log('Push notifications not supported');
    return false;
  }

  try {
    // Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service worker registered:', registration);

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error registering push notifications:', error);
    return false;
  }
};

// Show browser notification
export const showBrowserNotification = (title: string, message: string, taskId?: string) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body: message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: taskId || 'general',
      requireInteraction: true
    });

    notification.onclick = () => {
      window.focus();
      if (taskId) {
        window.location.href = `/tasks/${taskId}`;
      }
      notification.close();
    };
  }
};