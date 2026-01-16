import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FeedbackReport, FeedbackStatus } from "@/features/feedback/api";
import { FEEDBACK_STATUS_LABELS } from "@/features/feedback/constants";
import { FeedbackFilters } from "@/components/feedback/FeedbackFilters";
import { FeedbackListItem } from "@/components/feedback/FeedbackListItem";

const STATUS_ORDER: FeedbackStatus[] = ["open", "in_review", "resolved", "closed"];

type TabKey = "bugs" | "features" | "all";

interface FeedbackListSectionProps {
  items: FeedbackReport[];
}

export function FeedbackListSection({ items }: FeedbackListSectionProps) {
  const [tab, setTab] = useState<TabKey>("bugs");
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | "all">("all");
  const [moduleFilter, setModuleFilter] = useState<string | "all">("all");

  const moduleOptions = useMemo(() => {
    const modules = new Set<string>();
    items.forEach((item) => {
      if (item.module) {
        modules.add(item.module);
      }
    });
    return Array.from(modules).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (tab !== "all" && item.type !== (tab === "bugs" ? "bug" : "feature")) {
        return false;
      }
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }
      if (moduleFilter !== "all" && item.module !== moduleFilter) {
        return false;
      }
      return true;
    });
  }, [items, moduleFilter, statusFilter, tab]);

  const grouped = useMemo(() => {
    const map = new Map<FeedbackStatus, FeedbackReport[]>();
    STATUS_ORDER.forEach((status) => map.set(status, []));
    filteredItems.forEach((item) => {
      const bucket = map.get(item.status);
      if (bucket) bucket.push(item);
    });
    return map;
  }, [filteredItems]);

  const counts = useMemo(() => {
    const bugCount = items.filter((item) => item.type === "bug").length;
    const featureCount = items.filter((item) => item.type === "feature").length;
    return {
      bugs: bugCount,
      features: featureCount,
      all: items.length,
    };
  }, [items]);

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(value) => setTab(value as TabKey)}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="bugs">Bugs ({counts.bugs})</TabsTrigger>
            <TabsTrigger value="features">Features ({counts.features})</TabsTrigger>
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          </TabsList>
          <FeedbackFilters
            status={statusFilter}
            module={moduleFilter}
            modules={moduleOptions}
            onStatusChange={setStatusFilter}
            onModuleChange={setModuleFilter}
          />
        </div>

        <TabsContent value={tab} className="mt-4 space-y-6">
          {STATUS_ORDER.map((status) => {
            const entries = grouped.get(status) ?? [];
            if (entries.length === 0) return null;

            return (
              <div key={status} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    {FEEDBACK_STATUS_LABELS[status]}
                  </h3>
                  <span className="text-xs text-muted-foreground">{entries.length} items</span>
                </div>
                <div className="space-y-3">
                  {entries.map((item) => (
                    <FeedbackListItem key={item.id} item={item} />
                  ))}
                </div>
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No feedback matches the selected filters.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
