import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CodeRepository {
  id: string;
  name: string;
  description?: string;
  url: string;
  language?: string;
  framework?: string;
  project_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CodeAnalysisResult {
  id: string;
  repository_id?: string;
  analysis_type?: string;
  status?: string;
  results?: any;
  created_at: string;
  updated_at: string;
}

// Hook for managing code repositories
export function useCodeRepositories() {
  return useQuery({
    queryKey: ['code-repositories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('code_repositories')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as CodeRepository[];
    }
  });
}

// Hook for creating a code repository
export function useCreateCodeRepository() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (repository: Omit<CodeRepository, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('code_repositories')
        .insert(repository)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['code-repositories'] });
    }
  });
}

// Hook for running codebase analysis
export function useAnalyzeCodebase() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      repository_id,
      analysis_type,
      files,
      context
    }: {
      repository_id: string;
      analysis_type: 'architecture' | 'quality' | 'security' | 'performance' | 'documentation';
      files?: string[];
      context?: any;
    }) => {
      const { data, error } = await supabase.functions.invoke('analyze-codebase', {
        body: { repository_id, analysis_type, files, context }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['code-repositories'] });
      queryClient.invalidateQueries({ queryKey: ['code-analysis-results'] });
    }
  });
}

// Hook for fetching analysis results
export function useCodeAnalysisResults(repositoryId?: string) {
  return useQuery({
    queryKey: ['code-analysis-results', repositoryId],
    queryFn: async () => {
      let query = supabase
        .from('code_analyses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (repositoryId) {
        query = query.eq('repository_id', repositoryId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as CodeAnalysisResult[];
    },
    enabled: !!repositoryId || repositoryId === undefined
  });
}

// Hook for generating code
export function useGenerateCode() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (request: {
      template_id?: string;
      component_type: 'component' | 'hook' | 'api' | 'test' | 'utility' | 'page';
      name: string;
      description?: string;
      requirements?: string[];
      context?: any;
      variables?: Record<string, any>;
    }) => {
      const { data, error } = await supabase.functions.invoke('generate-code', {
        body: request
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent-runs'] });
      queryClient.invalidateQueries({ queryKey: ['code-generation-templates'] });
    }
  });
}

// Hook for updating analysis result status
export function useUpdateAnalysisStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      resultId, 
      status 
    }: { 
      resultId: string; 
      status: string;
    }) => {
      const { data, error } = await supabase
        .from('code_analyses')
        .update({ status })
        .eq('id', resultId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['code-analysis-results'] });
    }
  });
}