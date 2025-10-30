import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RunClientIntelligenceParams {
  clientId: string;
  question: string;
  mode?: "quick" | "deep";
}

export function useRunClientIntelligence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientId, question, mode = "quick" }: RunClientIntelligenceParams) => {
      const startTime = Date.now();
      
      const { data, error } = await supabase.functions.invoke("run-ai-agent", {
        body: {
          target: "client_intelligence",
          client_id: clientId,
          question,
          mode,
        },
      });

      if (error) throw error;
      
      const processingTime = Date.now() - startTime;
      
      return {
        ...data,
        processing_time_ms: processingTime,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["intelligence-sessions"] });
      toast.success("Intelligence analysis complete");
    },
    onError: (error: any) => {
      console.error("Intelligence analysis failed:", error);
      toast.error(error.message || "Failed to analyze client intelligence");
    },
  });
}
