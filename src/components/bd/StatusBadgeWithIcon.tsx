import { Badge } from "@/components/ui/badge";
import { User, Brain, Link2, CheckCircle, MessageSquare, Mail, Reply, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CampaignContactStatus } from "@/features/campaign-detail/types";

interface StatusBadgeWithIconProps {
  status: CampaignContactStatus;
  className?: string;
}

const statusConfig: Record<CampaignContactStatus, {
  label: string;
  icon: typeof User;
  className: string;
}> = {
  identified: {
    label: "Identified",
    icon: User,
    className: "bg-muted text-muted-foreground hover:bg-muted/80",
  },
  researched: {
    label: "Researched",
    icon: Brain,
    className: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 dark:text-blue-400",
  },
  contacted_linkedin: {
    label: "LinkedIn Request",
    icon: Link2,
    className: "bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 dark:text-indigo-400",
  },
  connected: {
    label: "Connected",
    icon: CheckCircle,
    className: "bg-green-500/10 text-green-600 hover:bg-green-500/20 dark:text-green-400",
  },
  messaged: {
    label: "Messaged",
    icon: MessageSquare,
    className: "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 dark:text-purple-400",
  },
  contacted_email: {
    label: "Email Sent",
    icon: Mail,
    className: "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 dark:text-orange-400",
  },
  responded: {
    label: "Responded",
    icon: Reply,
    className: "bg-teal-500/10 text-teal-600 hover:bg-teal-500/20 dark:text-teal-400",
  },
  meeting_booked: {
    label: "Meeting Booked",
    icon: Calendar,
    className: "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400 animate-pulse",
  },
};

export function StatusBadgeWithIcon({ status, className }: StatusBadgeWithIconProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "gap-1.5 font-medium",
        config.className,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );
}
