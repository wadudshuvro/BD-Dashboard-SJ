import DOMPurify from 'dompurify';

interface SafeHtmlContentProps {
  html: string;
  className?: string;
}

/**
 * Safely renders HTML content with DOMPurify sanitization to prevent XSS attacks
 */
export function SafeHtmlContent({ html, className = '' }: SafeHtmlContentProps) {
  // Configure DOMPurify to allow safe HTML tags and attributes
  const sanitizedHtml = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'b', 'i', 'u', 'strike', 'strong', 'em', 'a', 'img',
      'ul', 'ol', 'li', 'br', 'p', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'target', 'rel', 'style', 'class'],
    ALLOW_DATA_ATTR: false,
    // Keep links safe
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });

  return (
    <div
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
