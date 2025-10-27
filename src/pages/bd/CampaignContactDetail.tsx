import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Mail, Linkedin, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCampaignContactBySlug } from "@/hooks/useCampaignContactBySlug";
import { useCampaignBySlug } from "@/hooks/useCampaignBySlug";

export default function CampaignContactDetail() {
  const { campaignSlug, contactSlug } = useParams<{ campaignSlug: string; contactSlug: string }>();
  const { data: contact, isLoading: contactLoading } = useCampaignContactBySlug(contactSlug);
  const { data: campaignData, isLoading: campaignLoading } = useCampaignBySlug(campaignSlug);
  
  const campaign = campaignData?.campaign;
  
  if (contactLoading || campaignLoading) {
    return (
      <div className="container mx-auto py-10 flex items-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading...
      </div>
    );
  }

  if (!contact || !campaign) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Contact not found</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Button variant="ghost" asChild className="gap-2">
        <Link to={`/campaigns/${campaignSlug}`}>
          <ArrowLeft className="h-4 w-4" /> Back to {campaign.name}
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{contact.contact_name}</CardTitle>
              <div className="flex gap-2 text-sm text-muted-foreground">
                {contact.contact_title && <span>{contact.contact_title}</span>}
                {contact.contact_company && <span>at {contact.contact_company}</span>}
              </div>
            </div>
            <Badge className="capitalize">{contact.status.replace('_', ' ')}</Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">Contact Information</h3>
            <Separator className="mb-3" />
            <div className="grid gap-3">
              {contact.contact_email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${contact.contact_email}`} className="hover:underline">
                    {contact.contact_email}
                  </a>
                </div>
              )}
              {contact.contact_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${contact.contact_phone}`} className="hover:underline">
                    {contact.contact_phone}
                  </a>
                </div>
              )}
              {contact.contact_linkedin_url && (
                <div className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={contact.contact_linkedin_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    LinkedIn Profile
                  </a>
                </div>
              )}
            </div>
          </div>

          {contact.research_summary && (
            <div>
              <h3 className="font-semibold mb-3">Research Summary</h3>
              <Separator className="mb-3" />
              <div className="prose prose-sm max-w-none">
                {typeof contact.research_summary === 'object' && 
                 (contact.research_summary as any)?.summary ? (
                  <p>{(contact.research_summary as any).summary}</p>
                ) : (
                  <pre className="text-xs bg-muted p-4 rounded">
                    {JSON.stringify(contact.research_summary, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}

          {contact.metadata && Object.keys(contact.metadata as object).length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Additional Metadata</h3>
              <Separator className="mb-3" />
              <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
                {JSON.stringify(contact.metadata, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
