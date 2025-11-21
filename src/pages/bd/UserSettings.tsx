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
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    title: ''
  });
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    loadNotificationPreferences();
    loadUserProfile();
  }, [user]);

  async function loadUserProfile() {
    if (!user) return;
    
    setIsLoadingProfile(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('first_name, last_name, title')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setProfileData({
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          title: data.title || ''
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile information.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingProfile(false);
    }
  }

  async function loadNotificationPreferences() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data?.notification_preferences && typeof data.notification_preferences === 'object') {
        setNotifications(prev => ({
          ...prev,
          ...(data.notification_preferences as Record<string, boolean>),
        }));
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  }

  async function saveProfileInformation() {
    if (!user) return;
    
    setIsSavingProfile(true);
    try {
      const { error: usersError } = await supabase
        .from('users')
        .update({
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          title: profileData.title,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (usersError) throw usersError;
      
      const fullName = `${profileData.firstName} ${profileData.lastName}`.trim();
      if (fullName) {
        const { error: profilesError } = await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
        
        if (profilesError) {
          console.warn('Failed to sync full_name to profiles:', profilesError);
        }
      }
      
      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully."
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile information.",
        variant: "destructive"
      });
    } finally {
      setIsSavingProfile(false);
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
              <Input 
                id="firstName" 
                placeholder="First Name"
                value={profileData.firstName}
                onChange={(e) => setProfileData(prev => ({ 
                  ...prev, 
                  firstName: e.target.value 
                }))}
                disabled={isLoadingProfile}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input 
                id="lastName" 
                placeholder="Last Name"
                value={profileData.lastName}
                onChange={(e) => setProfileData(prev => ({ 
                  ...prev, 
                  lastName: e.target.value 
                }))}
                disabled={isLoadingProfile}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue={user?.email || ''} disabled />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input 
              id="title" 
              placeholder="Job Title"
              value={profileData.title}
              onChange={(e) => setProfileData(prev => ({ 
                ...prev, 
                title: e.target.value 
              }))}
              disabled={isLoadingProfile}
            />
          </div>
          
          <Button 
            onClick={saveProfileInformation}
            disabled={isSavingProfile || isLoadingProfile}
          >
            {isSavingProfile ? 'Saving...' : 'Save Changes'}
          </Button>
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
