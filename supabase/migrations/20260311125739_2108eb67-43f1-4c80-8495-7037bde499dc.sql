
-- Documents table for all document types
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('quotation', 'invoice', 'quality', 'production', 'rnd')),
  external_id TEXT,
  customer TEXT,
  status TEXT,
  total NUMERIC,
  data JSONB NOT NULL DEFAULT '{}',
  markdown TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Allow public read/write (no auth required for this app)
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON public.documents FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public insert" ON public.documents FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.documents FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Audit logs table (optional, used by save-document)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id UUID,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert audit" ON public.audit_logs FOR INSERT TO anon WITH CHECK (true);

-- Index for faster queries
CREATE INDEX idx_documents_type ON public.documents(type);
CREATE INDEX idx_documents_created_at ON public.documents(created_at DESC);
