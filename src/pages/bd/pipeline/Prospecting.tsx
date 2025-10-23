import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { UploadCloud, Loader2, ExternalLink } from "lucide-react";
import { StagePipelineTable } from "@/components/bd/StagePipelineTable";
import { SyncControlTowerButton } from "@/components/bd/SyncControlTowerButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLeadList } from "@/hooks/useLeads";
import { useExaIntegration } from "@/hooks/useExaIntegration";
import { useUserPermissions } from "@/hooks/useUserPermissions";

export default function Prospecting() {
  const { hasPermission } = useUserPermissions();
  const canImportFromExa = useMemo(
    () =>
      hasPermission(["exa", "exa_integration", "exa_leads", "bd_exa", "lead_exa"], "create") ||
      hasPermission(/exa/i, "create"),
    [hasPermission],
  );
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [industries, setIndustries] = useState("");
  const [locations, setLocations] = useState("");
  const [limit, setLimit] = useState<number>(50);

  const { data, isLoading, isError, error } = useLeadList({ pageSize: 50 });
  const { importFromExa, isImporting } = useExaIntegration();

  const handleImport = async () => {
    if (!query.trim()) {
      return;
    }

    try {
      await importFromExa({
        query: query.trim(),
        industries: industries
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        locations: locations
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        limit: limit || 50,
      });
      setDialogOpen(false);
    } catch (error) {
      // Error handled via toast in hook
      console.error("Failed to import from Exa", error);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Prospecting Stage</h1>
          <p className="text-muted-foreground">
            Initial outreach and qualification of potential opportunities
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {canImportFromExa && (
            <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default" className="gap-2">
                  <UploadCloud className="h-4 w-4" /> Import from Exa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import leads from Exa</DialogTitle>
                  <DialogDescription>
                    Provide a search query and optional filters to discover new leads. The import runs asynchronously and will
                    refresh once completed.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="exa-query">Search query</Label>
                    <Input
                      id="exa-query"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="e.g. AI consultants in fintech"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exa-industries">Industries (comma separated)</Label>
                    <Input
                      id="exa-industries"
                      value={industries}
                      onChange={(event) => setIndustries(event.target.value)}
                      placeholder="Fintech, SaaS"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exa-locations">Locations (comma separated)</Label>
                    <Input
                      id="exa-locations"
                      value={locations}
                      onChange={(event) => setLocations(event.target.value)}
                      placeholder="New York, Remote"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exa-limit">Result limit</Label>
                    <Input
                      id="exa-limit"
                      type="number"
                      min={1}
                      max={250}
                      value={limit}
                      onChange={(event) => setLimit(Number(event.target.value) || 0)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isImporting}>
                    Cancel
                  </Button>
                  <Button onClick={handleImport} disabled={isImporting || !query.trim()} className="gap-2">
                    {isImporting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Start import
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <SyncControlTowerButton />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Latest inbound leads</span>
            <Badge variant="secondary">{data?.total ?? 0} tracked</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading leads from Exa...
            </div>
          ) : isError ? (
            <div className="text-sm text-destructive">
              {(error as Error)?.message ?? "Unable to load leads. Please try again later."}
            </div>
          ) : data && data.leads.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="hidden md:table-cell">Last enriched</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.leads.map((lead) => {
                    const fullName = lead.full_name || [lead.first_name, lead.last_name].filter(Boolean).join(" ");
                    const status = lead.enrichment_status || lead.status || "pending";
                    return (
                      <TableRow key={lead.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{fullName || "Unnamed lead"}</span>
                            {lead.email && <span className="text-xs text-muted-foreground">{lead.email}</span>}
                          </div>
                        </TableCell>
                        <TableCell>{lead.company || "—"}</TableCell>
                        <TableCell>{lead.title || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {status.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{lead.source || "exa"}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {lead.last_enriched_at
                            ? new Date(lead.last_enriched_at).toLocaleString()
                            : "Not enriched"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/bd/leads/${lead.id}`} aria-label="View lead details">
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No leads synced from Exa yet. Use the import action above to seed your prospecting list.
            </p>
          )}
        </CardContent>
      </Card>

      <StagePipelineTable stage="prospecting" title="" description="" />
    </div>
  );
}

