import { Brain, Workflow, UserCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const pillars = [
  {
    icon: Brain,
    title: "Always-On Intelligence",
    description:
      "Agents anticipate opportunities across verticals and surface actionable briefs without human prompts. The system learns from every interaction.",
  },
  {
    icon: Workflow,
    title: "Composable Workflows",
    description:
      "Business teams orchestrate complex BD sequences—research → outreach → follow-up—without writing code. Mix and match agents like building blocks.",
  },
  {
    icon: UserCheck,
    title: "Human-in-the-Loop",
    description:
      "Clear checkpoints for approvals, ensuring compliance and relationship nuance. AI suggests, humans decide. Full audit trail for every action.",
  },
];

const VisionPillars = () => {
  return (
    <section>
      <h2 className="text-2xl font-bold text-foreground mb-6">Why We Built This</h2>
      
      <div className="grid md:grid-cols-3 gap-6">
        {pillars.map((pillar) => (
          <Card key={pillar.title} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <pillar.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-2">
                {pillar.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {pillar.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default VisionPillars;
