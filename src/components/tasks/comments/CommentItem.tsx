import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';
import { Edit2, Trash2, X, Check } from 'lucide-react';
import type { TaskComment } from '@/types/comments';
import { MentionText } from './MentionText';
import { useAuth } from '@/hooks/useAuth';

interface CommentItemProps {
  comment: TaskComment;
  onUpdate?: (commentId: string, newText: string) => void;
  onDelete?: (commentId: string) => void;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

export function CommentItem({ comment, onUpdate, onDelete, isUpdating = false, isDeleting = false }: CommentItemProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');

  const authorName = comment.author?.full_name || comment.author?.email || 'Unknown User';
  const authorInitials = authorName.substring(0, 2).toUpperCase();
  const isOwnComment = user?.id === comment.author_id;

  // Check if comment is within 1 hour of creation
  const createdTime = new Date(comment.created_at);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const canDelete = isOwnComment && createdTime > oneHourAgo;

  const handleStartEdit = () => {
    // Set the raw text for editing - preserves mention format
    setEditText(comment.body_text);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText('');
  };

  const handleSaveEdit = () => {
    if (onUpdate && editText.trim() && editText !== comment.body_text) {
      onUpdate(comment.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (onDelete && canDelete) {
      onDelete(comment.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancelEdit();
    } else if (e.key === 'Enter' && e.ctrlKey) {
      handleSaveEdit();
    }
  };

  return (
    <div className="flex gap-3 py-4" id={`comment-${comment.id}`}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={comment.author?.avatar_url} />
        <AvatarFallback className="text-xs">{authorInitials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{authorName}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
          {comment.edited && (
            <span className="text-xs text-muted-foreground italic">(edited)</span>
          )}
          {!isEditing && isOwnComment && (
            <div className="flex gap-1.5 ml-auto items-center">
              {onUpdate && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-950"
                  onClick={handleStartEdit}
                  title="Edit comment"
                >
                  <Edit2 className="h-4 w-4 text-blue-600" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 w-8 p-0 ${
                    canDelete
                      ? 'hover:bg-red-50 dark:hover:bg-red-950'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={handleDelete}
                  disabled={!canDelete || isDeleting}
                  title={canDelete ? "Delete comment (within 1 hour)" : "Can only delete within 1 hour"}
                >
                  <Trash2 className={`h-4 w-4 ${
                    canDelete
                      ? 'text-red-600'
                      : 'text-muted-foreground/50'
                  }`} />
                </Button>
              )}
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <div className="border rounded-md bg-muted/30">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[80px] resize-none text-sm border-0 bg-muted/30"
                placeholder="Edit your comment..."
                disabled={isUpdating}
                autoFocus
              />
              {editText && (
                <div className="border-t px-3 py-3 bg-white dark:bg-slate-950">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Preview:</p>
                  <div className="text-sm text-foreground whitespace-pre-wrap break-words">
                    <MentionText text={editText} />
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Press Ctrl+Enter to save, Esc to cancel
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isUpdating}
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={isUpdating || !editText.trim() || editText === comment.body_text}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Save
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-foreground whitespace-pre-wrap break-words">
            <MentionText text={comment.body_text} />
          </div>
        )}
      </div>
    </div>
  );
}
