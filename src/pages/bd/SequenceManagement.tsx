import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SequenceDialog } from "@/components/bd/sequences/SequenceDialog";
import { SequenceList } from "@/components/bd/sequences/SequenceList";

export default function SequenceManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Outreach Sequences</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage automated multi-channel outreach sequences
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Sequence
        </Button>
      </div>

      <SequenceList />

      <SequenceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
