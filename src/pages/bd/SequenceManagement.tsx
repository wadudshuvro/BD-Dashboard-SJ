import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SequenceDialog } from "@/components/bd/sequences/SequenceDialog";
import { SequenceList } from "@/components/bd/sequences/SequenceList";
import type { SequenceWithSteps } from "@/Api/sequences";

export default function SequenceManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSequence, setEditingSequence] = useState<SequenceWithSteps | undefined>(undefined);

  const handleEdit = (sequence: SequenceWithSteps) => {
    setEditingSequence(sequence);
    setDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingSequence(undefined);
    }
  };

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

      <SequenceList onEditSequence={handleEdit} />

      <SequenceDialog
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        sequence={editingSequence}
      />
    </div>
  );
}
