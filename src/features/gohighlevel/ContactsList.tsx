import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";

export function ContactsList({ 
  contacts, 
  isLoading, 
  onSync, 
  isSyncing 
}: { 
  contacts: any[];
  isLoading: boolean;
  onSync: () => void;
  isSyncing: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-[200px] mb-2" />
              <Skeleton className="h-3 w-[150px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Contacts ({contacts.length})</h3>
        <Button 
          onClick={onSync} 
          disabled={isSyncing}
          variant="outline" 
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? "Syncing..." : "Sync"}
        </Button>
      </div>

      {contacts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No contacts found.</p>
            <Button onClick={onSync} className="mt-4" disabled={isSyncing}>
              Sync Contacts
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((contact) => (
            <Card key={contact.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{contact.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {contact.email && (
                  <div className="text-sm text-muted-foreground">
                    📧 {contact.email}
                  </div>
                )}
                {contact.phone && (
                  <div className="text-sm text-muted-foreground">
                    📱 {contact.phone}
                  </div>
                )}
                {contact.status && (
                  <Badge variant="outline" className="text-xs">
                    {contact.status}
                  </Badge>
                )}
                <div className="text-xs text-muted-foreground">
                  Added: {new Date(contact.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}