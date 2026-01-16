import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo2,
  Redo2,
  Upload,
  Loader2,
} from 'lucide-react';
import DOMPurify from 'dompurify';
import { useToast } from '@/hooks/use-toast';
import { MentionDropdown } from './MentionDropdown';
import { findMentionTriggerPosition, getMentionSearchQuery, insertMention } from '@/utils/mentionParser';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
}

const FONT_SIZES = [12, 14, 16, 18];
const DEFAULT_FONT_SIZE = 14;

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Type here... Use @ to mention someone',
  disabled = false,
  maxLength = 4000,
}: RichTextEditorProps) {
  const [html, setHtml] = useState(value);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [mentionTriggerPos, setMentionTriggerPos] = useState(-1);
  const [mentionSearchQuery, setMentionSearchQuery] = useState('');

  // Link dialog state
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkNewTab, setLinkNewTab] = useState(true);
  const [editingLink, setEditingLink] = useState<HTMLAnchorElement | null>(null);

  // Image dialog state
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [imageSource, setImageSource] = useState<'url' | 'upload'>('url');
  const [uploadingImage, setUploadingImage] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitialMountRef = useRef(true);
  const { toast } = useToast();

  // History management for undo/redo
  const [history, setHistory] = useState<string[]>([value || '']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isUpdatingHistory, setIsUpdatingHistory] = useState(false);

  // Initialize editor content on mount and sync external changes
  useEffect(() => {
    if (!editorRef.current) return;

    // On initial mount, set the content
    if (isInitialMountRef.current) {
      editorRef.current.innerHTML = value || '';
      setHtml(value || '');
      isInitialMountRef.current = false;
      return;
    }

    // Handle external clear (when parent explicitly clears)
    if (value === '' && html !== '') {
      editorRef.current.innerHTML = '';
      setHtml('');
      return;
    }

    // Don't sync back if editor is focused (user is editing)
    if (document.activeElement === editorRef.current) {
      return;
    }

    // Sync external updates when editor is not focused
    if (value !== html) {
      editorRef.current.innerHTML = value;
      setHtml(value);
    }
  }, [value]);

  // Update parent when content changes
  useEffect(() => {
    if (!isUpdatingHistory && !isInitialMountRef.current) {
      onChange(html);
    }
  }, [html, onChange, isUpdatingHistory]);

  // Save to history
  const saveToHistory = useCallback((content: string) => {
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(content);
      // Limit history to 50 entries
      if (newHistory.length > 50) {
        newHistory.shift();
      }
      return newHistory;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 49));
  }, [historyIndex]);

  // Handle input in contentEditable
  const handleInput = () => {
    if (!editorRef.current) return;

    const content = editorRef.current.innerHTML;
    const textContent = editorRef.current.textContent || '';

    // Check length limit
    if (textContent.length > maxLength) {
      toast({
        title: 'Character limit reached',
        description: `Maximum ${maxLength} characters allowed`,
        variant: 'destructive',
      });
      return;
    }

    setHtml(content);
    saveToHistory(content);

    // Check for @ mention trigger
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const cursorPosition = getCursorPosition();
      const triggerPos = findMentionTriggerPosition(textContent, cursorPosition);

      if (triggerPos !== -1) {
        const searchQuery = getMentionSearchQuery(textContent, triggerPos, cursorPosition);
        setMentionTriggerPos(triggerPos);
        setMentionSearchQuery(searchQuery);

        // Calculate dropdown position at cursor
        const range = selection.getRangeAt(0);
        const rangeRect = range.getBoundingClientRect();

        // Position dropdown at cursor location (using fixed positioning)
        setMentionPosition({
          top: rangeRect.bottom + 4,
          left: rangeRect.left,
        });

        setShowMentionDropdown(true);
      } else {
        setShowMentionDropdown(false);
      }
    }
  };

  // Get cursor position in text
  const getCursorPosition = (): number => {
    const selection = window.getSelection();
    if (!selection || !editorRef.current) return 0;

    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(editorRef.current);
    preCaretRange.setEnd(range.endContainer, range.endOffset);

    return preCaretRange.toString().length;
  };

  // Handle mention selection
  const handleMentionSelect = (userId: string, userName: string) => {
    if (!editorRef.current) return;

    const textContent = editorRef.current.textContent || '';
    const cursorPosition = getCursorPosition();

    // Remove the @ and search text
    const textBeforeMention = textContent.substring(0, mentionTriggerPos);
    const textAfterCursor = textContent.substring(cursorPosition);
    const textWithoutMention = textBeforeMention + textAfterCursor;

    // Insert mention token
    const result = insertMention(textWithoutMention, mentionTriggerPos, userName, userId);

    // Convert plain text back to HTML (preserving existing formatting)
    editorRef.current.textContent = result.text;
    setHtml(editorRef.current.innerHTML);

    setShowMentionDropdown(false);
    setMentionTriggerPos(-1);

    // Focus editor
    editorRef.current.focus();
  };

  // Execute formatting command
  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  // Format text
  const formatText = (format: 'bold' | 'italic' | 'underline' | 'strikethrough') => {
    const commands: Record<string, string> = {
      bold: 'bold',
      italic: 'italic',
      underline: 'underline',
      strikethrough: 'strikeThrough',
    };
    executeCommand(commands[format]);
  };

  // Change font size
  const changeFontSize = (size: number) => {
    setFontSize(size);
    executeCommand('fontSize', '3'); // Use a standard size first

    // Then manually set the size on selected text
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.fontSize = `${size}px`;

      try {
        range.surroundContents(span);
        handleInput();
      } catch (e) {
        // If surroundContents fails, use execCommand
        executeCommand('fontSize', '7');

        // Find all font tags and change their size
        if (editorRef.current) {
          const fontTags = editorRef.current.querySelectorAll('font[size="7"]');
          fontTags.forEach((tag) => {
            const span = document.createElement('span');
            span.style.fontSize = `${size}px`;
            span.innerHTML = tag.innerHTML;
            tag.replaceWith(span);
          });
          handleInput();
        }
      }
    }
  };

  // Insert list
  const insertList = (ordered: boolean) => {
    executeCommand(ordered ? 'insertOrderedList' : 'insertUnorderedList');
  };

  // Open link dialog
  const openLinkDialog = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();

      // Check if we're editing an existing link
      let node = range.commonAncestorContainer;
      if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentNode as Node;
      }

      let linkElement: HTMLAnchorElement | null = null;
      if (node.nodeName === 'A') {
        linkElement = node as HTMLAnchorElement;
      } else {
        // Check if selection is within a link
        let parent = node.parentElement;
        while (parent && parent !== editorRef.current) {
          if (parent.nodeName === 'A') {
            linkElement = parent as HTMLAnchorElement;
            break;
          }
          parent = parent.parentElement;
        }
      }

      if (linkElement) {
        // Editing existing link
        setLinkText(linkElement.textContent || '');
        setLinkUrl(linkElement.href);
        setLinkNewTab(linkElement.target === '_blank');
        setEditingLink(linkElement);
      } else {
        // Creating new link
        setLinkText(selectedText);
        setLinkUrl('');
        setLinkNewTab(true);
        setEditingLink(null);
      }
    }

    setShowLinkDialog(true);
  };

  // Validate URL
  const isValidUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // Insert/update link
  const insertLink = () => {
    if (!linkUrl.trim()) {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid URL',
        variant: 'destructive',
      });
      return;
    }

    if (!isValidUrl(linkUrl)) {
      toast({
        title: 'Invalid URL',
        description: 'URL must start with http:// or https://',
        variant: 'destructive',
      });
      return;
    }

    if (editingLink) {
      // Update existing link
      editingLink.href = linkUrl;
      editingLink.textContent = linkText || linkUrl;
      if (linkNewTab) {
        editingLink.target = '_blank';
        editingLink.rel = 'noopener noreferrer';
      } else {
        editingLink.removeAttribute('target');
        editingLink.removeAttribute('rel');
      }
      handleInput();
    } else {
      // Create new link
      const link = document.createElement('a');
      link.href = linkUrl;
      link.textContent = linkText || linkUrl;
      if (linkNewTab) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }

      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(link);

        // Move cursor after link
        range.setStartAfter(link);
        range.setEndAfter(link);
        selection.removeAllRanges();
        selection.addRange(range);

        handleInput();
      }
    }

    setShowLinkDialog(false);
    setLinkUrl('');
    setLinkText('');
    setEditingLink(null);
    editorRef.current?.focus();
  };

  // Open image dialog
  const openImageDialog = () => {
    setImageUrl('');
    setImageAlt('');
    setImageSource('url');
    setShowImageDialog(true);
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Image must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploadingImage(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setImageUrl(base64);
        setUploadingImage(false);
      };
      reader.onerror = () => {
        toast({
          title: 'Upload failed',
          description: 'Failed to read image file',
          variant: 'destructive',
        });
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'An error occurred while uploading the image',
        variant: 'destructive',
      });
      setUploadingImage(false);
    }
  };

  // Insert image
  const insertImage = () => {
    if (!imageUrl.trim()) {
      toast({
        title: 'Invalid image',
        description: 'Please provide an image URL or upload a file',
        variant: 'destructive',
      });
      return;
    }

    // Validate URL if not base64
    if (!imageUrl.startsWith('data:') && !isValidUrl(imageUrl)) {
      toast({
        title: 'Invalid URL',
        description: 'Image URL must start with http:// or https://',
        variant: 'destructive',
      });
      return;
    }

    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = imageAlt || 'Image';
    img.style.maxWidth = '100%';
    img.style.height = 'auto';

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(img);

      // Add space after image
      const space = document.createTextNode(' ');
      range.setStartAfter(img);
      range.insertNode(space);
      range.setStartAfter(space);
      range.setEndAfter(space);
      selection.removeAllRanges();
      selection.addRange(range);

      handleInput();
    }

    setShowImageDialog(false);
    setImageUrl('');
    setImageAlt('');
    editorRef.current?.focus();
  };

  // Undo
  const undo = () => {
    if (historyIndex > 0) {
      setIsUpdatingHistory(true);
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const content = history[newIndex];
      setHtml(content);
      if (editorRef.current) {
        editorRef.current.innerHTML = content;
      }
      setTimeout(() => setIsUpdatingHistory(false), 0);
    }
  };

  // Redo
  const redo = () => {
    if (historyIndex < history.length - 1) {
      setIsUpdatingHistory(true);
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const content = history[newIndex];
      setHtml(content);
      if (editorRef.current) {
        editorRef.current.innerHTML = content;
      }
      setTimeout(() => setIsUpdatingHistory(false), 0);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + B for bold
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      formatText('bold');
    }
    // Ctrl/Cmd + I for italic
    else if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      formatText('italic');
    }
    // Ctrl/Cmd + U for underline
    else if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
      e.preventDefault();
      formatText('underline');
    }
    // Ctrl/Cmd + Shift + S for strikethrough
    else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 's') {
      e.preventDefault();
      formatText('strikethrough');
    }
    // Ctrl/Cmd + Z for undo
    else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    }
    // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y for redo
    else if ((e.ctrlKey || e.metaKey) && (e.shiftKey && e.key === 'z' || e.key === 'y')) {
      e.preventDefault();
      redo();
    }
    // Escape to close mention dropdown
    else if (e.key === 'Escape' && showMentionDropdown) {
      e.preventDefault();
      setShowMentionDropdown(false);
    }
  };

  // Sanitize HTML for preview
  const getSanitizedHtml = () => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'u', 'strike', 'strong', 'em', 'a', 'img', 'ul', 'ol', 'li', 'br', 'p', 'div', 'span'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'target', 'rel', 'style'],
      ALLOW_DATA_ATTR: false,
    });
  };

  const textLength = editorRef.current?.textContent?.length || 0;
  const remainingChars = maxLength - textLength;
  const isOverLimit = remainingChars < 0;

  return (
    <div className="space-y-2">
      <TooltipProvider>
        <div className="border rounded-md bg-background">
          {/* Toolbar */}
          <div className="border-b p-2 flex flex-wrap items-center gap-2 bg-muted/30">
            {/* Text Formatting */}
            <div className="flex items-center gap-1 border-r pr-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => formatText('bold')}
                    disabled={disabled}
                    aria-label="Bold (Ctrl+B)"
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bold (Ctrl+B)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => formatText('italic')}
                    disabled={disabled}
                    aria-label="Italic (Ctrl+I)"
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Italic (Ctrl+I)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => formatText('underline')}
                    disabled={disabled}
                    aria-label="Underline (Ctrl+U)"
                  >
                    <Underline className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Underline (Ctrl+U)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => formatText('strikethrough')}
                    disabled={disabled}
                    aria-label="Strikethrough (Ctrl+Shift+S)"
                  >
                    <Strikethrough className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Strikethrough (Ctrl+Shift+S)</TooltipContent>
              </Tooltip>
            </div>

            {/* Font Size */}
            <div className="flex items-center gap-2 border-r pr-2">
              <Select
                value={fontSize.toString()}
                onValueChange={(value) => changeFontSize(parseInt(value))}
                disabled={disabled}
              >
                <SelectTrigger className="h-8 w-[70px]" aria-label="Font size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_SIZES.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}px
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lists */}
            <div className="flex items-center gap-1 border-r pr-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => insertList(false)}
                    disabled={disabled}
                    aria-label="Bulleted list"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bulleted list</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => insertList(true)}
                    disabled={disabled}
                    aria-label="Numbered list"
                  >
                    <ListOrdered className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Numbered list</TooltipContent>
              </Tooltip>
            </div>

            {/* Media & Links */}
            <div className="flex items-center gap-1 border-r pr-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={openLinkDialog}
                    disabled={disabled}
                    aria-label="Insert link"
                  >
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Insert link</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={openImageDialog}
                    disabled={disabled}
                    aria-label="Insert image"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Insert image</TooltipContent>
              </Tooltip>
            </div>

            {/* Undo/Redo */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={undo}
                    disabled={disabled || historyIndex === 0}
                    aria-label="Undo (Ctrl+Z)"
                  >
                    <Undo2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={redo}
                    disabled={disabled || historyIndex === history.length - 1}
                    aria-label="Redo (Ctrl+Y)"
                  >
                    <Redo2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
              </Tooltip>
            </div>

            {/* Character Count */}
            <div className="ml-auto text-xs text-muted-foreground">
              <span className={isOverLimit ? 'text-destructive font-medium' : ''}>
                {remainingChars} chars
              </span>
            </div>
          </div>

          {/* Editor */}
          <div
            ref={editorRef}
            contentEditable={!disabled}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            dir="ltr"
            className="min-h-[120px] max-h-[400px] overflow-y-auto p-3 focus:outline-none text-sm max-w-none rte-editor"
            style={{
              fontSize: `${DEFAULT_FONT_SIZE}px`,
              direction: 'ltr',
              textAlign: 'left',
              unicodeBidi: 'embed'
            }}
            data-placeholder={placeholder}
            aria-label="Rich text editor"
          />

          {/* Mention Dropdown */}
          {showMentionDropdown && (
            <MentionDropdown
              searchQuery={mentionSearchQuery}
              onSelect={handleMentionSelect}
              position={mentionPosition}
            />
          )}
        </div>
      </TooltipProvider>

      {/* Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLink ? 'Edit Link' : 'Insert Link'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="link-text">Link Text</Label>
              <Input
                id="link-text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Enter link text"
              />
            </div>
            <div>
              <Label htmlFor="link-url">URL *</Label>
              <Input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                type="url"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="link-new-tab"
                checked={linkNewTab}
                onCheckedChange={(checked) => setLinkNewTab(checked as boolean)}
              />
              <Label htmlFor="link-new-tab" className="text-sm font-normal cursor-pointer">
                Open in new tab
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
              Cancel
            </Button>
            <Button onClick={insertLink} disabled={!linkUrl.trim()}>
              {editingLink ? 'Update' : 'Insert'}
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
              <Label>Image Source</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant={imageSource === 'url' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImageSource('url')}
                >
                  URL
                </Button>
                <Button
                  type="button"
                  variant={imageSource === 'upload' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImageSource('upload')}
                >
                  Upload
                </Button>
              </div>
            </div>

            {imageSource === 'url' ? (
              <div>
                <Label htmlFor="image-url">Image URL *</Label>
                <Input
                  id="image-url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  type="url"
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="image-file">Upload Image *</Label>
                <Input
                  id="image-file"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploadingImage}
                />
                {uploadingImage && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Converting image...
                  </div>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="image-alt">Alt Text (optional)</Label>
              <Input
                id="image-alt"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Image description"
              />
            </div>

            {imageUrl && (
              <div className="border rounded p-2">
                <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                <img
                  src={imageUrl}
                  alt={imageAlt || 'Preview'}
                  className="max-w-full h-auto max-h-[200px]"
                  onError={() => {
                    toast({
                      title: 'Invalid image',
                      description: 'Failed to load image',
                      variant: 'destructive',
                    });
                  }}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImageDialog(false)}>
              Cancel
            </Button>
            <Button onClick={insertImage} disabled={!imageUrl.trim() || uploadingImage}>
              Insert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden styles for placeholder */}
      <style>{`
        .rte-editor[contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          display: block;
        }
        .rte-editor[contenteditable] {
          caret-color: currentColor !important;
          direction: ltr !important;
          text-align: left !important;
          unicode-bidi: embed !important;
          writing-mode: horizontal-tb !important;
        }
        .rte-editor[contenteditable]:focus {
          outline: none;
        }
        .rte-editor[contenteditable]:empty {
          min-height: 120px;
        }
        .rte-editor[contenteditable] *,
        .rte-editor[contenteditable] p,
        .rte-editor[contenteditable] div,
        .rte-editor[contenteditable] span,
        .rte-editor[contenteditable] br {
          direction: ltr !important;
          text-align: left !important;
          unicode-bidi: embed !important;
        }
      `}</style>
    </div>
  );
}
