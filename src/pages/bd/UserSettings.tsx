import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function UserSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState({
    proposal_viewed: true,
    proposal_signed: true,
    proposal_declined: true,
    proposal_expiring_soon: true,
  });

  useEffect(() => {
    loadNotificationPreferences();
  }, [user]);

  async function loadNotificationPreferences() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data?.notification_preferences) {
        setNotifications(prev => ({
          ...prev,
          ...data.notification_preferences,
        }));
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  }

  async function saveNotificationPreferences() {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ notification_preferences: notifications })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Your notification preferences have been updated.",
      });
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save notification preferences.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" placeholder="First Name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" placeholder="Last Name" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue={user?.email || ''} disabled />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="Job Title" />
          </div>
          
          <Button>Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Proposal Notifications</CardTitle>
          <CardDescription>
            Choose which email notifications you want to receive for proposal events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Proposal Viewed</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when a client views your proposal
              </p>
            </div>
            <Switch
              checked={notifications.proposal_viewed}
              onCheckedChange={(checked) =>
                setNotifications(prev => ({ ...prev, proposal_viewed: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Proposal Signed</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when a client signs your proposal
              </p>
            </div>
            <Switch
              checked={notifications.proposal_signed}
              onCheckedChange={(checked) =>
                setNotifications(prev => ({ ...prev, proposal_signed: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Proposal Declined</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when a client declines your proposal
              </p>
            </div>
            <Switch
              checked={notifications.proposal_declined}
              onCheckedChange={(checked) =>
                setNotifications(prev => ({ ...prev, proposal_declined: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Proposal Expiring Soon</Label>
              <p className="text-sm text-muted-foreground">
                Get notified 3 days before a proposal expires
              </p>
            </div>
            <Switch
              checked={notifications.proposal_expiring_soon}
              onCheckedChange={(checked) =>
                setNotifications(prev => ({ ...prev, proposal_expiring_soon: checked }))
              }
            />
          </div>

          <Button onClick={saveNotificationPreferences} disabled={loading}>
            {loading ? 'Saving...' : 'Save Notification Preferences'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
