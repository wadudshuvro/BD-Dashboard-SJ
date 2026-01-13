import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import type { TaskComment } from '@/types/comments';
import { MentionText } from './MentionText';

interface CommentItemProps {
  comment: TaskComment;
}

export function CommentItem({ comment }: CommentItemProps) {
  const authorName = comment.author?.full_name || comment.author?.email || 'Unknown User';
  const authorInitials = authorName.substring(0, 2).toUpperCase();

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
        </div>

        <div className="text-sm text-foreground whitespace-pre-wrap break-words">
          <MentionText text={comment.body_text} />
        </div>
      </div>
    </div>
  );
}

