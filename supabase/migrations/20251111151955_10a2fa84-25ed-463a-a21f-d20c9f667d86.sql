-- Create brands table
CREATE TABLE public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('internal', 'client')),
  description TEXT,
  owner_id UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  monthly_budget NUMERIC,
  logo_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_brands junction table
CREATE TABLE public.user_brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  access_level TEXT NOT NULL DEFAULT 'viewer' CHECK (access_level IN ('owner', 'manager', 'member', 'viewer')),
  can_view_kpis BOOLEAN NOT NULL DEFAULT true,
  can_edit_kpis BOOLEAN NOT NULL DEFAULT false,
  can_manage_team BOOLEAN NOT NULL DEFAULT false,
  can_edit_settings BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, brand_id)
);

-- Create brand_kpis table
CREATE TABLE public.brand_kpis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  kpi_type TEXT NOT NULL DEFAULT 'number' CHECK (kpi_type IN ('number', 'percentage', 'currency')),
  current_value NUMERIC DEFAULT 0,
  target_value NUMERIC,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'hubspot', 'google_analytics', 'linkedin', 'gohighlevel', 'custom')),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create brand_integrations table
CREATE TABLE public.brand_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL CHECK (integration_type IN ('hubspot', 'google_analytics', 'linkedin', 'gohighlevel', 'perplexity', 'exa', 'custom')),
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  config JSONB DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(brand_id, integration_type)
);

-- Create indexes for performance
CREATE INDEX idx_brands_owner ON public.brands(owner_id);
CREATE INDEX idx_brands_active ON public.brands(is_active);
CREATE INDEX idx_user_brands_user ON public.user_brands(user_id);
CREATE INDEX idx_user_brands_brand ON public.user_brands(brand_id);
CREATE INDEX idx_brand_kpis_brand ON public.brand_kpis(brand_id);
CREATE INDEX idx_brand_kpis_active ON public.brand_kpis(is_active);
CREATE INDEX idx_brand_integrations_brand ON public.brand_integrations(brand_id);

-- Trigger to auto-update updated_at columns
CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_brand_kpis_updated_at
  BEFORE UPDATE ON public.brand_kpis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_brand_integrations_updated_at
  BEFORE UPDATE ON public.brand_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate brand slug
CREATE OR REPLACE FUNCTION public.generate_brand_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug := LOWER(
      REGEXP_REPLACE(
        REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      )
    ) || '-' || SUBSTRING(NEW.id::text, 1, 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER generate_brand_slug_trigger
  BEFORE INSERT ON public.brands
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_brand_slug();

-- Function to check brand permission
CREATE OR REPLACE FUNCTION public.check_brand_permission(
  p_user_id UUID,
  p_brand_id UUID,
  p_permission TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Super admins have all permissions
  IF has_role(p_user_id, 'super_admin') OR has_role(p_user_id, 'admin') THEN
    RETURN true;
  END IF;
  
  -- Check user_brands permissions
  RETURN EXISTS (
    SELECT 1 FROM public.user_brands
    WHERE user_id = p_user_id 
      AND brand_id = p_brand_id
      AND (
        (p_permission = 'view' AND true) OR
        (p_permission = 'view_kpis' AND can_view_kpis) OR
        (p_permission = 'edit_kpis' AND can_edit_kpis) OR
        (p_permission = 'manage_team' AND can_manage_team) OR
        (p_permission = 'edit_settings' AND can_edit_settings) OR
        (p_permission = 'owner' AND access_level = 'owner')
      )
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Function to get user brands
CREATE OR REPLACE FUNCTION public.get_user_brands(p_user_id UUID)
RETURNS TABLE(
  brand_id UUID,
  brand_name TEXT,
  brand_slug TEXT,
  brand_type TEXT,
  is_active BOOLEAN,
  access_level TEXT,
  logo_url TEXT
) AS $$
BEGIN
  -- Super admins see all brands
  IF has_role(p_user_id, 'super_admin') OR has_role(p_user_id, 'admin') THEN
    RETURN QUERY
    SELECT 
      b.id,
      b.name,
      b.slug,
      b.type,
      b.is_active,
      'owner'::TEXT,
      b.logo_url
    FROM public.brands b
    WHERE b.is_active = true
    ORDER BY b.name;
  ELSE
    -- Regular users see only their brands
    RETURN QUERY
    SELECT 
      b.id,
      b.name,
      b.slug,
      b.type,
      b.is_active,
      ub.access_level,
      b.logo_url
    FROM public.brands b
    INNER JOIN public.user_brands ub ON ub.brand_id = b.id
    WHERE ub.user_id = p_user_id
      AND b.is_active = true
    ORDER BY b.name;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- RLS Policies for brands table
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all brands"
  ON public.brands
  FOR ALL
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view brands they have access to"
  ON public.brands
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_brands
      WHERE user_id = auth.uid() AND brand_id = brands.id
    )
  );

CREATE POLICY "Brand owners can update their brands"
  ON public.brands
  FOR UPDATE
  USING (
    check_brand_permission(auth.uid(), id, 'edit_settings')
  );

-- RLS Policies for user_brands table
ALTER TABLE public.user_brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own brand access"
  ON public.user_brands
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all user brand access"
  ON public.user_brands
  FOR ALL
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Brand managers can manage team access"
  ON public.user_brands
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_brands ub
      WHERE ub.user_id = auth.uid() 
        AND ub.brand_id = user_brands.brand_id
        AND ub.can_manage_team = true
    )
  );

-- RLS Policies for brand_kpis table
ALTER TABLE public.brand_kpis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view KPIs for their brands"
  ON public.brand_kpis
  FOR SELECT
  USING (
    check_brand_permission(auth.uid(), brand_id, 'view_kpis')
  );

CREATE POLICY "Users with permission can edit KPIs"
  ON public.brand_kpis
  FOR ALL
  USING (
    check_brand_permission(auth.uid(), brand_id, 'edit_kpis') OR
    has_role(auth.uid(), 'super_admin') OR 
    has_role(auth.uid(), 'admin')
  );

-- RLS Policies for brand_integrations table
ALTER TABLE public.brand_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view integrations for their brands"
  ON public.brand_integrations
  FOR SELECT
  USING (
    check_brand_permission(auth.uid(), brand_id, 'view')
  );

CREATE POLICY "Only brand owners and admins can manage integrations"
  ON public.brand_integrations
  FOR ALL
  USING (
    check_brand_permission(auth.uid(), brand_id, 'edit_settings') OR
    has_role(auth.uid(), 'super_admin') OR 
    has_role(auth.uid(), 'admin')
  );

-- Add brand_id to existing tables (optional, for future linking)
ALTER TABLE public.bd_campaigns ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id);
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id);
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id);

CREATE INDEX IF NOT EXISTS idx_campaigns_brand ON public.bd_campaigns(brand_id);
CREATE INDEX IF NOT EXISTS idx_deals_brand ON public.deals(brand_id);
CREATE INDEX IF NOT EXISTS idx_clients_brand ON public.clients(brand_id);