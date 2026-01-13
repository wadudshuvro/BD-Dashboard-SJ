import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { MentionDropdown } from './MentionDropdown';
import { findMentionTriggerPosition, getMentionSearchQuery, insertMention } from '@/utils/mentionParser';

interface CommentComposerProps {
  onSubmit: (text: string) => void;
  isSubmitting: boolean;
}

const MAX_LENGTH = 4000;

export function CommentComposer({ onSubmit, isSubmitting }: CommentComposerProps) {
  const [text, setText] = useState('');
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [mentionTriggerPos, setMentionTriggerPos] = useState(-1);
  const [mentionSearchQuery, setMentionSearchQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    const cursorPosition = e.target.selectionStart;

    setText(newText);

    // Check for @ mention trigger
    const triggerPos = findMentionTriggerPosition(newText, cursorPosition);
    
    if (triggerPos !== -1) {
      const searchQuery = getMentionSearchQuery(newText, triggerPos, cursorPosition);
      setMentionTriggerPos(triggerPos);
      setMentionSearchQuery(searchQuery);
      
      // Calculate dropdown position
      if (textareaRef.current) {
        const rect = textareaRef.current.getBoundingClientRect();
        setMentionPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
        });
      }
      
      setShowMentionDropdown(true);
    } else {
      setShowMentionDropdown(false);
    }
  };

  const handleMentionSelect = (userId: string, userName: string) => {
    if (mentionTriggerPos === -1 || !textareaRef.current) return;

    const cursorPosition = textareaRef.current.selectionStart;
    
    // Remove the @ and search text
    const textBeforeMention = text.substring(0, mentionTriggerPos);
    const textAfterCursor = text.substring(cursorPosition);
    const textWithoutMention = textBeforeMention + textAfterCursor;

    // Insert mention token
    const result = insertMention(textWithoutMention, mentionTriggerPos, userName, userId);
    
    setText(result.text);
    setShowMentionDropdown(false);
    setMentionTriggerPos(-1);

    // Focus and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(result.cursorPosition, result.cursorPosition);
      }
    }, 0);
  };

  const handleSubmit = () => {
    const trimmedText = text.trim();
    if (!trimmedText || isSubmitting) return;

    onSubmit(trimmedText);
    setText('');
    setShowMentionDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Don't submit on Enter if mention dropdown is open
    if (e.key === 'Enter' && !e.shiftKey && !showMentionDropdown) {
      e.preventDefault();
      handleSubmit();
    }

    // Close mention dropdown on Escape
    if (e.key === 'Escape' && showMentionDropdown) {
      e.preventDefault();
      setShowMentionDropdown(false);
    }
  };

  const remainingChars = MAX_LENGTH - text.length;
  const isOverLimit = remainingChars < 0;

  return (
    <div className="space-y-2">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Write a comment... Type @ to mention someone"
          className="min-h-[100px] resize-none"
          disabled={isSubmitting}
        />
        
        {showMentionDropdown && (
          <MentionDropdown
            searchQuery={mentionSearchQuery}
            onSelect={handleMentionSelect}
            position={mentionPosition}
          />
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className={`text-xs ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
          {remainingChars} characters remaining
        </span>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setText('')}
            disabled={!text || isSubmitting}
          >
            Clear
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={!text.trim() || isSubmitting || isOverLimit}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Post Comment
          </Button>
        </div>
      </div>
    </div>
  );
}

