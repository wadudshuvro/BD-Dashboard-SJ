import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EODSubmissionForm } from "@/components/eod/EODSubmissionForm";
import { UserCircle, ClipboardList, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Update your accountability chart and submit your daily work progress
        </p>
      </div>

      {/* Accountability Chart Prompt */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <UserCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Update Your Accountability Chart</CardTitle>
                <CardDescription className="mt-1">
                  Keep your responsibilities and roles up to date in your profile
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your accountability chart helps define your role, responsibilities, and areas of ownership. 
              Keeping it current ensures clear communication and expectations across the team.
            </p>
            <Button 
              onClick={() => navigate('/my-profile')}
              className="w-full sm:w-auto"
            >
              Go to My Profile
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* EOD Submission */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">End of Day Submission</h2>
        </div>
        <EODSubmissionForm />
      </div>
    </div>
  );
}
