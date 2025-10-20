import { useState } from 'react';
import { Plus, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function FollowUps() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Meetings & Follow-Ups</h1>
          <p className="text-muted-foreground">Track your meetings and follow-up actions</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Follow-Up
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Follow-Ups
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No follow-ups yet. Click "Add Follow-Up" to create one.</p>
        </CardContent>
      </Card>
    </div>
  );
}
