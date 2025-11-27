import { CheckCircle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CampaignContactStatus } from "@/features/campaign-detail/types";

interface StatusProgressBarProps {
  currentStatus: CampaignContactStatus;
  completedStages?: CampaignContactStatus[];
  onStageToggle?: (stage: CampaignContactStatus) => void;
  className?: string;
}

const statusFlow: { status: CampaignContactStatus; label: string }[] = [
  { status: "identified", label: "ID" },
  { status: "researched", label: "RES" },
  { status: "client_not_ideal", label: "Not Ideal" },
  { status: "contacted_linkedin", label: "LinkedIn" },
  { status: "contacted_social", label: "FB/IG" },
  { status: "connected", label: "CON" },
  { status: "client_not_responsive", label: "Not Resp" },
  { status: "messaged", label: "MSG" },
  { status: "contacted_email", label: "EML" },
  { status: "responded", label: "RSP" },
  { status: "meeting_booked", label: "MTG" },
  { status: "close_lost", label: "LOST" },
  { status: "won", label: "WON" },
];

export function StatusProgressBar({ 
  currentStatus, 
  completedStages = [], 
  onStageToggle,
  className 
}: StatusProgressBarProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {statusFlow.map((step, index) => {
          const isCompleted = completedStages.includes(step.status);
          const isCurrent = step.status === currentStatus;
          const isLast = index === statusFlow.length - 1;
          const isClickable = !!onStageToggle;

          return (
            <div key={step.status} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => onStageToggle?.(step.status)}
                  disabled={!isClickable}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                    isCompleted
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                    isCurrent && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                    isClickable && "cursor-pointer hover:scale-110 hover:shadow-md active:scale-95",
                    !isClickable && "cursor-default"
                  )}
                  title={isClickable ? `Click to ${isCompleted ? 'uncomplete' : 'complete'} ${step.label}` : step.label}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                </button>
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
                    "bg-muted"
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
