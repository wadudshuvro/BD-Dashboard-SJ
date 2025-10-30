import { useState } from 'react';
import { Bell, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useScheduleReminder } from '@/hooks/useDealReminders';
import { cn } from '@/lib/utils';

interface SendReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId: string;
  dealTitle: string;
  ownerEmail?: string;
  ownerName?: string;
  pmEmail?: string;
  pmName?: string;
}

export function SendReminderDialog({
  open,
  onOpenChange,
  dealId,
  dealTitle,
  ownerEmail,
  ownerName,
  pmEmail,
  pmName,
}: SendReminderDialogProps) {
  const [recipientType, setRecipientType] = useState<'pm' | 'owner' | 'custom'>('pm');
  const [customEmail, setCustomEmail] = useState('');
  const [reminderType, setReminderType] = useState('follow_up');
  const [message, setMessage] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState('09:00');

  const { mutate: scheduleReminder, isPending } = useScheduleReminder();

  const getRecipientEmail = () => {
    if (recipientType === 'pm' && pmEmail) return pmEmail;
    if (recipientType === 'owner' && ownerEmail) return ownerEmail;
    return customEmail;
  };

  const handleSchedule = () => {
    const recipientEmail = getRecipientEmail();
    if (!recipientEmail || !date) return;

    // Combine date and time
    const [hours, minutes] = time.split(':').map(Number);
    const reminderDate = new Date(date);
    reminderDate.setHours(hours, minutes, 0, 0);

    scheduleReminder({
      deal_id: dealId,
      recipient_email: recipientEmail,
      reminder_type: reminderType,
      reminder_date: reminderDate.toISOString(),
      message: message || `Reminder: Follow up on ${dealTitle}`,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setMessage('');
        setDate(new Date());
        setTime('09:00');
      },
    });
  };

  const isValid = !!getRecipientEmail() && !!date;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Schedule Reminder
          </DialogTitle>
          <DialogDescription>
            Set a reminder for this deal
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Send to</Label>
            <Select value={recipientType} onValueChange={(value: any) => setRecipientType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pmEmail && (
                  <SelectItem value="pm">
                    Project Manager ({pmName || pmEmail})
                  </SelectItem>
                )}
                {ownerEmail && (
                  <SelectItem value="owner">
                    Deal Owner ({ownerName || ownerEmail})
                  </SelectItem>
                )}
                <SelectItem value="custom">Custom Email</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {recipientType === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="customEmail">Email Address</Label>
              <Input
                id="customEmail"
                type="email"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reminderType">Reminder Type</Label>
            <Select value={reminderType} onValueChange={setReminderType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="follow_up">Follow Up</SelectItem>
                <SelectItem value="deadline">Deadline</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a custom message to the reminder..."
              className="min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={!isValid || isPending}>
            {isPending ? 'Scheduling...' : 'Schedule Reminder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
