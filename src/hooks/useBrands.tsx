import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Brand, BrandFilters, CreateBrandData, UpdateBrandData } from '@/types/brand';

export const useBrands = (filters?: BrandFilters, page = 1, limit = 10) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch brands (admin only)
  const { data, isLoading, error } = useQuery({
    queryKey: ['brands', filters, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (filters?.search) params.append('search', filters.search);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.is_active !== undefined) params.append('is_active', String(filters.is_active));

      const { data, error } = await supabase.functions.invoke('admin-brands', {
        method: 'GET',
        body: params,
      });

      if (error) throw error;
      return data as { brands: Brand[]; total: number };
    },
  });

  // Create brand mutation
  const createBrand = useMutation({
    mutationFn: async (brandData: CreateBrandData) => {
      const { data, error } = await supabase.functions.invoke('admin-brands', {
        method: 'POST',
        body: brandData,
      });

      if (error) throw error;
      return data.brand as Brand;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast({
        title: 'Success',
        description: 'Brand created successfully',
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

  // Update brand mutation
  const updateBrand = useMutation({
    mutationFn: async ({ id, ...brandData }: UpdateBrandData) => {
      const { data, error } = await supabase.functions.invoke(`admin-brands/${id}`, {
        method: 'PUT',
        body: brandData,
      });

      if (error) throw error;
      return data.brand as Brand;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast({
        title: 'Success',
        description: 'Brand updated successfully',
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

  // Delete brand mutation (soft delete)
  const deleteBrand = useMutation({
    mutationFn: async (brandId: string) => {
      const { data, error } = await supabase.functions.invoke(`admin-brands/${brandId}`, {
        method: 'DELETE',
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast({
        title: 'Success',
        description: 'Brand deactivated successfully',
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
    brands: data?.brands || [],
    total: data?.total || 0,
    isLoading,
    error,
    createBrand,
    updateBrand,
    deleteBrand,
  };
};
