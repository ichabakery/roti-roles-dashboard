
-- Create production_requests table for managing production demands
CREATE TABLE public.production_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id),
  branch_id UUID NOT NULL REFERENCES public.branches(id),
  quantity_requested INTEGER NOT NULL,
  quantity_produced INTEGER DEFAULT 0,
  production_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  requested_by UUID NOT NULL,
  produced_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_quantity_requested CHECK (quantity_requested > 0),
  CONSTRAINT valid_quantity_produced CHECK (quantity_produced >= 0),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'))
);

-- Create production_batches table for tracking actual production
CREATE TABLE public.production_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  production_request_id UUID NOT NULL REFERENCES public.production_requests(id),
  batch_number TEXT NOT NULL,
  quantity_produced INTEGER NOT NULL,
  production_start TIMESTAMP WITH TIME ZONE,
  production_end TIMESTAMP WITH TIME ZONE,
  quality_notes TEXT,
  produced_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_batch_quantity CHECK (quantity_produced > 0)
);

-- Add indexes for better performance
CREATE INDEX idx_production_requests_status ON public.production_requests(status);
CREATE INDEX idx_production_requests_date ON public.production_requests(production_date);
CREATE INDEX idx_production_requests_branch ON public.production_requests(branch_id);
CREATE INDEX idx_production_batches_request ON public.production_batches(production_request_id);

-- Enable RLS
ALTER TABLE public.production_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_batches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for production_requests
CREATE POLICY "Allow all operations for authenticated users" 
  ON public.production_requests 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- RLS Policies for production_batches
CREATE POLICY "Allow all operations for authenticated users" 
  ON public.production_batches 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);
