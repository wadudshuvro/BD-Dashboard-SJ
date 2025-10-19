import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateAgentConfig } from "@/Api/aiAgents";
import type { AgentConfigurationEnvelope } from "@/Api/aiAgents";

export function useUpdateAgentConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ agentId, config }: { agentId: string; config: AgentConfigurationEnvelope }) =>
      updateAgentConfig(agentId, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-agents"] });
    },
  });
}
