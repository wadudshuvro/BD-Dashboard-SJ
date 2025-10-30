-- Add slug column to deals table
ALTER TABLE deals ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_deals_slug ON deals(slug);

-- Create function to generate short slugs
CREATE OR REPLACE FUNCTION generate_deal_slug(deal_title TEXT, deal_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  slug_base TEXT;
  numeric_suffix TEXT;
  final_slug TEXT;
  counter INT := 0;
BEGIN
  -- Take first 4 words, convert to kebab-case
  slug_base := lower(regexp_replace(
    substring(deal_title from 1 for 50),
    '[^a-z0-9]+', '-', 'g'
  ));
  slug_base := trim(both '-' from slug_base);
  
  -- Generate 5-digit random number
  numeric_suffix := lpad(floor(random() * 99999)::text, 5, '0');
  final_slug := slug_base || '-' || numeric_suffix;
  
  -- Ensure uniqueness
  WHILE EXISTS(SELECT 1 FROM deals WHERE slug = final_slug AND id != deal_id) LOOP
    counter := counter + 1;
    IF counter > 10 THEN
      -- Add timestamp if collision after 10 tries
      final_slug := slug_base || '-' || numeric_suffix || '-' || extract(epoch from now())::bigint::text;
      EXIT;
    END IF;
    numeric_suffix := lpad(floor(random() * 99999)::text, 5, '0');
    final_slug := slug_base || '-' || numeric_suffix;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Create trigger to auto-generate slug
CREATE OR REPLACE FUNCTION auto_generate_deal_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug := generate_deal_slug(NEW.title, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_generate_deal_slug ON deals;
CREATE TRIGGER trigger_auto_generate_deal_slug
BEFORE INSERT OR UPDATE OF title ON deals
FOR EACH ROW
EXECUTE FUNCTION auto_generate_deal_slug();

-- Backfill slugs for existing deals
UPDATE deals SET slug = generate_deal_slug(title, id) WHERE slug IS NULL;

-- Create employees table for Control Tower sync
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_tower_id TEXT UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT,
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  synced_from_control_tower BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employees_control_tower_id ON employees(control_tower_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);

-- RLS for employees
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view employees"
ON employees FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage employees"
ON employees FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin') OR 
  has_role(auth.uid(), 'admin')
);

-- Create deal_reminders table
CREATE TABLE IF NOT EXISTS deal_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  recipient_id UUID,
  recipient_email TEXT NOT NULL,
  reminder_type TEXT NOT NULL DEFAULT 'follow_up',
  reminder_date TIMESTAMPTZ NOT NULL,
  message TEXT,
  sent_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deal_reminders_deal_id ON deal_reminders(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_reminders_date ON deal_reminders(reminder_date) WHERE sent_at IS NULL;

-- RLS for reminders
ALTER TABLE deal_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reminders for accessible deals"
ON deal_reminders FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM deals 
    WHERE deals.id = deal_reminders.deal_id 
    AND (
      deals.owner_id = auth.uid() OR
      deals.pm_assigned_id = auth.uid() OR
      has_role(auth.uid(), 'super_admin') OR
      has_role(auth.uid(), 'admin')
    )
  )
);

CREATE POLICY "Users can create reminders for accessible deals"
ON deal_reminders FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM deals 
    WHERE deals.id = deal_reminders.deal_id 
    AND (
      deals.owner_id = auth.uid() OR
      deals.pm_assigned_id = auth.uid() OR
      has_role(auth.uid(), 'super_admin') OR
      has_role(auth.uid(), 'admin')
    )
  )
);

CREATE POLICY "Admins can manage all reminders"
ON deal_reminders FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin') OR 
  has_role(auth.uid(), 'admin')
);

-- Add pm_control_tower_id to deals table
ALTER TABLE deals ADD COLUMN IF NOT EXISTS pm_control_tower_id TEXT;
CREATE INDEX IF NOT EXISTS idx_deals_pm_control_tower_id ON deals(pm_control_tower_id);