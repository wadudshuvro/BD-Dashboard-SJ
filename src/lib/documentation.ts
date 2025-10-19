import { BookOpen, Database, Workflow, ArchiveRestore, ClipboardCheck, Target, type LucideIcon } from "lucide-react";

export interface DocCategory {
  id: string;
  title: string;
  icon: LucideIcon;
  description: string;
  items: DocItem[];
}

export interface DocItem {
  id: string;
  title: string;
  description: string;
  category: string;
  file: string;
  tags?: string[];
  lastUpdated?: string;
}

export const documentationIndex: DocCategory[] = [
  {
    id: "overview",
    title: "Overview",
    icon: BookOpen,
    description: "Project mission, stack, folder structure, and operational context.",
    items: [
      {
        id: "project-overview",
        title: "Project Overview",
        description: "High-level description of the SJ Business Development AI Platform and build commands.",
        category: "overview",
        file: "overview.md",
        tags: ["summary", "setup", "environment"],
        lastUpdated: "2025-02-15"
      }
    ]
  },
  {
    id: "database",
    title: "Database Schema",
    icon: Database,
    description: "Postgres tables, fields, and sample payloads for Supabase-managed data.",
    items: [
      {
        id: "schema",
        title: "Database Schema",
        description: "Complete reference of tables powering CRM, AI, and reporting flows.",
        category: "database",
        file: "database-schema.md",
        tags: ["supabase", "tables", "schema"],
        lastUpdated: "2025-02-15"
      }
    ]
  },
  {
    id: "logic",
    title: "Logic & Functions",
    icon: Workflow,
    description: "Edge functions, React service layer, and automation pipelines.",
    items: [
      {
        id: "logic-functions",
        title: "Logic & Functions",
        description: "Details of Supabase edge functions, client hooks, and automation flow.",
        category: "logic",
        file: "logic-and-functions.md",
        tags: ["edge functions", "api", "automation"],
        lastUpdated: "2025-02-15"
      },
      {
        id: "bug-feature-tracking",
        title: "Bug & Feature Tracking",
        description: "Feedback submission flow, Supabase schema, and admin review tooling.",
        category: "logic",
        file: "bug-tracking-integration.md",
        tags: ["feedback", "support", "admin"],
        lastUpdated: "2025-10-30"
      }
    ]
  },
  {
    id: "unused",
    title: "Unused Analysis",
    icon: ArchiveRestore,
    description: "Inventory of dormant code paths and tables with recommended next steps.",
    items: [
      {
        id: "unused-analysis",
        title: "Unused Analysis",
        description: "Highlights modules and database assets currently not surfaced in the UI.",
        category: "unused",
        file: "unused-analysis.md",
        tags: ["cleanup", "audit"],
        lastUpdated: "2025-02-15"
      }
    ]
  },
  {
    id: "checklist",
    title: "Review Checklist",
    icon: ClipboardCheck,
    description: "QA steps for keeping documentation and data consistent.",
    items: [
      {
        id: "review-checklist",
        title: "Review Checklist",
        description: "Markdown checklist for QA/Admin sign-off.",
        category: "checklist",
        file: "review-checklist.md",
        tags: ["qa", "process"],
        lastUpdated: "2025-02-15"
      }
    ]
  },
  {
    id: "business-development",
    title: "Business Development",
    icon: Target,
    description: "POD management, target niches, and campaign workflows.",
    items: [
      {
        id: "bd-guide",
        title: "Business Development Guide",
        description: "Complete guide to using the BD module for outbound operations.",
        category: "business-development",
        file: "business-development.md",
        tags: ["bd", "campaigns", "niches", "pods"],
        lastUpdated: "2025-10-19"
      }
    ]
  }
];

export function getAllDocItems(): DocItem[] {
  return documentationIndex.flatMap((category) => category.items);
}

export function getDocByFile(file: string): DocItem | undefined {
  return getAllDocItems().find((item) => item.file === file);
}

export function getCategoryById(id: string): DocCategory | undefined {
  return documentationIndex.find((category) => category.id === id);
}
