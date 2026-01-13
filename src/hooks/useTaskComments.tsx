import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import type { TaskComment, CreateCommentData } from '@/types/comments';
import { extractMentionedUserIds } from '@/utils/mentionParser';
import { createMentionNotifications } from '@/services/notificationService';
import { handleSupabaseError } from '@/utils/supabaseErrors';

export const useTaskComments = (taskId?: string) => {
  const queryClient = useQueryClient();

  // Fetch comments for a task
  const { data: comments = [], isLoading, error, refetch } = useQuery({
    queryKey: ['task-comments', taskId],
    queryFn: async () => {
      if (!taskId) return [];

      try {
        // Use type assertion to work around missing table types
        const { data, error } = await (supabase as any)
          .from('task_comments')
          .select(`
            id,
            task_id,
            author_id,
            body_text,
            created_at,
            updated_at,
            edited,
            author:profiles!task_comments_author_id_fkey(
              id,
              full_name,
              email,
              avatar_url
            ),
            mentions:task_comment_mentions(
              id,
              comment_id,
              mentioned_user_id,
              created_at
            )
          `)
          .eq('task_id', taskId)
          .order('created_at', { ascending: true });

        if (error) {
          handleSupabaseError(error, 'task_comments');
        }
        return (data || []) as TaskComment[];
      } catch (error) {
        // Re-throw to let React Query handle it
        throw error;
      }
    },
    enabled: !!taskId,
    staleTime: 30000, // 30 seconds
  });

  // Create comment
  const createComment = useMutation({
    mutationFn: async ({ data: commentData, taskTitle }: { data: CreateCommentData; taskTitle: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      try {
        // Create comment using type assertion
        const { data: comment, error: commentError } = await (supabase as any)
          .from('task_comments')
          .insert({
            task_id: commentData.task_id,
            author_id: user.id,
            body_text: commentData.body_text,
          })
          .select()
          .single();

        if (commentError) {
          handleSupabaseError(commentError, 'task_comments');
        }

        // Extract mentioned user IDs from text
        const mentionedUserIds = extractMentionedUserIds(commentData.body_text);

        // Create mention records if any
        if (mentionedUserIds.length > 0) {
          const mentions = mentionedUserIds.map(userId => ({
            comment_id: comment.id,
            mentioned_user_id: userId,
          }));

          const { error: mentionError } = await (supabase as any)
            .from('task_comment_mentions')
            .insert(mentions);

          if (mentionError) {
            console.error('Failed to create mentions:', mentionError);
          }

          // Create notifications for mentioned users
          try {
            await createMentionNotifications(
              comment.id,
              commentData.task_id,
              taskTitle,
              mentionedUserIds,
              user.id,
              commentData.body_text
            );
          } catch (notifError) {
            console.error('Failed to create mention notifications:', notifError);
          }
        }

        return comment;
      } catch (error) {
        // Re-throw to let React Query handle it
        throw error;
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', variables.data.task_id] });
      toast({
        title: "Comment posted",
        description: "Your comment has been added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to post comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update comment
  const updateComment = useMutation({
    mutationFn: async ({ commentId, bodyText }: { commentId: string; bodyText: string }) => {
      try {
        // Use type assertion
        const { data, error } = await (supabase as any)
          .from('task_comments')
          .update({ body_text: bodyText })
          .eq('id', commentId)
          .select()
          .single();

        if (error) {
          handleSupabaseError(error, 'task_comments');
        }
        return data;
      } catch (error) {
        // Re-throw to let React Query handle it
        throw error;
      }
    },
    onSuccess: (_data, _variables, context: any) => {
      if (context?.taskId) {
        queryClient.invalidateQueries({ queryKey: ['task-comments', context.taskId] });
      }
      toast({
        title: "Comment updated",
        description: "Your comment has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    comments,
    isLoading,
    error,
    refetch,
    createComment: createComment.mutate,
    createCommentAsync: createComment.mutateAsync,
    updateComment: updateComment.mutate,
    isCreating: createComment.isPending,
    isUpdating: updateComment.isPending,
  };
};
