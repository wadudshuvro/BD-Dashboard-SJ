import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';

interface CommentComposerProps {
  onSubmit: (text: string) => void;
  isSubmitting: boolean;
}

const MAX_LENGTH = 4000;

export function CommentComposer({ onSubmit, isSubmitting }: CommentComposerProps) {
  const [html, setHtml] = useState('');

  const handleSubmit = () => {
    // Get text content to check if empty
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    const trimmedText = textContent.trim();

    if (!trimmedText || isSubmitting) return;

    onSubmit(html);
    setHtml('');
  };

  // Get text length for validation
  const getTextLength = (htmlContent: string): number => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    return (tempDiv.textContent || tempDiv.innerText || '').length;
  };

  const textLength = getTextLength(html);
  const isOverLimit = textLength > MAX_LENGTH;
  const hasContent = textLength > 0;

  return (
    <div className="space-y-2">
      <RichTextEditor
        value={html}
        onChange={setHtml}
        placeholder="Write a comment... Type @ to mention someone"
        disabled={isSubmitting}
        maxLength={MAX_LENGTH}
      />

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setHtml('')}
          disabled={!hasContent || isSubmitting}
        >
          Clear
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleSubmit}
          disabled={!hasContent || isSubmitting || isOverLimit}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Post Comment
        </Button>
      </div>
    </div>
  );
}
