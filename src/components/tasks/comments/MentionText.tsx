import { RichText } from './RichText';

interface MentionTextProps {
  text: string;
  className?: string;
}

export function MentionText({ text, className = '' }: MentionTextProps) {
  // Use RichText component which handles both mentions and markdown formatting
  return <RichText text={text} className={className} />;
}

