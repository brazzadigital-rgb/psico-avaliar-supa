-- Service Packages table
CREATE TABLE public.service_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  promotional_price numeric NOT NULL DEFAULT 0,
  original_price numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  is_highlighted boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Package items (services + quantity)
CREATE TABLE public.service_package_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.service_packages(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_package_items ENABLE ROW LEVEL SECURITY;

-- Anyone can read active packages
CREATE POLICY "Anyone can read active packages" ON public.service_packages
  FOR SELECT USING (is_active = true);

-- Admin can manage packages
CREATE POLICY "Admin can manage packages" ON public.service_packages
  FOR ALL TO authenticated USING (has_permission(auth.uid(), 'services.manage'));

-- Anyone can read package items
CREATE POLICY "Anyone can read package items" ON public.service_package_items
  FOR SELECT USING (true);

-- Admin can manage package items
CREATE POLICY "Admin can manage package items" ON public.service_package_items
  FOR ALL TO authenticated USING (has_permission(auth.uid(), 'services.manage'));