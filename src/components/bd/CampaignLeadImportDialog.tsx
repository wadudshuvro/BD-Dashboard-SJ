import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { AlertCircle, Calendar as CalendarIcon, Loader2, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { BDCampaign } from "@/hooks/useBDCampaigns";
import { supabase } from "@/integrations/supabase/client";

interface CampaignLeadImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: BDCampaign;
  onImportComplete: () => void;
}

const EXA_COST_PER_LEAD = 0.10;

export function CampaignLeadImportDialog({
  open,
  onOpenChange,
  campaign,
  onImportComplete,
}: CampaignLeadImportDialogProps) {
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [customKeywords, setCustomKeywords] = useState("");
  const [maxResults, setMaxResults] = useState(25);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [excludeCompanies, setExcludeCompanies] = useState("");
  const [userLocation, setUserLocation] = useState("US");
  const [isImporting, setIsImporting] = useState(false);
  const [jobStatus, setJobStatus] = useState<{
    id: string;
    status: "pending" | "running" | "completed" | "failed";
    progress?: string;
    result?: { imported: number; updated: number };
    errorMessage?: string;
  } | null>(null);

  // Generate keyword suggestions from campaign data
  useEffect(() => {
    if (!open) return;

    const keywords: string[] = [];

    // Extract from campaign name
    if (campaign.name) {
      keywords.push(...extractKeywordsFromText(campaign.name));
    }

    // Extract from campaign target contacts
    if (campaign.target_contacts && Array.isArray(campaign.target_contacts)) {
      campaign.target_contacts.forEach(contact => {
        if (typeof contact === "string") {
          keywords.push(contact);
        }
      });
    }

    // Remove duplicates and limit to top 7
    const uniqueKeywords = Array.from(new Set(keywords)).slice(0, 7);
    setSuggestedKeywords(uniqueKeywords);
    setSelectedKeywords(uniqueKeywords.slice(0, 3)); // Pre-select top 3
  }, [campaign, open]);

  const estimatedCost = useMemo(() => {
    return maxResults * EXA_COST_PER_LEAD;
  }, [maxResults]);

  const finalKeywords = useMemo(() => {
    const custom = customKeywords
      .split(",")
      .map(k => k.trim())
      .filter(Boolean);
    return Array.from(new Set([...selectedKeywords, ...custom]));
  }, [selectedKeywords, customKeywords]);

  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords(prev =>
      prev.includes(keyword)
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    );
  };

  const handleImport = async () => {
    if (finalKeywords.length === 0) {
      return;
    }

    setIsImporting(true);
    try {
      const excludeTextArray = excludeCompanies
        .split(",")
        .map(c => c.trim())
        .filter(Boolean);

      const { data, error } = await supabase.functions.invoke("campaign-lead-import", {
        body: {
          campaignId: campaign.id,
          keywords: finalKeywords,
          maxResults,
          dateRange: {
            start: startDate ? startDate.toISOString() : undefined,
            end: endDate ? endDate.toISOString() : undefined,
          },
          excludeText: excludeTextArray.length > 0 ? excludeTextArray : undefined,
          userLocation,
        },
      });

      if (error) throw error;

      // Store job info and start polling
      setJobStatus({ id: data.job_id, status: "pending" });
      startPollingJobStatus(data.job_id);
    } catch (error) {
      console.error("Lead import failed:", error);
      setIsImporting(false);
    }
  };

  const startPollingJobStatus = (jobId: string) => {
    let pollCount = 0;
    const maxPolls = 150; // 5 minutes max (150 * 2s)

    const pollInterval = setInterval(async () => {
      pollCount++;

      const { data: job } = await supabase
        .from("lead_import_jobs")
        .select("status, imported_count, error_details")
        .eq("id", jobId)
        .single();

      if (!job) return;

      const statusMap: Record<string, string> = {
        pending: "Queued for processing...",
        running: "Searching LinkedIn profiles...",
        completed: "Import complete!",
        failed: "Import failed",
      };

      setJobStatus({
        id: jobId,
        status: job.status as any,
        progress: statusMap[job.status] || job.status,
        result: job.status === "completed" ? { imported: job.imported_count, updated: 0 } : undefined,
        errorMessage: job.status === "failed" ? job.error_details : undefined,
      });

      if (job.status === "completed" || job.status === "failed" || pollCount >= maxPolls) {
        clearInterval(pollInterval);
        setIsImporting(false);

        if (job.status === "completed") {
          onImportComplete();
          setTimeout(() => onOpenChange(false), 2000);
        }
      }
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add LinkedIn Leads to Campaign</DialogTitle>
          <DialogDescription>
            Search for and import LinkedIn profiles using Exa.ai
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto">
          {/* Campaign Context */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-sm font-medium">Campaign: {campaign.name}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Type: {campaign.campaign_type?.replace("_", " ") || "N/A"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Source: LinkedIn Profiles Only
            </p>
          </div>

          {/* Suggested Keywords */}
          <div className="space-y-3">
            <Label>Suggested Keywords</Label>
            <p className="text-sm text-muted-foreground">
              Click to select/deselect keywords based on your campaign
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedKeywords.map(keyword => (
                <Badge
                  key={keyword}
                  variant={selectedKeywords.includes(keyword) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/90"
                  onClick={() => toggleKeyword(keyword)}
                >
                  {keyword}
                  {selectedKeywords.includes(keyword) && (
                    <X className="ml-1 h-3 w-3" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Custom Keywords */}
          <div className="space-y-3">
            <Label htmlFor="custom-keywords">Additional Keywords (optional)</Label>
            <Textarea
              id="custom-keywords"
              placeholder="Enter additional keywords separated by commas..."
              value={customKeywords}
              onChange={(e) => setCustomKeywords(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Example: SaaS CEO, AI Startup Founder, Series A CTO
            </p>
          </div>

          {/* Date Range */}
          <div className="space-y-3">
            <Label>Published Date Range (optional)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Exclude Companies */}
          <div className="space-y-3">
            <Label htmlFor="exclude-companies">Exclude Companies (optional)</Label>
            <Textarea
              id="exclude-companies"
              placeholder="Enter company names to exclude, separated by commas..."
              value={excludeCompanies}
              onChange={(e) => setExcludeCompanies(e.target.value)}
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              Example: Chase, Fannie Mae, Wells Fargo
            </p>
          </div>

          {/* User Location */}
          <div className="space-y-3">
            <Label>User Location</Label>
            <Select value={userLocation} onValueChange={setUserLocation}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="US">United States</SelectItem>
                <SelectItem value="UK">United Kingdom</SelectItem>
                <SelectItem value="CA">Canada</SelectItem>
                <SelectItem value="AU">Australia</SelectItem>
                <SelectItem value="DE">Germany</SelectItem>
                <SelectItem value="FR">France</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Max Results */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Maximum Results: {maxResults}</Label>
              <span className="text-sm text-muted-foreground">
                10 - 100 leads
              </span>
            </div>
            <Slider
              value={[maxResults]}
              onValueChange={([value]) => setMaxResults(value)}
              min={10}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          {/* Final Keywords Preview */}
          {finalKeywords.length > 0 && (
            <div className="space-y-2">
              <Label>LinkedIn Search Query</Label>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-sm font-mono">
                  {finalKeywords.join(" ")}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Category: LinkedIn Profiles | Location: {userLocation}
                </p>
              </div>
            </div>
          )}

          {/* Job Status */}
          {jobStatus && (
            <Alert variant={jobStatus.status === "failed" ? "destructive" : "default"}>
              <Loader2 className={`h-4 w-4 ${jobStatus.status === "running" || jobStatus.status === "pending" ? "animate-spin" : ""}`} />
              <AlertTitle>
                {jobStatus.status === "completed" && "Import Complete!"}
                {jobStatus.status === "failed" && "Import Failed"}
                {jobStatus.status === "running" && "Import in Progress"}
                {jobStatus.status === "pending" && "Queued for Processing"}
              </AlertTitle>
              <AlertDescription>
                {jobStatus.progress}
                {jobStatus.errorMessage && (
                  <div className="mt-2 text-sm whitespace-pre-wrap">
                    <strong>Error:</strong> {jobStatus.errorMessage}
                  </div>
                )}
                {jobStatus.result && (
                  <div className="mt-2 text-sm">
                    Imported <strong>{jobStatus.result.imported}</strong> new LinkedIn contacts
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Cost Estimate */}
          {!jobStatus && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Cost Estimate</AlertTitle>
              <AlertDescription>
                This import will cost approximately{" "}
                <strong className="text-primary">${estimatedCost.toFixed(2)}</strong> in
                Exa.ai credits ({maxResults} leads × ${EXA_COST_PER_LEAD.toFixed(2)} per
                lead)
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={isImporting || finalKeywords.length === 0}
          >
            {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import {maxResults} Leads
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function extractKeywordsFromText(text: string): string[] {
  const patterns = [
    /\b(CEO|CTO|CFO|CMO|VP|Director|Head|Manager|Founder|President|Executive)\b/gi,
    /\b(SaaS|AI|ML|Fintech|Healthcare|Enterprise|B2B|E-commerce|EdTech)\b/gi,
    /\b(Startup|Series [A-Z]|Fortune \d+|SMB|Mid-market)\b/gi,
  ];

  const matches: string[] = [];
  patterns.forEach(pattern => {
    const found = text.match(pattern);
    if (found) {
      matches.push(...found);
    }
  });

  return Array.from(new Set(matches.map(m => m.trim())));
}
