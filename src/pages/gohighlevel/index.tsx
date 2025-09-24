import { useGHLIntegration, useGHLContacts, useGHLSync } from "@/features/gohighlevel/hooks";
import { ContactsList } from "@/features/gohighlevel/ContactsList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function GoHighLevelPage() {
  const { toast } = useToast();
  const { data: integration } = useGHLIntegration();
  const { data: contacts = [], isLoading } = useGHLContacts(integration?.id);
  const syncMutation = useGHLSync();

  const handleSync = async () => {
    if (!integration?.id) return;
    try {
      const result = await syncMutation.mutateAsync(integration.id);
      toast({
        title: "Sync Complete",
        description: `Synced ${result.synced || 0} contacts from GoHighLevel`
      });
    } catch (e: any) {
      toast({
        title: "Sync Failed",
        description: e.message,
        variant: "destructive"
      });
    }
  };

  if (!integration) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>GoHighLevel CRM</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Connect GoHighLevel to manage your CRM contacts and marketing automation.
            </p>
            <Button asChild>
              <a href="/adminpanel/integrations">Configure GoHighLevel Integration</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">GoHighLevel CRM</h1>
        <p className="text-muted-foreground">
          Manage your contacts and marketing automation
        </p>
      </div>

      <ContactsList
        contacts={contacts}
        isLoading={isLoading}
        onSync={handleSync}
        isSyncing={syncMutation.isPending}
      />
    </div>
  );
}