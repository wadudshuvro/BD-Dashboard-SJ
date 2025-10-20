import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, RefreshCcw, Sparkles, ShieldAlert, CheckCircle2 } from "lucide-react";

type LeadAutomationLog = Database["public"]["Tables"]["lead_automation_logs"]["Row"];

type LeadAutomationLogWithClient = LeadAutomationLog & {
  client?: {
    id: string;
    name: string | null;
    company: string | null;
    email: string | null;
  } | null;
};

type ParsedData = Record<string, unknown> | null;

type StatusVariant = "default" | "secondary" | "outline" | "destructive";

const STATUS_STYLES: Record<string, { label: string; variant: StatusVariant }> = {
  matched: { label: "Matched", variant: "default" },
  processed: { label: "Processed", variant: "default" },
  needs_review: { label: "Needs Review", variant: "outline" },
  error: { label: "Error", variant: "destructive" },
  manual_approved: { label: "Manually Approved", variant: "secondary" },
  spam: { label: "Spam", variant: "outline" },
};

function parseConfidence(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return null;
  return numeric;
}

function resolveStatus(status?: string | null): { label: string; variant: StatusVariant } {
  if (!status) {
    return { label: "Processed", variant: "default" };
  }
  return STATUS_STYLES[status] ?? { label: status.replace(/_/g, " "), variant: "secondary" };
}

const formatConfidence = (value: number | null) =>
  value === null ? "—" : `${Math.round(Math.max(0, Math.min(100, value)))}%`;

const asRecord = (value: unknown): ParsedData => {
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (_error) {
      return { raw: value };
    }
  }
  return null;
};

const formatDateDistance = (value: string | null) => {
  if (!value) return "—";
  try {
    return formatDistanceToNow(new Date(value), { addSuffix: true });
  } catch (_error) {
    return value;
  }
};

export default function LeadAutomationPage() {
  const [logs, setLogs] = useState<LeadAutomationLogWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<LeadAutomationLogWithClient | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [manualSubject, setManualSubject] = useState("");
  const [manualSender, setManualSender] = useState("");
  const [manualBody, setManualBody] = useState("");
  const [manualSubmitting, setManualSubmitting] = useState(false);

  const fetchLogs = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from("lead_automation_logs")
        .select("*, client:clients(id, name, company, email)")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;

      setLogs((data ?? []) as LeadAutomationLogWithClient[]);
    } catch (error) {
      console.error("Failed to load lead automation logs", error);
      toast.error("Unable to load automation logs");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSelectLog = useCallback((log: LeadAutomationLogWithClient) => {
    setSelectedLog(log);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback((open: boolean) => {
    if (!open) {
      setDrawerOpen(false);
      setTimeout(() => setSelectedLog(null), 200);
    }
  }, []);

  const handleRetry = useCallback(async (log: LeadAutomationLogWithClient) => {
    if (!log.raw_body) {
      toast.error("No email body available for retry");
      return;
    }
    setActionLoading(log.id);
    try {
      const { error } = await supabase.functions.invoke("lead-email-automation", {
        body: {
          subject: log.raw_subject ?? "(no subject)",
          sender: log.raw_sender,
          body: log.raw_body,
          message_id: log.email_message_id,
        },
      });
      if (error) throw error;
      toast.success("Automation retry started");
      await fetchLogs();
    } catch (error) {
      console.error("Retry failed", error);
      toast.error("Failed to retry automation");
    } finally {
      setActionLoading(null);
    }
  }, [fetchLogs]);

  const updateStatus = useCallback(async (log: LeadAutomationLogWithClient, status: string) => {
    setActionLoading(log.id);
    try {
      const { error } = await supabase
        .from("lead_automation_logs")
        .update({ status })
        .eq("id", log.id);
      if (error) throw error;
      toast.success("Log status updated");
      await fetchLogs();
    } catch (error) {
      console.error("Status update failed", error);
      toast.error("Failed to update status");
    } finally {
      setActionLoading(null);
    }
  }, [fetchLogs]);

  const handleManualSubmit = useCallback(async () => {
    if (!manualBody.trim()) {
      toast.error("Email body is required");
      return;
    }
    setManualSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("lead-email-automation", {
        body: {
          subject: manualSubject || "(no subject)",
          sender: manualSender || undefined,
          body: manualBody,
        },
      });
      if (error) throw error;
      toast.success("Manual email submitted to automation");
      setManualDialogOpen(false);
      setManualSubject("");
      setManualSender("");
      setManualBody("");
      await fetchLogs();
    } catch (error) {
      console.error("Manual submission failed", error);
      toast.error("Failed to process manual email");
    } finally {
      setManualSubmitting(false);
    }
  }, [manualBody, manualSender, manualSubject, fetchLogs]);

  const relatedHistory = useMemo(() => {
    if (!selectedLog?.email_message_id) return [] as LeadAutomationLogWithClient[];
    return logs.filter((log) => log.email_message_id === selectedLog.email_message_id && log.id !== selectedLog.id);
  }, [logs, selectedLog]);

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lead Email Automation</h1>
          <p className="text-muted-foreground">
            Monitor AI-parsed inbound emails and review HubSpot / GoHighLevel sync activity.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={fetchLogs} disabled={refreshing}>
            {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
          <Dialog open={manualDialogOpen} onOpenChange={setManualDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Sparkles className="mr-2 h-4 w-4" />
                Add from Email
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Email for Automation</DialogTitle>
                <DialogDescription>
                  Paste the contents of an inbound lead email. The automation workflow will parse and triage it.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="manual-subject">Subject</Label>
                  <Input
                    id="manual-subject"
                    value={manualSubject}
                    onChange={(event) => setManualSubject(event.target.value)}
                    placeholder="New inquiry regarding web development"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-sender">Sender</Label>
                  <Input
                    id="manual-sender"
                    value={manualSender}
                    onChange={(event) => setManualSender(event.target.value)}
                    placeholder="Dana Smith <dana@prospect.com>"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-body">Email Body</Label>
                  <Textarea
                    id="manual-body"
                    value={manualBody}
                    onChange={(event) => setManualBody(event.target.value)}
                    placeholder="Paste the full email body here..."
                    rows={8}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setManualDialogOpen(false)} disabled={manualSubmitting}>
                    Cancel
                  </Button>
                  <Button onClick={handleManualSubmit} disabled={manualSubmitting}>
                    {manualSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit to Automation
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mt-8 rounded-lg border bg-card">
        <ScrollArea className="max-h-[70vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sender</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="hidden md:table-cell">AI Confidence</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">HubSpot Sync</TableHead>
                <TableHead className="hidden lg:table-cell">GHL Sync</TableHead>
                <TableHead className="hidden md:table-cell">Processed</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading automation logs...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No lead automation activity yet.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const parsed = asRecord(log.parsed_data);
                  const status = resolveStatus(log.status);
                  const confidence = formatConfidence(parseConfidence(log.ai_confidence));
                  const sender = log.raw_sender || (typeof parsed?.email === "string" ? parsed?.email : "Unknown");

                  return (
                    <TableRow
                      key={log.id}
                      className="cursor-pointer transition hover:bg-muted/50"
                      onClick={() => handleSelectLog(log)}
                    >
                      <TableCell className="max-w-[220px] truncate font-medium">{sender}</TableCell>
                      <TableCell className="max-w-[320px] truncate">{log.raw_subject ?? "(no subject)"}</TableCell>
                      <TableCell className="hidden md:table-cell">{confidence}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {log.hubspot_status ? (
                          <Badge variant={log.hubspot_status.startsWith("error") ? "destructive" : "outline"}>
                            {log.hubspot_status}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {log.ghl_status ? (
                          <Badge variant={log.ghl_status.startsWith("error") ? "destructive" : "outline"}>
                            {log.ghl_status}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {formatDateDistance(log.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleRetry(log);
                            }}
                            disabled={actionLoading === log.id}
                          >
                            {actionLoading === log.id ? (
                              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RefreshCcw className="mr-1 h-3.5 w-3.5" />
                            )}
                            Retry
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(event) => {
                              event.stopPropagation();
                              updateStatus(log, "manual_approved");
                            }}
                            disabled={actionLoading === log.id}
                          >
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(event) => {
                              event.stopPropagation();
                              updateStatus(log, "spam");
                            }}
                            disabled={actionLoading === log.id}
                          >
                            <ShieldAlert className="mr-1 h-3.5 w-3.5" />
                            Mark Spam
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      <Drawer open={drawerOpen} onOpenChange={closeDrawer}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>{selectedLog?.raw_subject ?? "Automation Details"}</DrawerTitle>
            <DrawerDescription>
              {selectedLog?.raw_sender || "Unknown sender"} · {formatDateDistance(selectedLog?.created_at ?? null)}
            </DrawerDescription>
          </DrawerHeader>
          <div className="grid gap-6 p-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold uppercase text-muted-foreground">Parsed Details</h3>
                <div className="mt-2 space-y-2 rounded-md border bg-muted/30 p-4 text-sm">
                  {Object.entries(asRecord(selectedLog?.parsed_data) ?? {}).length === 0 ? (
                    <p className="text-muted-foreground">No structured data captured.</p>
                  ) : (
                    Object.entries(asRecord(selectedLog?.parsed_data) ?? {}).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between gap-4">
                        <span className="font-medium capitalize">{key.replace(/_/g, " ")}</span>
                        <span className="max-w-[220px] truncate text-right text-muted-foreground">
                          {typeof value === "object" ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase text-muted-foreground">Log Metadata</h3>
                <div className="mt-2 space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Status:</span> {resolveStatus(selectedLog?.status ?? "processed").label}
                  </p>
                  <p>
                    <span className="font-medium">AI Confidence:</span> {formatConfidence(parseConfidence(selectedLog?.ai_confidence ?? null))}
                  </p>
                  <p>
                    <span className="font-medium">HubSpot Sync:</span> {selectedLog?.hubspot_status ?? "—"}
                  </p>
                  <p>
                    <span className="font-medium">GoHighLevel Sync:</span> {selectedLog?.ghl_status ?? "—"}
                  </p>
                  {selectedLog?.client && (
                    <p>
                      <span className="font-medium">Matched Client:</span> {selectedLog.client.name ?? selectedLog.client.company ?? selectedLog.client.email ?? "Unknown"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold uppercase text-muted-foreground">Email Preview</h3>
                <div className="mt-2 rounded-md border bg-muted/30 p-4 text-sm">
                  <ScrollArea className="max-h-[320px]">
                    <pre className="whitespace-pre-wrap text-left text-sm leading-relaxed">
                      {selectedLog?.raw_body ?? "(No email body captured)"}
                    </pre>
                  </ScrollArea>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase text-muted-foreground">Log History</h3>
                <div className="mt-2 space-y-3 text-sm">
                  {relatedHistory.length === 0 ? (
                    <p className="text-muted-foreground">No additional log entries for this email.</p>
                  ) : (
                    relatedHistory.map((log) => {
                      const status = resolveStatus(log.status);
                      return (
                        <div key={log.id} className="rounded-md border p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{formatDateDistance(log.created_at)}</span>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">HubSpot: {log.hubspot_status ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">GoHighLevel: {log.ghl_status ?? "—"}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
