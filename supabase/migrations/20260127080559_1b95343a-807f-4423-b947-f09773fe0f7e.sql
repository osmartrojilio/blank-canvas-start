-- Add UNIQUE constraint to CNPJ column
ALTER TABLE public.organizations 
ADD CONSTRAINT organizations_cnpj_key UNIQUE (cnpj);

-- Create index for faster CNPJ lookups
CREATE INDEX IF NOT EXISTS idx_organizations_cnpj ON public.organizations(cnpj) WHERE cnpj IS NOT NULL;