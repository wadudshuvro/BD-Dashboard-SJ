import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CodeRepository {
  id: string;
  name: string;
  description?: string;
  repository_url?: string;
  branch: string;
  language?: string;
  framework?: string;
  last_analyzed_at?: string;
  analysis_status: 'pending' | 'analyzing' | 'completed' | 'error';
  metadata: any;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CodeAnalysisResult {
  id: string;
  repository_id: string;
  analysis_type: 'architecture' | 'quality' | 'security' | 'performance' | 'documentation';
  file_path?: string;
  findings: any;
  severity: 'info' | 'warning' | 'error' | 'critical';
  status: 'active' | 'resolved' | 'ignored';
  agent_run_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CodeGenerationTemplate {
  id: string;
  name: string;
  description?: string;
  category: 'component' | 'hook' | 'api' | 'test' | 'utility' | 'page';
  template_content: string;
  variables: any;
  framework?: string;
  language: string;
  is_active: boolean;
  usage_count: number;
  created_by?: string;
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
    mutationFn: async (repository: Omit<CodeRepository, 'id' | 'created_at' | 'updated_at' | 'analysis_status'>) => {
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
        .from('code_analysis_results')
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

// Hook for managing code generation templates
export function useCodeGenerationTemplates(category?: string) {
  return useQuery({
    queryKey: ['code-generation-templates', category],
    queryFn: async () => {
      let query = supabase
        .from('code_generation_templates')
        .select('*')
        .eq('is_active', true)
        .order('usage_count', { ascending: false });
      
      if (category) {
        query = query.eq('category', category);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as CodeGenerationTemplate[];
    }
  });
}

// Hook for creating custom templates
export function useCreateCodeTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (template: Omit<CodeGenerationTemplate, 'id' | 'created_at' | 'updated_at' | 'usage_count'>) => {
      const { data, error } = await supabase
        .from('code_generation_templates')
        .insert(template)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
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
      status: 'active' | 'resolved' | 'ignored' 
    }) => {
      const { data, error } = await supabase
        .from('code_analysis_results')
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