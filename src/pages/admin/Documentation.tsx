import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

// Minimal documentation placeholder
const documentationContent: Record<string, string> = {
  "getting-started/overview": `# Project Overview

The **SJ Business Development AI Platform** is a comprehensive project management and analytics system.

## Core Features

- User & Brand Management
- Project & Task Management  
- EOD Reporting
- Analytics & KPIs
- AI Features
- Video Generation (Gemini Veo)
- Third-Party Integrations

For detailed documentation, please refer to the external documentation files.`,

  "default": `# Documentation

Documentation is being updated. Please check back soon.`
};

export default function Documentation() {
  const [selectedDoc] = useState<string>("getting-started/overview");
  const content = documentationContent[selectedDoc] || documentationContent["default"];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documentation</h1>
          <p className="text-muted-foreground">
            Platform guides and references
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <CardTitle className="text-2xl">Project Overview</CardTitle>
            </div>
            <CardDescription>Getting started with the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
