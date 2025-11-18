import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useProposalEmbedUrl } from "@/hooks/useProposals";
import { Loader2 } from "lucide-react";

interface ProposalEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  docId: string;
}

export const ProposalEditor = ({ open, onOpenChange, docId }: ProposalEditorProps) => {
  const { data: embedUrl, isLoading, error } = useProposalEmbedUrl(docId, open);

  const isDraftStatus = error?.message?.includes("must be sent before viewing");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Proposal</DialogTitle>
        </DialogHeader>
        <div className="flex-1 h-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : embedUrl ? (
            <iframe
              src={embedUrl}
              width="100%"
              height="100%"
              allow="clipboard-write"
              className="border rounded"
              title="PandaDoc Editor"
            />
          ) : isDraftStatus ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
              <p className="text-muted-foreground">
                This proposal is in draft status and must be sent before it can be edited.
              </p>
              <p className="text-sm text-muted-foreground">
                Please send the proposal to the client first, then you'll be able to open the editor.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Unable to load editor
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
