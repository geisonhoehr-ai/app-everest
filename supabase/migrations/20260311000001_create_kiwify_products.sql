-- Maps Kiwify product IDs to Everest classes
CREATE TABLE IF NOT EXISTS kiwify_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kiwify_product_id TEXT NOT NULL UNIQUE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE kiwify_products ENABLE ROW LEVEL SECURITY;

-- Only admins can manage product mappings
CREATE POLICY "Admins can manage kiwify_products"
  ON kiwify_products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'administrator'
    )
  );

-- Service role (edge functions) can read
CREATE POLICY "Service role can read kiwify_products"
  ON kiwify_products FOR SELECT
  USING (true);
