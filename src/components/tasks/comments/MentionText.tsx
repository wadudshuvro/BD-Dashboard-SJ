import { parseTextWithMentions, type TextSegment } from '@/utils/mentionParser';

interface MentionTextProps {
  text: string;
  className?: string;
}

export function MentionText({ text, className = '' }: MentionTextProps) {
  const segments = parseTextWithMentions(text);

  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (segment.type === 'mention') {
          return (
            <span
              key={index}
              className="inline-flex items-center px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium"
              title={`@${segment.userName}`}
            >
              @{segment.userName}
            </span>
          );
        }
        return <span key={index}>{segment.content}</span>;
      })}
    </span>
  );
}

