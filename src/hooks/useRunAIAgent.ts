import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AgentRunRequest {
  agent_id: string;
  execution_context: {
    timeframe?: string;
    filters?: any;
    office_ids?: string[];
    user_id: string;
  };
}

interface AgentRunResponse {
  success: boolean;
  run_id: string;
  summary: string;
  tasks_created: number;
}

export function useRunAIAgent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: AgentRunRequest): Promise<AgentRunResponse> => {
      const { data, error } = await supabase.functions.invoke('run-ai-agent', {
        body: payload
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['ai-agent-runs'] });
      queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
    }
  });
}