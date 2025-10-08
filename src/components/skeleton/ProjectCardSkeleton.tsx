import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ProjectCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>
        <div className="flex -space-x-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}
