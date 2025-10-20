import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSyncControlTowerDeals } from '@/hooks/useSyncControlTowerDeals';
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

export function SyncControlTowerButton() {
  const { syncDeals, isSyncing } = useSyncControlTowerDeals();

  const handleSync = async () => {
    await syncDeals();
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={isSyncing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync from Control Tower'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sync Active Deals from Control Tower?</AlertDialogTitle>
          <AlertDialogDescription>
            This will copy all active deals from Control Tower to your BD database.
            Existing deals will be updated with the latest information.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSync}>
            Sync Deals
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
