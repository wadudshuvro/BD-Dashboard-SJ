import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { BrandKPI, CreateKPIData, UpdateKPIData } from '@/types/brand';

export const useBrandKPIs = (brandId: string | undefined) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch KPIs for a brand
  const { data, isLoading, error } = useQuery({
    queryKey: ['brand-kpis', brandId],
    queryFn: async () => {
      if (!brandId) throw new Error('Brand ID is required');

      const params = new URLSearchParams({ brand_id: brandId });

      const { data, error } = await supabase.functions.invoke('brand-kpis', {
        method: 'GET',
        body: params,
      });

      if (error) throw error;
      return data.kpis as BrandKPI[];
    },
    enabled: !!brandId,
  });

  // Create KPI mutation
  const createKPI = useMutation({
    mutationFn: async (kpiData: CreateKPIData) => {
      const { data, error } = await supabase.functions.invoke('brand-kpis', {
        method: 'POST',
        body: kpiData,
      });

      if (error) throw error;
      return data.kpi as BrandKPI;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-kpis', brandId] });
      queryClient.invalidateQueries({ queryKey: ['user-brands'] });
      queryClient.invalidateQueries({ queryKey: ['user-brand'] });
      toast({
        title: 'Success',
        description: 'KPI created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update KPI mutation
  const updateKPI = useMutation({
    mutationFn: async ({ id, ...kpiData }: UpdateKPIData) => {
      const { data, error } = await supabase.functions.invoke(`brand-kpis/${id}`, {
        method: 'PUT',
        body: kpiData,
      });

      if (error) throw error;
      return data.kpi as BrandKPI;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-kpis', brandId] });
      queryClient.invalidateQueries({ queryKey: ['user-brands'] });
      queryClient.invalidateQueries({ queryKey: ['user-brand'] });
      toast({
        title: 'Success',
        description: 'KPI updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete KPI mutation (soft delete)
  const deleteKPI = useMutation({
    mutationFn: async (kpiId: string) => {
      const { data, error } = await supabase.functions.invoke(`brand-kpis/${kpiId}`, {
        method: 'DELETE',
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-kpis', brandId] });
      queryClient.invalidateQueries({ queryKey: ['user-brands'] });
      queryClient.invalidateQueries({ queryKey: ['user-brand'] });
      toast({
        title: 'Success',
        description: 'KPI deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    kpis: data || [],
    isLoading,
    error,
    createKPI,
    updateKPI,
    deleteKPI,
  };
};
