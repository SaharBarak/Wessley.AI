-- 005_marketplace_advanced.sql - Advanced marketplace features
-- Fault detection, transactions, commission tracking, shopping cart

-- =========================================
-- ADVANCED MARKETPLACE FEATURES
-- =========================================

-- Fault detection and expense projections
CREATE TABLE public.fault_detections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Component identification
  component_name TEXT NOT NULL,
  component_type TEXT,
  component_location TEXT,
  
  -- Fault details
  fault_description TEXT NOT NULL,
  fault_severity TEXT DEFAULT 'medium' CHECK (fault_severity IN ('low', 'medium', 'high', 'critical')),
  symptoms TEXT[],
  
  -- Detection source
  detection_source TEXT NOT NULL CHECK (detection_source IN ('user_report', 'image_analysis', 'neo4j_analysis', 'diagnostic_tool')),
  source_reference_id UUID,
  detection_confidence DECIMAL(3,2),
  
  -- Expense projection
  estimated_repair_cost DECIMAL(12,2),
  estimated_parts_cost DECIMAL(12,2),
  estimated_labor_hours DECIMAL(5,2),
  
  -- Recommendations
  recommended_action TEXT CHECK (recommended_action IN ('monitor', 'schedule_repair', 'immediate_attention', 'replace_soon')),
  recommended_parts UUID[], -- Array of part_catalog IDs
  
  -- Status tracking
  status TEXT DEFAULT 'detected' CHECK (status IN ('detected', 'investigating', 'confirmed', 'repair_scheduled', 'repaired', 'false_positive')),
  
  -- Resolution tracking
  actual_repair_cost DECIMAL(12,2),
  repair_date DATE,
  repair_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shopping cart for marketplace
CREATE TABLE public.shopping_cart (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_workspace_cart UNIQUE (user_id, workspace_id)
);

-- Shopping cart items
CREATE TABLE public.shopping_cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID NOT NULL REFERENCES public.shopping_cart(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES public.parts_catalog(id) ON DELETE CASCADE,
  
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  
  -- Price at time of adding to cart (for price change tracking)
  original_price DECIMAL(12,2),
  price_changed BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_cart_part UNIQUE (cart_id, part_id)
);

-- Marketplace transactions and commission tracking
CREATE TABLE public.marketplace_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  part_id UUID REFERENCES public.parts_catalog(id) ON DELETE SET NULL,
  
  -- Transaction details
  order_number TEXT NOT NULL UNIQUE,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) DEFAULT 0.00,
  shipping_amount DECIMAL(12,2) DEFAULT 0.00,
  
  -- Commission calculation
  commission_rate DECIMAL(5,4) NOT NULL,
  commission_amount DECIMAL(12,2) GENERATED ALWAYS AS (total_amount * commission_rate) STORED,
  
  -- Transaction status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  
  -- Tracking information
  tracking_number TEXT,
  estimated_delivery_date DATE,
  actual_delivery_date DATE,
  
  -- External payment reference
  payment_intent_id TEXT, -- Stripe, etc.
  external_order_id TEXT, -- Supplier's order ID
  
  -- Related expense (auto-created)
  expense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transaction items for bulk orders
CREATE TABLE public.transaction_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES public.marketplace_transactions(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES public.parts_catalog(id) ON DELETE CASCADE,
  
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  
  -- Part details at time of purchase (for historical reference)
  part_name TEXT NOT NULL,
  part_number TEXT NOT NULL,
  supplier_name TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Commission payouts to suppliers
CREATE TABLE public.commission_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  
  -- Payout details
  payout_amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Payout period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Transaction references
  transaction_ids UUID[] NOT NULL,
  total_transactions INTEGER NOT NULL,
  total_commission DECIMAL(12,2) NOT NULL,
  
  -- Payout status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'disputed')),
  
  -- External references
  external_payout_id TEXT,
  payment_method TEXT,
  
  -- Metadata
  notes TEXT,
  processed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketplace analytics and metrics
CREATE TABLE public.marketplace_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Metric identification
  metric_type TEXT NOT NULL CHECK (metric_type IN ('daily_sales', 'supplier_performance', 'part_popularity', 'user_behavior', 'commission_summary')),
  metric_date DATE NOT NULL,
  
  -- Dimensional data
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  part_id UUID REFERENCES public.parts_catalog(id) ON DELETE CASCADE,
  category TEXT,
  
  -- Metric values
  metric_data JSONB NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_metric_date UNIQUE (metric_type, metric_date, supplier_id, part_id, category)
);

-- =========================================
-- CREATE INDEXES FOR PERFORMANCE
-- =========================================

-- Fault detection indexes
CREATE INDEX idx_fault_detections_workspace_id ON public.fault_detections(workspace_id);
CREATE INDEX idx_fault_detections_user_id ON public.fault_detections(user_id);
CREATE INDEX idx_fault_detections_status ON public.fault_detections(status);
CREATE INDEX idx_fault_detections_severity ON public.fault_detections(fault_severity);
CREATE INDEX idx_fault_detections_source ON public.fault_detections(detection_source);
CREATE INDEX idx_fault_detections_created_at ON public.fault_detections(created_at);

-- Shopping cart indexes
CREATE INDEX idx_shopping_cart_user_id ON public.shopping_cart(user_id);
CREATE INDEX idx_shopping_cart_workspace_id ON public.shopping_cart(workspace_id);
CREATE INDEX idx_shopping_cart_items_cart_id ON public.shopping_cart_items(cart_id);
CREATE INDEX idx_shopping_cart_items_part_id ON public.shopping_cart_items(part_id);

-- Transaction indexes
CREATE INDEX idx_marketplace_transactions_user_id ON public.marketplace_transactions(user_id);
CREATE INDEX idx_marketplace_transactions_workspace_id ON public.marketplace_transactions(workspace_id);
CREATE INDEX idx_marketplace_transactions_supplier_id ON public.marketplace_transactions(supplier_id);
CREATE INDEX idx_marketplace_transactions_part_id ON public.marketplace_transactions(part_id);
CREATE INDEX idx_marketplace_transactions_status ON public.marketplace_transactions(status);
CREATE INDEX idx_marketplace_transactions_payment_status ON public.marketplace_transactions(payment_status);
CREATE INDEX idx_marketplace_transactions_created_at ON public.marketplace_transactions(created_at);
CREATE INDEX idx_marketplace_transactions_order_number ON public.marketplace_transactions(order_number);

CREATE INDEX idx_transaction_items_transaction_id ON public.transaction_items(transaction_id);
CREATE INDEX idx_transaction_items_part_id ON public.transaction_items(part_id);

-- Commission indexes
CREATE INDEX idx_commission_payouts_supplier_id ON public.commission_payouts(supplier_id);
CREATE INDEX idx_commission_payouts_status ON public.commission_payouts(status);
CREATE INDEX idx_commission_payouts_period ON public.commission_payouts(period_start, period_end);
CREATE INDEX idx_commission_payouts_created_at ON public.commission_payouts(created_at);

-- Metrics indexes
CREATE INDEX idx_marketplace_metrics_type_date ON public.marketplace_metrics(metric_type, metric_date);
CREATE INDEX idx_marketplace_metrics_supplier_id ON public.marketplace_metrics(supplier_id);
CREATE INDEX idx_marketplace_metrics_part_id ON public.marketplace_metrics(part_id);

-- =========================================
-- ENABLE ROW LEVEL SECURITY
-- =========================================

ALTER TABLE public.fault_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;

-- Admin-only tables (no user RLS)
-- commission_payouts, marketplace_metrics

-- =========================================
-- ROW LEVEL SECURITY POLICIES
-- =========================================

-- Fault detection policies
CREATE POLICY "Users can manage own fault detections" ON public.fault_detections
  FOR ALL USING (auth.uid() = user_id);

-- Shopping cart policies
CREATE POLICY "Users can manage own shopping cart" ON public.shopping_cart
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own cart items" ON public.shopping_cart_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.shopping_cart 
      WHERE shopping_cart.id = shopping_cart_items.cart_id 
      AND shopping_cart.user_id = auth.uid()
    )
  );

-- Transaction policies
CREATE POLICY "Users can manage own transactions" ON public.marketplace_transactions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transaction items" ON public.transaction_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_transactions 
      WHERE marketplace_transactions.id = transaction_items.transaction_id 
      AND marketplace_transactions.user_id = auth.uid()
    )
  );

-- =========================================
-- ADVANCED MARKETPLACE FUNCTIONS
-- =========================================

-- Function to auto-create expense from marketplace transaction
CREATE OR REPLACE FUNCTION public.create_expense_from_transaction()
RETURNS TRIGGER AS $$
DECLARE
  category_id UUID;
  expense_id UUID;
BEGIN
  -- Only create expense for confirmed transactions
  IF NEW.status = 'confirmed' AND NEW.expense_id IS NULL THEN
    
    -- Find or create "Parts & Components" category
    SELECT id INTO category_id
    FROM public.expense_categories 
    WHERE user_id IS NULL AND name = 'Parts & Components'
    LIMIT 1;
    
    -- Create the expense
    INSERT INTO public.expenses (
      workspace_id,
      user_id,
      category_id,
      amount,
      description,
      vendor_name,
      vendor_website,
      receipt_number,
      expense_date,
      payment_method,
      status
    ) VALUES (
      NEW.workspace_id,
      NEW.user_id,
      category_id,
      NEW.total_amount + NEW.tax_amount + NEW.shipping_amount,
      'Marketplace purchase: ' || COALESCE(
        (SELECT part_name FROM public.parts_catalog WHERE id = NEW.part_id),
        'Multiple items'
      ),
      (SELECT name FROM public.suppliers WHERE id = NEW.supplier_id),
      (SELECT website_url FROM public.suppliers WHERE id = NEW.supplier_id),
      NEW.order_number,
      CURRENT_DATE,
      'marketplace',
      'confirmed'
    ) RETURNING id INTO expense_id;
    
    -- Link the expense to the transaction
    NEW.expense_id := expense_id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update part purchase count
CREATE OR REPLACE FUNCTION public.update_part_purchase_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND NEW.part_id IS NOT NULL THEN
    UPDATE public.parts_catalog 
    SET purchase_count = purchase_count + NEW.quantity
    WHERE id = NEW.part_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT AS $$
DECLARE
  order_number TEXT;
  counter INTEGER := 1;
BEGIN
  -- Generate base order number: WES + YYYYMMDD + random
  order_number := 'WES' || to_char(NOW(), 'YYYYMMDD') || substr(encode(gen_random_bytes(3), 'hex'), 1, 6);
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.marketplace_transactions WHERE order_number = order_number) LOOP
    order_number := 'WES' || to_char(NOW(), 'YYYYMMDD') || substr(encode(gen_random_bytes(3), 'hex'), 1, 6);
    counter := counter + 1;
    -- Prevent infinite loop
    EXIT WHEN counter > 100;
  END LOOP;
  
  RETURN order_number;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate commission payouts for a period
CREATE OR REPLACE FUNCTION public.calculate_commission_payout(
  p_supplier_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  total_transactions INTEGER,
  total_sales DECIMAL(12,2),
  total_commission DECIMAL(12,2),
  transaction_ids UUID[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_transactions,
    SUM(mt.total_amount) as total_sales,
    SUM(mt.commission_amount) as total_commission,
    array_agg(mt.id) as transaction_ids
  FROM public.marketplace_transactions mt
  WHERE mt.supplier_id = p_supplier_id
  AND mt.status = 'delivered'
  AND mt.created_at::date BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get marketplace dashboard metrics
CREATE OR REPLACE FUNCTION public.get_marketplace_dashboard_metrics(
  p_user_id UUID,
  p_date_range INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_purchases INTEGER,
  total_spent DECIMAL(12,2),
  active_carts INTEGER,
  pending_orders INTEGER,
  delivered_orders INTEGER,
  favorite_supplier TEXT,
  most_purchased_category TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM public.marketplace_transactions 
     WHERE user_id = p_user_id AND created_at >= NOW() - (p_date_range || ' days')::interval),
    
    (SELECT COALESCE(SUM(total_amount), 0) FROM public.marketplace_transactions 
     WHERE user_id = p_user_id AND status IN ('confirmed', 'delivered') 
     AND created_at >= NOW() - (p_date_range || ' days')::interval),
    
    (SELECT COUNT(*)::INTEGER FROM public.shopping_cart WHERE user_id = p_user_id),
    
    (SELECT COUNT(*)::INTEGER FROM public.marketplace_transactions 
     WHERE user_id = p_user_id AND status IN ('pending', 'confirmed', 'shipped')),
    
    (SELECT COUNT(*)::INTEGER FROM public.marketplace_transactions 
     WHERE user_id = p_user_id AND status = 'delivered'),
    
    (SELECT s.name FROM public.marketplace_transactions mt
     JOIN public.suppliers s ON s.id = mt.supplier_id
     WHERE mt.user_id = p_user_id
     GROUP BY s.id, s.name
     ORDER BY COUNT(*) DESC
     LIMIT 1),
    
    (SELECT pc.category FROM public.marketplace_transactions mt
     JOIN public.parts_catalog pc ON pc.id = mt.part_id
     WHERE mt.user_id = p_user_id
     GROUP BY pc.category
     ORDER BY COUNT(*) DESC
     LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================
-- CREATE TRIGGERS
-- =========================================

-- Auto-create expense from marketplace transaction
CREATE TRIGGER create_expense_from_transaction_trigger BEFORE UPDATE ON public.marketplace_transactions
  FOR EACH ROW EXECUTE FUNCTION public.create_expense_from_transaction();

-- Update part purchase count on transaction confirmation
CREATE TRIGGER update_part_purchase_count_trigger AFTER UPDATE ON public.marketplace_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_part_purchase_count();

-- Update timestamps
CREATE TRIGGER update_fault_detections_updated_at BEFORE UPDATE ON public.fault_detections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shopping_cart_updated_at BEFORE UPDATE ON public.shopping_cart
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shopping_cart_items_updated_at BEFORE UPDATE ON public.shopping_cart_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketplace_transactions_updated_at BEFORE UPDATE ON public.marketplace_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_commission_payouts_updated_at BEFORE UPDATE ON public.commission_payouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();