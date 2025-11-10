import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSyncHubSpot } from '@/hooks/useSyncHubSpot';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function SyncHubSpotButton() {
  const { syncHubSpot, isSyncing } = useSyncHubSpot();

  const handleSync = async () => {
    await syncHubSpot();
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={isSyncing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync from HubSpot'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sync from HubSpot CRM?</AlertDialogTitle>
          <AlertDialogDescription>
            This will import companies, contacts, and deals from HubSpot CRM to your BD database.
            Existing records will be updated with the latest information.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSync}>
            Sync from HubSpot
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
