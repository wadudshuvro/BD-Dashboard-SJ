import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { BrandWithKPIs, BrandWithDetails } from '@/types/brand';

export const useUserBrands = () => {
  return useQuery({
    queryKey: ['user-brands'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('user-brands', {
        method: 'GET',
      });

      if (error) throw error;
      
      // Transform the data to match BrandWithKPIs structure
      return (data.brands || []).map((brand: any) => ({
        id: brand.brand_id,
        name: brand.brand_name,
        slug: brand.brand_slug,
        type: brand.brand_type,
        is_active: brand.is_active,
        logo_url: brand.logo_url,
        access_level: brand.access_level,
        kpis: brand.kpis || [],
        created_at: '',
        updated_at: '',
      })) as BrandWithKPIs[];
    },
  });
};

export const useBrandBySlug = (slug: string | undefined) => {
  return useQuery({
    queryKey: ['user-brand', slug],
    queryFn: async () => {
      if (!slug) throw new Error('Brand slug is required');

      const { data, error } = await supabase.functions.invoke(`user-brands/${slug}`, {
        method: 'GET',
      });

      if (error) throw error;
      return data.brand as BrandWithDetails;
    },
    enabled: !!slug,
  });
};
