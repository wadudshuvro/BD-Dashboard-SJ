import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { User } from "lucide-react";

export default function MyDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Dashboard</h1>
        <p className="text-muted-foreground">Personal overview and quick actions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Welcome {user?.email}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Your personal dashboard.</p>
        </CardContent>
      </Card>
    </div>
  );
}
