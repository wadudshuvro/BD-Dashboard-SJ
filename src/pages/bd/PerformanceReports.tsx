import { Card, CardContent } from "@/components/ui/card";
import { FileBarChart } from "lucide-react";

export default function PerformanceReports() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-muted p-4">
                <FileBarChart className="h-12 w-12 text-muted-foreground" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold mb-2">Coming Soon</h2>
            <p className="text-muted-foreground">
              Performance reports and analytics will be available here soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
