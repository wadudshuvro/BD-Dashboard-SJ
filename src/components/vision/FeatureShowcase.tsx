import { 
  Target, 
  Megaphone, 
  BarChart3, 
  PenTool, 
  MessageSquare, 
  CheckSquare 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

const features = [
  {
    icon: Target,
    name: "Pipeline Management",
    description: "Lead discovery to client conversion in 5 intelligent stages",
    href: "/prospecting",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: Megaphone,
    name: "Outreach & Campaigns",
    description: "Multi-channel campaign management with ROI tracking",
    href: "/campaigns",
    color: "from-violet-500 to-purple-500",
  },
  {
    icon: BarChart3,
    name: "Performance Tracking",
    description: "Personal dashboards, meetings, and EOD reports",
    href: "/bd/performance/personal",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: PenTool,
    name: "Document Signing",
    description: "Proposal signing workflow with PandaDoc integration",
    href: "/signing-documents",
    color: "from-orange-500 to-amber-500",
  },
  {
    icon: MessageSquare,
    name: "Feedback System",
    description: "Bug reports and feature requests with upvoting",
    href: "/feedback",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: CheckSquare,
    name: "Task Management",
    description: "Action items, notifications, and daily submissions",
    href: "/bd/actions/tasks",
    color: "from-indigo-500 to-blue-500",
  },
];

const FeatureShowcase = () => {
  return (
    <section>
      <h2 className="text-2xl font-bold text-foreground mb-2">Platform Modules</h2>
      <p className="text-muted-foreground mb-6">
        Everything you need to manage business development, integrated seamlessly
      </p>
      
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature) => (
          <Link key={feature.name} to={feature.href}>
            <Card className="group h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
              <CardContent className="p-5">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">
                  {feature.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default FeatureShowcase;
