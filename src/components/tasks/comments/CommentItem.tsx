import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';
import { Edit2, X, Check } from 'lucide-react';
import type { TaskComment } from '@/types/comments';
import { MentionText } from './MentionText';
import { useAuth } from '@/hooks/useAuth';

interface CommentItemProps {
  comment: TaskComment;
  onUpdate?: (commentId: string, newText: string) => void;
  isUpdating?: boolean;
}

export function CommentItem({ comment, onUpdate, isUpdating = false }: CommentItemProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');

  const authorName = comment.author?.full_name || comment.author?.email || 'Unknown User';
  const authorInitials = authorName.substring(0, 2).toUpperCase();
  const isOwnComment = user?.id === comment.author_id;

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
          {!isEditing && isOwnComment && onUpdate && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 ml-auto"
              onClick={handleStartEdit}
              title="Edit comment"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <div className="border rounded-md">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[80px] resize-none text-sm border-0 focus-visible:ring-0"
                placeholder="Edit your comment..."
                disabled={isUpdating}
                autoFocus
              />
              {/* Preview area */}
              {editText && (
                <div className="border-t bg-muted/30 p-3">
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
