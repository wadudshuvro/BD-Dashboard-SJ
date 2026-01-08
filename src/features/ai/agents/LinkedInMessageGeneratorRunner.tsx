import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useGenerateLinkedInMessage } from "@/hooks/useGenerateLinkedInMessage";
import { 
  Loader2, MessageSquare, Sparkles, ArrowRight, Copy, Check, 
  User, Building2, Search, Send
} from "lucide-react";

interface CampaignContact {
  id: string;
  contact_name: string;
  contact_company: string | null;
  contact_title: string | null;
  contact_linkedin_url: string | null;
  campaign_id: string;
  status: string;
  bd_campaigns: {
    id: string;
    name: string;
  };
}

interface MessageVariant {
  variant_name: string;
  message: string;
  character_count: number;
  tone: string;
  key_hooks: string[];
  personalization_elements: string[];
}

interface GenerationResult {
  message_variants: MessageVariant[];
  recommended_variant: string;
  reasoning: string;
  send_timing_suggestion: string;
  follow_up_strategy: string;
}

type Step = "select" | "configure" | "running" | "complete";
type MessageType = 'connection_request' | 'first_followup' | 'second_followup' | 'meeting_request';

const MESSAGE_TYPE_LABELS: Record<MessageType, string> = {
  connection_request: "Connection Request",
  first_followup: "First Follow-up",
  second_followup: "Second Follow-up",
  meeting_request: "Meeting Request",
};

const MESSAGE_TYPE_LIMITS: Record<MessageType, number> = {
  connection_request: 200,
  first_followup: 500,
  second_followup: 500,
  meeting_request: 500,
};

export function LinkedInMessageGeneratorRunner() {
  const [step, setStep] = useState<Step>("select");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<CampaignContact | null>(null);
  const [messageType, setMessageType] = useState<MessageType>("connection_request");
  const [userContext, setUserContext] = useState("");
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [copiedVariant, setCopiedVariant] = useState<string | null>(null);

  const generateMutation = useGenerateLinkedInMessage();

  // Fetch contacts for selection
  const { data: contacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ['campaign-contacts-for-linkedin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_contacts')
        .select(`
          id, contact_name, contact_company, contact_title, 
          contact_linkedin_url, campaign_id, status,
          bd_campaigns!inner(id, name)
        `)
        .in('status', ['identified', 'researched', 'qualified'])
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      return data as CampaignContact[];
    },
  });

  // Filter contacts by search
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts.slice(0, 20);
    const query = searchQuery.toLowerCase();
    return contacts.filter(c => 
      c.contact_name.toLowerCase().includes(query) ||
      c.contact_company?.toLowerCase().includes(query) ||
      (c.bd_campaigns as any)?.name?.toLowerCase().includes(query)
    ).slice(0, 20);
  }, [contacts, searchQuery]);

  const handleSelectContact = (contact: CampaignContact) => {
    setSelectedContact(contact);
    setStep("configure");
  };

  const handleGenerate = async () => {
    if (!selectedContact) return;

    setStep("running");
    try {
      const data = await generateMutation.mutateAsync({
        contactId: selectedContact.id,
        messageType,
        userContext: userContext.trim() || undefined,
      });
      setResult(data);
      setStep("complete");
    } catch (error) {
      toast.error("Generation failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
      setStep("configure");
    }
  };

  const handleCopy = async (variant: MessageVariant) => {
    await navigator.clipboard.writeText(variant.message);
    setCopiedVariant(variant.variant_name);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedVariant(null), 2000);
  };

  const reset = () => {
    setStep("select");
    setSelectedContact(null);
    setResult(null);
    setUserContext("");
    setCopiedVariant(null);
  };

  const getCharCountColor = (count: number, limit: number) => {
    if (count <= limit) return "text-green-400";
    return "text-red-400";
  };

  // Step 1: Contact Selection
  if (step === "select") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            LinkedIn Message Generator
          </CardTitle>
          <CardDescription>
            Select a contact to generate personalized LinkedIn outreach messages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts by name, company, or campaign..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <ScrollArea className="h-[300px]">
            {loadingContacts ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredContacts.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No contacts found. Try a different search.
              </p>
            ) : (
              <div className="space-y-2">
                {filteredContacts.map(contact => (
                  <div
                    key={contact.id}
                    onClick={() => handleSelectContact(contact)}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{contact.contact_name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {contact.contact_title && (
                            <span>{contact.contact_title}</span>
                          )}
                          {contact.contact_company && (
                            <>
                              <span>at</span>
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {contact.contact_company}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {(contact.bd_campaigns as any)?.name}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {contact.status}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  // Step 2: Configure Message Type
  if (step === "configure" && selectedContact) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Configure Message
          </CardTitle>
          <CardDescription>
            Generating message for {selectedContact.contact_name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Contact Summary */}
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{selectedContact.contact_name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedContact.contact_title} at {selectedContact.contact_company}
                </p>
              </div>
            </div>
          </div>

          {/* Message Type Selection */}
          <div className="space-y-2">
            <Label>Message Type</Label>
            <Select value={messageType} onValueChange={(v) => setMessageType(v as MessageType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MESSAGE_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    <div className="flex items-center justify-between gap-4">
                      <span>{label}</span>
                      <span className="text-xs text-muted-foreground">
                        ({MESSAGE_TYPE_LIMITS[value as MessageType]} chars max)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* User Context */}
          <div className="space-y-2">
            <Label>Additional Context (Optional)</Label>
            <Textarea
              placeholder="Any specific talking points, shared connections, or context you want to include..."
              value={userContext}
              onChange={(e) => setUserContext(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => setStep("select")}>
              Back
            </Button>
            <Button onClick={handleGenerate}>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Messages
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 3: Running
  if (step === "running") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
            Generating Messages...
          </CardTitle>
          <CardDescription>
            Creating personalized message variants for {selectedContact?.contact_name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Analyzing contact data and generating variants...
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                This usually takes 5-10 seconds
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 4: Complete - Show Results
  if (step === "complete" && result) {
    const charLimit = MESSAGE_TYPE_LIMITS[messageType];

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-500" />
            Messages Generated
          </CardTitle>
          <CardDescription>
            {result.message_variants.length} variants created for {selectedContact?.contact_name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* AI Reasoning */}
          {result.reasoning && (
            <div className="p-3 rounded-lg bg-muted/50 border text-sm">
              <p className="font-medium text-xs text-muted-foreground mb-1">AI Strategy</p>
              <p>{result.reasoning}</p>
            </div>
          )}

          {/* Message Variants */}
          <Tabs defaultValue={result.recommended_variant} className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              {result.message_variants.map((variant) => (
                <TabsTrigger key={variant.variant_name} value={variant.variant_name} className="text-xs">
                  {variant.variant_name}
                  {variant.variant_name === result.recommended_variant && (
                    <Badge className="ml-1 text-[10px] py-0 px-1 bg-primary/20">★</Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {result.message_variants.map((variant) => (
              <TabsContent key={variant.variant_name} value={variant.variant_name} className="space-y-3">
                {/* Message Content */}
                <div className="relative">
                  <div className="p-3 rounded-lg border bg-muted/30 font-mono text-sm whitespace-pre-wrap">
                    {variant.message}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={() => handleCopy(variant)}
                  >
                    {copiedVariant === variant.variant_name ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Variant Metadata */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="outline">{variant.tone}</Badge>
                  <span className={getCharCountColor(variant.character_count, charLimit)}>
                    {variant.character_count}/{charLimit} chars
                  </span>
                </div>

                {/* Personalization Elements */}
                {variant.personalization_elements?.length > 0 && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">Personalization: </span>
                    {variant.personalization_elements.join(", ")}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>

          {/* Timing & Strategy */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {result.send_timing_suggestion && (
              <div className="p-2 rounded bg-muted/30 border">
                <p className="font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <Send className="h-3 w-3" /> Best Time
                </p>
                <p>{result.send_timing_suggestion}</p>
              </div>
            )}
            {result.follow_up_strategy && (
              <div className="p-2 rounded bg-muted/30 border">
                <p className="font-medium text-muted-foreground mb-1">Follow-up</p>
                <p>{result.follow_up_strategy}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={reset}>
              Generate for Another Contact
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
