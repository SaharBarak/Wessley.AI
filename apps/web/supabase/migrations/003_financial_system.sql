-- 003_financial_system.sql - Complete financial tracking system
-- Expense categories, expenses with GPT inference, budgets, financial analytics

-- =========================================
-- FINANCIAL TRACKING SYSTEM
-- =========================================

-- Expense categories (predefined + custom)
CREATE TABLE public.expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE, -- NULL for global categories
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for system categories
  
  name TEXT NOT NULL,
  description TEXT,
  color_hex TEXT DEFAULT '#6B7280',
  icon TEXT,
  
  -- Category type
  is_system_category BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comprehensive expense tracking with GPT inference
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.workspace_posts(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  
  -- Basic expense data
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  description TEXT NOT NULL,
  
  -- Detailed vendor/supplier information
  vendor_name TEXT,
  vendor_contact TEXT,
  vendor_website TEXT,
  
  -- Receipt and documentation
  receipt_media_id UUID REFERENCES public.media_files(id) ON DELETE SET NULL,
  receipt_number TEXT,
  invoice_number TEXT,
  
  -- Parts/product details (GPT inferred)
  part_numbers TEXT[],
  part_descriptions TEXT[],
  quantities INTEGER[],
  unit_prices DECIMAL(12,2)[],
  
  -- Financial details
  tax_amount DECIMAL(12,2) DEFAULT 0.00,
  shipping_amount DECIMAL(12,2) DEFAULT 0.00,
  discount_amount DECIMAL(12,2) DEFAULT 0.00,
  
  -- Warranty and return info
  warranty_period_months INTEGER,
  return_policy TEXT,
  
  -- GPT inference metadata
  gpt_inferred_fields JSONB DEFAULT '{}'::jsonb,
  gpt_confidence_score DECIMAL(3,2),
  manual_verification_required BOOLEAN DEFAULT false,
  manually_verified BOOLEAN DEFAULT false,
  
  -- Expense metadata
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'disputed', 'refunded')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget management (workspace and post level)
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.workspace_posts(id) ON DELETE CASCADE, -- NULL for workspace-level budget
  
  -- Budget details
  name TEXT NOT NULL,
  description TEXT,
  total_amount DECIMAL(12,2) NOT NULL,
  spent_amount DECIMAL(12,2) DEFAULT 0.00,
  remaining_amount DECIMAL(12,2) GENERATED ALWAYS AS (total_amount - spent_amount) STORED,
  
  -- Budget period
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  
  -- Alerts and notifications
  alert_threshold_percentage INTEGER DEFAULT 80,
  alert_enabled BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget allocations to track spending against specific budgets
CREATE TABLE public.budget_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  
  allocated_amount DECIMAL(12,2) NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_budget_expense UNIQUE (budget_id, expense_id)
);

-- =========================================
-- CREATE INDEXES FOR PERFORMANCE
-- =========================================

-- Expense category indexes
CREATE INDEX idx_expense_categories_user_id ON public.expense_categories(user_id);
CREATE INDEX idx_expense_categories_workspace_id ON public.expense_categories(workspace_id);
CREATE INDEX idx_expense_categories_is_system ON public.expense_categories(is_system_category);
CREATE INDEX idx_expense_categories_is_active ON public.expense_categories(is_active);

-- Expense indexes
CREATE INDEX idx_expenses_workspace_id ON public.expenses(workspace_id);
CREATE INDEX idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX idx_expenses_post_id ON public.expenses(post_id);
CREATE INDEX idx_expenses_category_id ON public.expenses(category_id);
CREATE INDEX idx_expenses_expense_date ON public.expenses(expense_date);
CREATE INDEX idx_expenses_status ON public.expenses(status);
CREATE INDEX idx_expenses_vendor_name ON public.expenses(vendor_name);
CREATE INDEX idx_expenses_receipt_media_id ON public.expenses(receipt_media_id);
CREATE INDEX idx_expenses_verification ON public.expenses(manual_verification_required) WHERE manual_verification_required = true;

-- Budget indexes
CREATE INDEX idx_budgets_workspace_id ON public.budgets(workspace_id);
CREATE INDEX idx_budgets_post_id ON public.budgets(post_id);
CREATE INDEX idx_budgets_start_date ON public.budgets(start_date);
CREATE INDEX idx_budgets_end_date ON public.budgets(end_date);
CREATE INDEX idx_budgets_alert_enabled ON public.budgets(alert_enabled) WHERE alert_enabled = true;

-- Budget allocation indexes
CREATE INDEX idx_budget_allocations_budget_id ON public.budget_allocations(budget_id);
CREATE INDEX idx_budget_allocations_expense_id ON public.budget_allocations(expense_id);

-- =========================================
-- ENABLE ROW LEVEL SECURITY
-- =========================================

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_allocations ENABLE ROW LEVEL SECURITY;

-- =========================================
-- ROW LEVEL SECURITY POLICIES
-- =========================================

-- Expense categories policies
CREATE POLICY "Users can view global and own expense categories" ON public.expense_categories
  FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can manage own expense categories" ON public.expense_categories
  FOR ALL USING (auth.uid() = user_id);

-- Expenses policies
CREATE POLICY "Users can manage own expenses" ON public.expenses
  FOR ALL USING (auth.uid() = user_id);

-- Budgets policies
CREATE POLICY "Users can manage budgets in own workspaces" ON public.budgets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workspaces 
      WHERE workspaces.id = budgets.workspace_id 
      AND workspaces.user_id = auth.uid()
    )
  );

-- Budget allocations policies
CREATE POLICY "Users can manage budget allocations for own budgets" ON public.budget_allocations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.budgets 
      JOIN public.workspaces ON workspaces.id = budgets.workspace_id
      WHERE budgets.id = budget_allocations.budget_id 
      AND workspaces.user_id = auth.uid()
    )
  );

-- =========================================
-- FINANCIAL FUNCTIONS
-- =========================================

-- Function to update expense totals across workspace, posts, and user profiles
CREATE OR REPLACE FUNCTION public.update_expense_totals()
RETURNS TRIGGER AS $$
DECLARE
  old_amount DECIMAL(12,2) := 0;
  new_amount DECIMAL(12,2) := 0;
BEGIN
  -- Handle different trigger operations
  IF TG_OP = 'DELETE' THEN
    old_amount := OLD.amount;
    NEW := OLD; -- For DELETE operations
  ELSIF TG_OP = 'UPDATE' THEN
    old_amount := OLD.amount;
    new_amount := NEW.amount;
  ELSIF TG_OP = 'INSERT' THEN
    new_amount := NEW.amount;
  END IF;

  -- Update workspace total expenses
  UPDATE public.workspaces 
  SET total_expenses = (
    SELECT COALESCE(SUM(amount), 0) 
    FROM public.expenses 
    WHERE workspace_id = NEW.workspace_id
  )
  WHERE id = NEW.workspace_id;
  
  -- Update post total expenses if post_id exists
  IF NEW.post_id IS NOT NULL THEN
    UPDATE public.workspace_posts 
    SET expenses_total = (
      SELECT COALESCE(SUM(amount), 0) 
      FROM public.expenses 
      WHERE post_id = NEW.post_id
    )
    WHERE id = NEW.post_id;
  END IF;
  
  -- Update user profile total expenses
  UPDATE public.profiles 
  SET total_expenses = (
    SELECT COALESCE(SUM(amount), 0) 
    FROM public.expenses 
    WHERE user_id = NEW.user_id
  )
  WHERE user_id = NEW.user_id;
  
  -- Update budget spent amounts
  UPDATE public.budgets 
  SET spent_amount = (
    SELECT COALESCE(SUM(allocated_amount), 0)
    FROM public.budget_allocations
    WHERE budget_id = budgets.id
  )
  WHERE workspace_id = NEW.workspace_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to create default expense categories for new users
CREATE OR REPLACE FUNCTION public.create_default_expense_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.expense_categories (user_id, name, description, color_hex, is_system_category) VALUES
  (NEW.user_id, 'Parts & Components', 'Electrical parts, fuses, relays, wires, connectors', '#3B82F6', true),
  (NEW.user_id, 'Tools & Equipment', 'Multimeters, crimpers, diagnostic tools', '#10B981', true),
  (NEW.user_id, 'Labor & Services', 'Professional help and services', '#F59E0B', true),
  (NEW.user_id, 'Garage & Professional Support', 'Garage visits, professional diagnostics', '#EF4444', true),
  (NEW.user_id, 'Documentation & Manuals', 'Technical manuals, wiring diagrams', '#8B5CF6', true),
  (NEW.user_id, 'Shipping & Handling', 'Delivery and shipping costs', '#06B6D4', true),
  (NEW.user_id, 'Miscellaneous', 'Other expenses', '#6B7280', true);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-allocate expenses to budgets
CREATE OR REPLACE FUNCTION public.auto_allocate_expense_to_budget()
RETURNS TRIGGER AS $$
DECLARE
  budget_record RECORD;
  allocation_amount DECIMAL(12,2);
BEGIN
  -- Find active budgets for this workspace/post
  FOR budget_record IN 
    SELECT id, remaining_amount, post_id
    FROM public.budgets 
    WHERE workspace_id = NEW.workspace_id 
    AND (post_id IS NULL OR post_id = NEW.post_id)
    AND remaining_amount > 0
    ORDER BY 
      CASE WHEN post_id = NEW.post_id THEN 1 ELSE 2 END, -- Prefer post-specific budgets
      created_at ASC
  LOOP
    -- Calculate allocation amount (don't exceed budget remaining)
    allocation_amount := LEAST(NEW.amount, budget_record.remaining_amount);
    
    -- Create allocation
    INSERT INTO public.budget_allocations (budget_id, expense_id, allocated_amount)
    VALUES (budget_record.id, NEW.id, allocation_amount)
    ON CONFLICT (budget_id, expense_id) DO NOTHING;
    
    -- Reduce remaining expense amount
    NEW.amount := NEW.amount - allocation_amount;
    
    -- Exit if fully allocated
    EXIT WHEN NEW.amount <= 0;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate budget constraints
CREATE OR REPLACE FUNCTION public.validate_budget_constraints()
RETURNS TRIGGER AS $$
DECLARE
  total_allocated DECIMAL(12,2);
BEGIN
  -- Calculate total allocations for this budget
  SELECT COALESCE(SUM(allocated_amount), 0) 
  INTO total_allocated
  FROM public.budget_allocations 
  WHERE budget_id = NEW.budget_id;
  
  -- Check if allocation would exceed budget
  IF total_allocated > (SELECT total_amount FROM public.budgets WHERE id = NEW.budget_id) THEN
    RAISE EXCEPTION 'Budget allocation would exceed total budget amount';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- CREATE TRIGGERS
-- =========================================

-- Trigger to create default expense categories for new users
CREATE TRIGGER on_profile_created_expense_categories
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_default_expense_categories();

-- Financial tracking triggers
CREATE TRIGGER update_expense_totals_on_insert AFTER INSERT ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_expense_totals();

CREATE TRIGGER update_expense_totals_on_update AFTER UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_expense_totals();

CREATE TRIGGER update_expense_totals_on_delete AFTER DELETE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_expense_totals();

-- Budget allocation triggers
CREATE TRIGGER validate_budget_allocation BEFORE INSERT OR UPDATE ON public.budget_allocations
  FOR EACH ROW EXECUTE FUNCTION public.validate_budget_constraints();

-- Update triggers for timestamps
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- INSERT GLOBAL EXPENSE CATEGORIES
-- =========================================

-- Insert global expense categories (available to all users)
INSERT INTO public.expense_categories (name, description, color_hex, is_system_category) VALUES
('Parts & Components', 'Electrical parts, fuses, relays, wires, connectors', '#3B82F6', true),
('Tools & Equipment', 'Multimeters, crimpers, diagnostic tools', '#10B981', true),
('Labor & Services', 'Professional help and services', '#F59E0B', true),
('Garage & Professional Support', 'Garage visits, professional diagnostics', '#EF4444', true),
('Documentation & Manuals', 'Technical manuals, wiring diagrams', '#8B5CF6', true),
('Shipping & Handling', 'Delivery and shipping costs', '#06B6D4', true),
('Miscellaneous', 'Other expenses', '#6B7280', true);