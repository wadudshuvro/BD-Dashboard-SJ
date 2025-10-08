import { FolderOpen } from "lucide-react";
import { EmptyState } from "./EmptyState";
import { useNavigate } from "react-router-dom";

export function EmptyProjects() {
  const navigate = useNavigate();

  return (
    <EmptyState
      icon={FolderOpen}
      title="No Projects Yet"
      description="Create projects to organize tasks, track progress, and collaborate with your team."
      primaryAction={{
        label: "Create Project",
        onClick: () => navigate("/projects"),
      }}
      secondaryAction={{
        label: "Import from ActiveCollab",
        onClick: () => navigate("/admin/integrations"),
        variant: "ghost",
      }}
    />
  );
}
