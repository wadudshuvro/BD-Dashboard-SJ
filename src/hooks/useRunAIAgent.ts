import { useMutation, useQueryClient } from "@tanstack/react-query";
import { triggerAgentRun, type AgentRunPayload, type AgentRunResponse } from "@/Api/aiAgents";

export function useRunAIAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AgentRunPayload): Promise<AgentRunResponse> => triggerAgentRun(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-agent-runs"] });
      queryClient.invalidateQueries({ queryKey: ["ai-agents"] });
    },
  });
}
