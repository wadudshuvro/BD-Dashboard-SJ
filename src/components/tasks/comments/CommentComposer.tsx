import { useState, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Bold, Italic, Code, List, ListOrdered, Link as LinkIcon, Image } from 'lucide-react';
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
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
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

  const applyFormatting = (format: 'bold' | 'italic' | 'code' | 'bullet' | 'numbering') => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = text.substring(start, end);

    let formattedText = '';
    let cursorOffset = 0;
    const lineStart = text.lastIndexOf('\n', start - 1) + 1;

    switch (format) {
      case 'bold':
        formattedText = `**${selectedText || 'bold text'}**`;
        cursorOffset = selectedText ? 2 : 2;
        break;
      case 'italic':
        formattedText = `*${selectedText || 'italic text'}*`;
        cursorOffset = selectedText ? 1 : 1;
        break;
      case 'code':
        formattedText = `\`${selectedText || 'code'}\``;
        cursorOffset = selectedText ? 1 : 1;
        break;
      case 'bullet':
        // If at start of line, add bullet point
        const bulletPrefix = lineStart === start ? '• ' : '\n• ';
        formattedText = bulletPrefix + (selectedText || 'List item');
        cursorOffset = bulletPrefix.length;
        break;
      case 'numbering':
        // Count existing numbered items
        const linesBeforeCursor = text.substring(0, start).split('\n');
        const lastNumberedItem = linesBeforeCursor.reverse().find(line => /^\d+\.\s/.test(line));
        const nextNumber = lastNumberedItem ? parseInt(lastNumberedItem.match(/^(\d+)/)?.[1] || '1') + 1 : 1;
        const numberPrefix = lineStart === start ? `${nextNumber}. ` : `\n${nextNumber}. `;
        formattedText = numberPrefix + (selectedText || 'List item');
        cursorOffset = numberPrefix.length;
        break;
    }

    const newText = text.substring(0, start) + formattedText + text.substring(end);
    setText(newText);

    // Set cursor position after formatting
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = selectedText
          ? start + formattedText.length
          : start + cursorOffset + (format === 'bullet' || format === 'numbering' ? (selectedText ? selectedText.length : 'List item'.length) : (formattedText.length - cursorOffset * 2));
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleAddLink = () => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = text.substring(start, end);

    setLinkText(selectedText || '');
    setLinkUrl('');
    setShowLinkDialog(true);
  };

  const insertLink = () => {
    if (!linkUrl.trim()) return;

    const start = textareaRef.current?.selectionStart || 0;
    const end = textareaRef.current?.selectionEnd || 0;

    const linkMarkdown = `[${linkText || linkUrl}](${linkUrl})`;
    const newText = text.substring(0, start) + linkMarkdown + text.substring(end);
    setText(newText);

    setShowLinkDialog(false);
    setLinkUrl('');
    setLinkText('');

    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = start + linkMarkdown.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleAddImage = () => {
    setImageUrl('');
    setImageAlt('');
    setShowImageDialog(true);
  };

  const insertImage = () => {
    if (!imageUrl.trim()) return;

    const start = textareaRef.current?.selectionStart || 0;
    const imageMarkdown = `![${imageAlt || 'Image'}](${imageUrl})`;
    const newText = text.substring(0, start) + imageMarkdown + text.substring(start);
    setText(newText);

    setShowImageDialog(false);
    setImageUrl('');
    setImageAlt('');

    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = start + imageMarkdown.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
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


      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Text Formatting */}
          <div className="flex gap-1 border-r pr-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => applyFormatting('bold')}
              disabled={isSubmitting}
              title="Bold"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => applyFormatting('italic')}
              disabled={isSubmitting}
              title="Italic"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => applyFormatting('code')}
              disabled={isSubmitting}
              title="Inline Code"
            >
              <Code className="h-4 w-4" />
            </Button>
          </div>

          {/* Lists */}
          <div className="flex gap-1 border-r pr-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => applyFormatting('bullet')}
              disabled={isSubmitting}
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => applyFormatting('numbering')}
              disabled={isSubmitting}
              title="Numbered List"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
          </div>

          {/* Media & Links */}
          <div className="flex gap-1 border-r pr-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleAddLink}
              disabled={isSubmitting}
              title="Insert Link"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleAddImage}
              disabled={isSubmitting}
              title="Insert Image"
            >
              <Image className="h-4 w-4" />
            </Button>
          </div>

          <span className={`text-xs ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
            {remainingChars} chars
          </span>
        </div>

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

      {/* Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Link Text</label>
              <Input
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Enter link text"
              />
            </div>
            <div>
              <label className="text-sm font-medium">URL</label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                type="url"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
              Cancel
            </Button>
            <Button onClick={insertLink} disabled={!linkUrl.trim()}>
              Insert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Image URL</label>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                type="url"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Alt Text (optional)</label>
              <Input
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Image description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImageDialog(false)}>
              Cancel
            </Button>
            <Button onClick={insertImage} disabled={!imageUrl.trim()}>
              Insert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
