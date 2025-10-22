-- 004_marketplace_foundation.sql - Core marketplace infrastructure
-- Suppliers, parts catalog, part recommendations, basic marketplace structure

-- =========================================
-- MARKETPLACE CORE INFRASTRUCTURE
-- =========================================

-- Supplier/vendor management (open marketplace)
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic supplier info
  name TEXT NOT NULL,
  description TEXT,
  website_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  
  -- Address information
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state_province TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'US',
  
  -- Business details
  business_registration_number TEXT,
  tax_id TEXT,
  
  -- Quality metrics
  rating DECIMAL(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
  total_reviews INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  
  -- Performance metrics
  average_delivery_time_days INTEGER,
  on_time_delivery_percentage DECIMAL(5,2),
  return_rate_percentage DECIMAL(5,2),
  
  -- Commission and payment
  commission_rate DECIMAL(5,4) DEFAULT 0.0500, -- 5% default
  payment_terms_days INTEGER DEFAULT 30,
  
  -- Status
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  registration_date DATE DEFAULT CURRENT_DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comprehensive parts catalog
CREATE TABLE public.parts_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  
  -- Basic part information
  part_number TEXT NOT NULL,
  part_name TEXT NOT NULL,
  description TEXT,
  
  -- Categorization
  category TEXT NOT NULL,
  subcategory TEXT,
  brand TEXT,
  manufacturer_part_number TEXT,
  
  -- Vehicle compatibility
  compatible_makes TEXT[],
  compatible_models TEXT[],
  compatible_years INTEGER[],
  universal_fitment BOOLEAN DEFAULT false,
  
  -- Technical specifications
  specifications JSONB DEFAULT '{}'::jsonb,
  dimensions JSONB,
  weight_kg DECIMAL(8,3),
  
  -- Electrical specifications (for electrical components)
  voltage INTEGER,
  current_rating_amps DECIMAL(8,2),
  power_rating_watts DECIMAL(8,2),
  wire_gauge TEXT,
  connector_type TEXT,
  
  -- Pricing
  base_price DECIMAL(12,2) NOT NULL,
  sale_price DECIMAL(12,2),
  currency TEXT DEFAULT 'USD',
  
  -- Inventory
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  availability_status TEXT DEFAULT 'in_stock' CHECK (availability_status IN ('in_stock', 'low_stock', 'out_of_stock', 'discontinued')),
  
  -- Quality and warranty
  warranty_months INTEGER DEFAULT 12,
  quality_grade TEXT CHECK (quality_grade IN ('oem', 'aftermarket_premium', 'aftermarket_standard', 'economy')),
  
  -- Marketplace metrics
  view_count INTEGER DEFAULT 0,
  purchase_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00,
  review_count INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_supplier_part UNIQUE (supplier_id, part_number)
);

-- AI-generated part recommendations
CREATE TABLE public.part_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  part_id UUID REFERENCES public.parts_catalog(id) ON DELETE SET NULL,
  
  -- Recommendation source
  source_type TEXT NOT NULL CHECK (source_type IN ('chat_analysis', 'image_analysis', 'fault_detection', 'neo4j_analysis', 'user_search')),
  source_reference_id UUID, -- References chat message, media file, etc.
  
  -- Recommendation details
  reason TEXT,
  confidence_score DECIMAL(3,2),
  urgency_level TEXT DEFAULT 'medium' CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')),
  
  -- Part details (in case part is removed from catalog)
  part_name TEXT,
  part_number TEXT,
  estimated_price DECIMAL(12,2),
  supplier_name TEXT,
  
  -- User interaction
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'added_to_cart', 'purchased', 'dismissed')),
  user_feedback TEXT CHECK (user_feedback IN ('helpful', 'not_helpful', 'wrong_part')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Part reviews and ratings
CREATE TABLE public.part_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id UUID NOT NULL REFERENCES public.parts_catalog(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  
  -- Review content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  review_text TEXT,
  
  -- Review context
  verified_purchase BOOLEAN DEFAULT false,
  installation_difficulty TEXT CHECK (installation_difficulty IN ('easy', 'moderate', 'difficult', 'professional_required')),
  fitment_accuracy TEXT CHECK (fitment_accuracy IN ('perfect', 'good', 'poor', 'does_not_fit')),
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  
  -- Review metadata
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_part_review UNIQUE (user_id, part_id)
);

-- Part compatibility matrix for vehicle-specific recommendations
CREATE TABLE public.part_compatibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id UUID NOT NULL REFERENCES public.parts_catalog(id) ON DELETE CASCADE,
  
  -- Vehicle compatibility
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year_start INTEGER NOT NULL,
  year_end INTEGER NOT NULL,
  
  -- Specific compatibility details
  engine_types TEXT[],
  trim_levels TEXT[],
  market_regions TEXT[],
  
  -- Compatibility notes
  notes TEXT,
  compatibility_confidence DECIMAL(3,2) DEFAULT 1.00,
  
  -- Source of compatibility data
  data_source TEXT CHECK (data_source IN ('manufacturer', 'community_verified', 'ai_inferred', 'user_submitted')),
  verified_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_part_vehicle_compatibility UNIQUE (part_id, make, model, year_start, year_end)
);

-- =========================================
-- CREATE INDEXES FOR PERFORMANCE
-- =========================================

-- Supplier indexes
CREATE INDEX idx_suppliers_name ON public.suppliers(name);
CREATE INDEX idx_suppliers_is_verified ON public.suppliers(is_verified);
CREATE INDEX idx_suppliers_is_active ON public.suppliers(is_active);
CREATE INDEX idx_suppliers_rating ON public.suppliers(rating);
CREATE INDEX idx_suppliers_country ON public.suppliers(country);

-- Parts catalog indexes
CREATE INDEX idx_parts_catalog_supplier_id ON public.parts_catalog(supplier_id);
CREATE INDEX idx_parts_catalog_part_number ON public.parts_catalog(part_number);
CREATE INDEX idx_parts_catalog_category ON public.parts_catalog(category);
CREATE INDEX idx_parts_catalog_subcategory ON public.parts_catalog(subcategory);
CREATE INDEX idx_parts_catalog_brand ON public.parts_catalog(brand);
CREATE INDEX idx_parts_catalog_compatible_makes ON public.parts_catalog USING GIN(compatible_makes);
CREATE INDEX idx_parts_catalog_compatible_models ON public.parts_catalog USING GIN(compatible_models);
CREATE INDEX idx_parts_catalog_compatible_years ON public.parts_catalog USING GIN(compatible_years);
CREATE INDEX idx_parts_catalog_is_active ON public.parts_catalog(is_active);
CREATE INDEX idx_parts_catalog_availability_status ON public.parts_catalog(availability_status);
CREATE INDEX idx_parts_catalog_base_price ON public.parts_catalog(base_price);
CREATE INDEX idx_parts_catalog_rating ON public.parts_catalog(rating);
CREATE INDEX idx_parts_catalog_quality_grade ON public.parts_catalog(quality_grade);

-- Part recommendations indexes
CREATE INDEX idx_part_recommendations_workspace_id ON public.part_recommendations(workspace_id);
CREATE INDEX idx_part_recommendations_user_id ON public.part_recommendations(user_id);
CREATE INDEX idx_part_recommendations_part_id ON public.part_recommendations(part_id);
CREATE INDEX idx_part_recommendations_source_type ON public.part_recommendations(source_type);
CREATE INDEX idx_part_recommendations_status ON public.part_recommendations(status);
CREATE INDEX idx_part_recommendations_urgency ON public.part_recommendations(urgency_level);
CREATE INDEX idx_part_recommendations_confidence ON public.part_recommendations(confidence_score);

-- Part reviews indexes
CREATE INDEX idx_part_reviews_part_id ON public.part_reviews(part_id);
CREATE INDEX idx_part_reviews_user_id ON public.part_reviews(user_id);
CREATE INDEX idx_part_reviews_rating ON public.part_reviews(rating);
CREATE INDEX idx_part_reviews_verified_purchase ON public.part_reviews(verified_purchase);
CREATE INDEX idx_part_reviews_created_at ON public.part_reviews(created_at);

-- Part compatibility indexes
CREATE INDEX idx_part_compatibility_part_id ON public.part_compatibility(part_id);
CREATE INDEX idx_part_compatibility_make ON public.part_compatibility(make);
CREATE INDEX idx_part_compatibility_model ON public.part_compatibility(model);
CREATE INDEX idx_part_compatibility_year_range ON public.part_compatibility(year_start, year_end);
CREATE INDEX idx_part_compatibility_data_source ON public.part_compatibility(data_source);

-- Text search indexes for marketplace
CREATE INDEX idx_parts_catalog_search ON public.parts_catalog USING GIN(to_tsvector('english', part_name || ' ' || description || ' ' || COALESCE(brand, '')));
CREATE INDEX idx_suppliers_search ON public.suppliers USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- =========================================
-- ENABLE ROW LEVEL SECURITY
-- =========================================

-- Public tables (no RLS - open marketplace)
-- suppliers, parts_catalog, part_reviews, part_compatibility

-- User-specific tables (RLS enabled)
ALTER TABLE public.part_recommendations ENABLE ROW LEVEL SECURITY;

-- =========================================
-- ROW LEVEL SECURITY POLICIES
-- =========================================

-- Part recommendations policies (user-specific)
CREATE POLICY "Users can manage own part recommendations" ON public.part_recommendations
  FOR ALL USING (auth.uid() = user_id);

-- =========================================
-- MARKETPLACE FUNCTIONS
-- =========================================

-- Function to update part ratings based on reviews
CREATE OR REPLACE FUNCTION public.update_part_ratings()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating DECIMAL(3,2);
  review_count INTEGER;
BEGIN
  -- Calculate new average rating and review count
  SELECT 
    ROUND(AVG(rating)::numeric, 2),
    COUNT(*)
  INTO avg_rating, review_count
  FROM public.part_reviews 
  WHERE part_id = COALESCE(NEW.part_id, OLD.part_id);
  
  -- Update the parts catalog
  UPDATE public.parts_catalog 
  SET 
    rating = COALESCE(avg_rating, 0.00),
    review_count = review_count
  WHERE id = COALESCE(NEW.part_id, OLD.part_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update supplier ratings based on part performance
CREATE OR REPLACE FUNCTION public.update_supplier_ratings()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating DECIMAL(3,2);
  total_reviews INTEGER;
BEGIN
  -- Calculate supplier average rating from all their parts
  SELECT 
    ROUND(AVG(pc.rating)::numeric, 2),
    SUM(pc.review_count)
  INTO avg_rating, total_reviews
  FROM public.parts_catalog pc
  WHERE pc.supplier_id = (
    SELECT supplier_id FROM public.parts_catalog 
    WHERE id = COALESCE(NEW.part_id, OLD.part_id)
  );
  
  -- Update supplier rating
  UPDATE public.suppliers 
  SET 
    rating = COALESCE(avg_rating, 0.00),
    total_reviews = COALESCE(total_reviews, 0)
  WHERE id = (
    SELECT supplier_id FROM public.parts_catalog 
    WHERE id = COALESCE(NEW.part_id, OLD.part_id)
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to increment part view count
CREATE OR REPLACE FUNCTION public.increment_part_view_count(part_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.parts_catalog 
  SET view_count = view_count + 1,
      last_updated_at = NOW()
  WHERE id = part_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find compatible parts for a vehicle
CREATE OR REPLACE FUNCTION public.find_compatible_parts(
  p_make TEXT,
  p_model TEXT,
  p_year INTEGER,
  p_category TEXT DEFAULT NULL
)
RETURNS TABLE (
  part_id UUID,
  part_name TEXT,
  part_number TEXT,
  supplier_name TEXT,
  base_price DECIMAL(12,2),
  rating DECIMAL(3,2),
  compatibility_confidence DECIMAL(3,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pc.id as part_id,
    pc.part_name,
    pc.part_number,
    s.name as supplier_name,
    pc.base_price,
    pc.rating,
    pcompat.compatibility_confidence
  FROM public.parts_catalog pc
  JOIN public.suppliers s ON s.id = pc.supplier_id
  LEFT JOIN public.part_compatibility pcompat ON pcompat.part_id = pc.id
  WHERE pc.is_active = true
  AND s.is_active = true
  AND (p_category IS NULL OR pc.category = p_category)
  AND (
    -- Direct compatibility table match
    (pcompat.make = p_make AND pcompat.model = p_model 
     AND p_year BETWEEN pcompat.year_start AND pcompat.year_end)
    OR
    -- Universal fitment
    pc.universal_fitment = true
    OR
    -- Array-based compatibility
    (p_make = ANY(pc.compatible_makes) AND p_model = ANY(pc.compatible_models) 
     AND p_year = ANY(pc.compatible_years))
  )
  ORDER BY 
    pcompat.compatibility_confidence DESC NULLS LAST,
    pc.rating DESC,
    pc.base_price ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================
-- CREATE TRIGGERS
-- =========================================

-- Update part ratings when reviews change
CREATE TRIGGER update_part_ratings_on_review_insert AFTER INSERT ON public.part_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_part_ratings();

CREATE TRIGGER update_part_ratings_on_review_update AFTER UPDATE ON public.part_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_part_ratings();

CREATE TRIGGER update_part_ratings_on_review_delete AFTER DELETE ON public.part_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_part_ratings();

-- Update supplier ratings when part ratings change
CREATE TRIGGER update_supplier_ratings_on_part_rating_change AFTER UPDATE OF rating ON public.parts_catalog
  FOR EACH ROW EXECUTE FUNCTION public.update_supplier_ratings();

-- Update timestamps
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_part_recommendations_updated_at BEFORE UPDATE ON public.part_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_part_reviews_updated_at BEFORE UPDATE ON public.part_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();