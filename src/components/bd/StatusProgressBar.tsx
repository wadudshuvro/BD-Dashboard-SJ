import { CheckCircle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CampaignContactStatus } from "@/features/campaign-detail/types";

interface StatusProgressBarProps {
  currentStatus: CampaignContactStatus;
  className?: string;
}

const statusFlow: { status: CampaignContactStatus; label: string }[] = [
  { status: "identified", label: "ID" },
  { status: "researched", label: "RES" },
  { status: "contacted_linkedin", label: "Social" },
  { status: "connected", label: "CON" },
  { status: "messaged", label: "MSG" },
  { status: "contacted_email", label: "EML" },
  { status: "responded", label: "RSP" },
  { status: "meeting_booked", label: "MTG" },
  { status: "close_lost", label: "LOST" },
  { status: "won", label: "WON" },
];

export function StatusProgressBar({ currentStatus, className }: StatusProgressBarProps) {
  const currentIndex = statusFlow.findIndex(s => s.status === currentStatus);

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {statusFlow.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const isLast = index === statusFlow.length - 1;

          return (
            <div key={step.status} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                    isCompleted
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                    isCurrent && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                </div>
                <span
                  className={cn(
                    "mt-1 text-xs font-medium",
                    isCompleted ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "mx-2 h-0.5 flex-1 transition-all",
                    isCompleted ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
