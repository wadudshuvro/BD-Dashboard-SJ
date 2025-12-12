import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export interface UserNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  link: string | null;
  read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch initial notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      // Fetch all notifications
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }

      setNotifications(data || []);

      // Count unread
      const unread = (data || []).filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase.rpc('mark_notification_as_read', {
        notification_id: notificationId,
      });

      if (error) throw error;

      // Update local state
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

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const { error } = await supabase.rpc('mark_all_notifications_as_read');

      if (error) throw error;

      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() }))
      );

      setUnreadCount(0);

      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read',
        variant: 'destructive',
      });
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      // Update unread count if the deleted notification was unread
      const wasUnread = notifications.find(n => n.id === notificationId && !n.read);
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        variant: 'destructive',
      });
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: UserNotification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate to link if provided
    if (notification.link) {
      navigate(notification.link);
    }
  };

  // Set up realtime subscription
  useEffect(() => {
    const setupSubscription = async () => {
      await fetchNotifications();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

    // Subscribe to new notifications
    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as UserNotification;

          // Add to notifications list
          setNotifications(prev => [newNotification, ...prev]);

          // Increment unread count
          if (!newNotification.read) {
            setUnreadCount(prev => prev + 1);
          }

          // Show toast notification
          toast({
            title: newNotification.title,
            description: newNotification.message,
            action: newNotification.link ? {
              label: 'View',
              onClick: () => {
                handleNotificationClick(newNotification);
              },
            } : undefined,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedNotification = payload.new as UserNotification;

          // Update notification in list
          setNotifications(prev =>
            prev.map(n => (n.id === updatedNotification.id ? updatedNotification : n))
          );

          // Update unread count
          fetchNotifications();
        }
      )
      .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupSubscription();
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    handleNotificationClick,
    refetch: fetchNotifications,
  };
}
