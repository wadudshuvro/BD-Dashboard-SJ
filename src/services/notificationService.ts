import { supabase } from '@/integrations/supabase/client';
import type { CreateNotificationData, Notification } from '@/types/notifications';

/**
 * Create mention notifications for users mentioned in a comment
 */
export async function createMentionNotifications(
  commentId: string,
  taskId: string,
  taskTitle: string,
  mentionedUserIds: string[],
  actorId: string,
  commentPreview: string
): Promise<void> {
  // Don't notify the author
  const usersToNotify = Array.from(new Set(mentionedUserIds)).filter(id => id !== actorId);
  
  if (usersToNotify.length === 0) {
    return;
  }

  const notifications: CreateNotificationData[] = usersToNotify.map(userId => ({
    user_id: userId,
    type: 'TASK_MENTION',
    task_id: taskId,
    comment_id: commentId,
    actor_id: actorId,
    title: 'You were mentioned in a comment',
    message: `${taskTitle}: "${commentPreview.substring(0, 150)}${commentPreview.length > 150 ? '...' : ''}"`,
    link_url: `/bd/actions/tasks/${taskId}#comment-${commentId}`,
  }));

  const { error } = await supabase
    .from('notifications')
    .insert(notifications);

  if (error) {
    console.error('Failed to create mention notifications:', error);
    throw error;
  }
}

/**
 * Create notification for assignee change
 */
export async function createAssigneeChangeNotification(
  taskId: string,
  taskTitle: string,
  oldAssigneeId: string | null,
  newAssigneeId: string | null,
  actorId: string
): Promise<void> {
  // Only notify if there's a new assignee and it's not the person making the change
  if (!newAssigneeId || newAssigneeId === actorId || newAssigneeId === oldAssigneeId) {
    return;
  }

  const notification: CreateNotificationData = {
    user_id: newAssigneeId,
    type: 'TASK_ASSIGNEE_CHANGED',
    task_id: taskId,
    actor_id: actorId,
    title: 'You were assigned a task',
    message: `You have been assigned to: ${taskTitle}`,
    link_url: `/bd/actions/tasks/${taskId}`,
  };

  const { error } = await supabase
    .from('notifications')
    .insert(notification);

  if (error) {
    console.error('Failed to create assignee notification:', error);
    throw error;
  }
}

/**
 * Fetch user notifications
 */
export async function fetchNotifications(
  userId: string,
  unreadOnly: boolean = false
): Promise<Notification[]> {
  let query = supabase
    .from('notifications')
    .select(`
      id,
      user_id,
      type,
      task_id,
      comment_id,
      actor_id,
      title,
      message,
      link_url,
      read_at,
      created_at,
      actor:profiles!notifications_actor_id_fkey(
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (unreadOnly) {
    query = query.is('read_at', null);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch notifications:', error);
    throw error;
  }

  return (data || []) as unknown as Notification[];
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId);

  if (error) {
    console.error('Failed to mark notification as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);

  if (error) {
    console.error('Failed to mark all notifications as read:', error);
    throw error;
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null);

  if (error) {
    console.error('Failed to get unread count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Delete old read notifications (cleanup)
 */
export async function deleteOldNotifications(userId: string, daysOld: number = 30): Promise<void> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId)
    .not('read_at', 'is', null)
    .lt('read_at', cutoffDate.toISOString());

  if (error) {
    console.error('Failed to delete old notifications:', error);
  }
}

