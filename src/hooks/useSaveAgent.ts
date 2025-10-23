import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAgent, updateAgentDetails } from "@/Api/aiAgents";
import type { AgentFormState } from "@/features/ai/agents/types";

function buildPayload(state: AgentFormState) {
  return {
    name: state.name.trim(),
    description: state.description?.trim() || null,
    slug: state.slug?.trim() || null,
    category: state.category?.trim() || null,
    type: state.type,
    config: state.config,
    is_active: state.is_active ?? null,
    is_enabled: state.is_enabled ?? null,
    system_prompt: state.system_prompt?.trim() || null,
    prompt_template: state.prompt_template?.trim() || null,
    data_source_config: state.data_source_config ?? null,
    output_actions: state.output_actions ?? null,
    schedule_config: state.schedule_config ?? null,
  };
}

export function useSaveAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (state: AgentFormState) => {
      const payload = buildPayload(state);
      if (state.id) {
        return updateAgentDetails(state.id, payload);
      }
      return createAgent(payload);
    },
    onSuccess: (agent) => {
      queryClient.invalidateQueries({ queryKey: ["ai-agents"] });
      queryClient.invalidateQueries({ queryKey: ["ai-agent-runs"] });
      return agent;
    },
  });
}
