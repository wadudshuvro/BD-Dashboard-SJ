import { Card, CardContent } from "@/components/ui/card";
import { StatusBadgeWithIcon } from "./StatusBadgeWithIcon";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from "date-fns";
import type { CampaignContactStatus } from "@/features/campaign-detail/types";
import { Link } from "react-router-dom";

interface ContactCardMiniProps {
  contact: {
    id: string;
    slug: string;
    contact_name: string;
    contact_title?: string | null;
    contact_company?: string | null;
    status: CampaignContactStatus;
    last_status_change_at?: string | null;
  };
  campaignSlug: string;
}

const statusToProgress: Record<CampaignContactStatus, number> = {
  identified: 12.5,
  researched: 25,
  contacted_linkedin: 37.5,
  connected: 50,
  messaged: 62.5,
  contacted_email: 75,
  responded: 87.5,
  meeting_booked: 100,
};

export function ContactCardMini({ contact, campaignSlug }: ContactCardMiniProps) {
  const progress = statusToProgress[contact.status];

  return (
    <Link to={`/campaigns/${campaignSlug}/contacts/${contact.slug}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer">
        <CardContent className="pt-4 space-y-3">
          <div>
            <h3 className="font-semibold text-sm">{contact.contact_name}</h3>
            {contact.contact_title && (
              <p className="text-xs text-muted-foreground">{contact.contact_title}</p>
            )}
            {contact.contact_company && (
              <p className="text-xs text-muted-foreground">at {contact.contact_company}</p>
            )}
          </div>
          
          <div className="space-y-1.5">
            <Progress value={progress} className="h-1.5" />
            <div className="flex items-center justify-between">
              <StatusBadgeWithIcon status={contact.status} className="text-xs" />
              {contact.last_status_change_at && (
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(contact.last_status_change_at), { addSuffix: true })}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
