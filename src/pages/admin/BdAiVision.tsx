import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Download, Sparkles } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const VISION_DOC_PATH = "/adminpanel/documentation/BD_AI_Visual_Vision.md";

type LoadState = "idle" | "loading" | "ready" | "error";

export default function BdAiVision() {
  const [content, setContent] = useState<string>("");
  const [status, setStatus] = useState<LoadState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;

    const fetchVisionDoc = async () => {
      setStatus("loading");
      try {
        const response = await fetch(VISION_DOC_PATH, { cache: "no-cache" });
        if (!response.ok) {
          throw new Error(`Unable to load vision document (HTTP ${response.status})`);
        }
        const text = await response.text();
        if (!isMounted) return;
        setContent(text);
        setStatus("ready");
      } catch (error) {
        console.error("Failed to fetch BD AI vision document", error);
        if (!isMounted) return;
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : String(error));
      }
    };

    fetchVisionDoc();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "bd-ai-portal-vision-2025.md";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const renderBody = () => {
    if (status === "loading" || status === "idle") {
      return <p className="text-sm text-muted-foreground">Loading BD AI Portal vision…</p>;
    }

    if (status === "error") {
      return (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <p className="font-medium">We couldn&apos;t load the BD AI Portal vision document.</p>
          {errorMessage ? <p className="mt-2">Error: {errorMessage}</p> : null}
        </div>
      );
    }

    return (
      <ScrollArea className="h-[70vh] pr-4">
        <ReactMarkdown className="prose prose-slate max-w-none dark:prose-invert" remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </ScrollArea>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-6 w-6" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-wider">Vision &amp; Roadmap</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">BD AI Portal Vision 2025</h1>
          <p className="text-muted-foreground">
            Explore the North Star strategy, agent ecosystem, and phased delivery plan guiding the Business Development AI Portal.
          </p>
        </div>
        <Button onClick={handleDownload} variant="secondary" className="gap-2" disabled={status !== "ready"}>
          <Download className="h-4 w-4" aria-hidden="true" />
          <span>Download Markdown</span>
        </Button>
      </div>

      <Card className="border-muted-foreground/20">
        <CardHeader>
          <CardTitle className="text-2xl">Vision Document</CardTitle>
          <CardDescription>
            This HTML view renders the enriched vision markdown stored at{" "}
            <code className="mx-1 rounded bg-muted px-1 py-0.5">{VISION_DOC_PATH}</code>{" "}
            so admin leaders can reference it without leaving the portal.
          </CardDescription>
        </CardHeader>
        <CardContent>{renderBody()}</CardContent>
      </Card>
    </div>
  );
}
