import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProposalStatusBadge } from "./ProposalStatusBadge";
import { Eye, Edit, Send, Download } from "lucide-react";
import type { ProposalDocument } from "@/types/proposal";
import { format } from "date-fns";
import { useState } from "react";
import { ProposalEditor } from "./ProposalEditor";
import { useSendProposal } from "@/hooks/useProposals";

interface ProposalCardProps {
  proposal: ProposalDocument;
}

export const ProposalCard = ({ proposal }: ProposalCardProps) => {
  const [editorOpen, setEditorOpen] = useState(false);
  const sendProposal = useSendProposal();

  const handleSend = async () => {
    await sendProposal.mutateAsync({ docId: proposal.pandadoc_doc_id });
  };

  const handleView = () => {
    if (proposal.recipient_url) {
      window.open(proposal.recipient_url, "_blank");
    } else {
      setEditorOpen(true);
    }
  };

  const handleDownload = () => {
    if (proposal.pdf_url) {
      window.open(proposal.pdf_url, "_blank");
    }
  };

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-sm truncate">{proposal.title}</h4>
                <ProposalStatusBadge
                  status={proposal.status}
                  sentAt={proposal.sent_at}
                  viewedAt={proposal.viewed_at}
                  completedAt={proposal.completed_at}
                  expiresAt={proposal.expires_at}
                />
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                {proposal.client && <p>Client: {proposal.client.name}</p>}
                {proposal.deal && <p>Deal: {proposal.deal.title}</p>}
                <p>Created: {format(new Date(proposal.created_at), "MMM d, yyyy")}</p>
                {proposal.sent_at && <p>Sent: {format(new Date(proposal.sent_at), "MMM d, yyyy")}</p>}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleView}>
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>

              {proposal.status === "draft" && (
                <Button variant="outline" size="sm" onClick={() => setEditorOpen(true)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}

              {(proposal.status === "draft" || proposal.status === "viewed") && (
                <Button variant="default" size="sm" onClick={handleSend} disabled={sendProposal.isPending}>
                  <Send className="h-4 w-4 mr-1" />
                  Send
                </Button>
              )}

              {proposal.status === "signed" && proposal.pdf_url && (
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-1" />
                  PDF
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <ProposalEditor open={editorOpen} onOpenChange={setEditorOpen} docId={proposal.pandadoc_doc_id} />
    </>
  );
};
