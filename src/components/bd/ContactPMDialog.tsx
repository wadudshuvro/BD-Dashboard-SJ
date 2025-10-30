import { useState } from 'react';
import { Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSendPMEmail } from '@/hooks/useSendPMEmail';

interface ContactPMDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId: string;
  dealTitle: string;
  dealSlug?: string;
  dealStage?: string;
  pmName: string;
  pmEmail: string;
}

export function ContactPMDialog({
  open,
  onOpenChange,
  dealId,
  dealTitle,
  dealSlug,
  dealStage,
  pmName,
  pmEmail,
}: ContactPMDialogProps) {
  const [subject, setSubject] = useState(`Re: ${dealTitle}`);
  const [message, setMessage] = useState('');
  const { mutate: sendEmail, isPending } = useSendPMEmail();

  const handleSend = () => {
    const dealUrl = dealSlug && dealStage 
      ? `${window.location.origin}/${dealStage}/${dealSlug}` 
      : undefined;

    sendEmail({
      dealId,
      recipientEmail: pmEmail,
      recipientName: pmName,
      subject,
      message,
      dealTitle,
      dealUrl,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setSubject(`Re: ${dealTitle}`);
        setMessage('');
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contact Project Manager
          </DialogTitle>
          <DialogDescription>
            Send an email to {pmName} regarding this deal
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              value={`${pmName} <${pmEmail}>`}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message here..."
              className="min-h-[200px]"
            />
          </div>

          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
            <strong>Note:</strong> This email will include a link to the deal details and will be logged in the deal's activity history.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={!message.trim() || isPending}>
            {isPending ? 'Sending...' : 'Send Email'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
