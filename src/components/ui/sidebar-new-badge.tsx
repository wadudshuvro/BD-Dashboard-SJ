import { cn } from "@/lib/utils";

interface SidebarNewBadgeProps {
  className?: string;
}

export function SidebarNewBadge({ className }: SidebarNewBadgeProps) {
  return (
    <span
      className={cn(
        "absolute -top-1 -right-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
        "bg-emerald-500 text-white shadow-sm",
        className
      )}
    >
      New
    </span>
  );
}
