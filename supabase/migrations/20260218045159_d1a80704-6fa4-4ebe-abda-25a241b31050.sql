
-- Tabela de clientes (remetente/destinatário para CT-e)
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_type TEXT NOT NULL DEFAULT 'both' CHECK (client_type IN ('sender', 'receiver', 'both')),
  name TEXT NOT NULL,
  trade_name TEXT,
  cpf_cnpj TEXT NOT NULL,
  ie TEXT,
  email TEXT,
  phone TEXT,
  
  -- Endereço
  zip_code TEXT,
  street TEXT,
  number TEXT,
  complement TEXT,
  neighborhood TEXT,
  city TEXT,
  city_ibge_code TEXT,
  state TEXT,
  country_code TEXT DEFAULT '1058',
  
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Dados fiscais da organização (emitente do CT-e)
CREATE TABLE public.organization_fiscal_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  ie TEXT,
  im TEXT,
  rntrc TEXT,
  crt INTEGER DEFAULT 1,
  cfop_padrao TEXT DEFAULT '6353',
  cst_icms TEXT DEFAULT '00',
  aliquota_icms NUMERIC DEFAULT 0,
  
  -- Endereço do emitente
  zip_code TEXT,
  street TEXT,
  number TEXT,
  complement TEXT,
  neighborhood TEXT,
  city TEXT,
  city_ibge_code TEXT,
  state TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(organization_id)
);

-- RLS para clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view clients in their organization"
ON public.clients FOR SELECT
USING (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "Admins and managers can insert clients"
ON public.clients FOR INSERT
WITH CHECK (
  organization_id = get_user_organization(auth.uid()) AND
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

CREATE POLICY "Admins and managers can update clients"
ON public.clients FOR UPDATE
USING (
  organization_id = get_user_organization(auth.uid()) AND
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

CREATE POLICY "Admins can delete clients"
ON public.clients FOR DELETE
USING (
  organization_id = get_user_organization(auth.uid()) AND
  has_role(auth.uid(), 'admin')
);

-- RLS para organization_fiscal_data
ALTER TABLE public.organization_fiscal_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org fiscal data"
ON public.organization_fiscal_data FOR SELECT
USING (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "Admins can manage fiscal data"
ON public.organization_fiscal_data FOR ALL
USING (
  organization_id = get_user_organization(auth.uid()) AND
  has_role(auth.uid(), 'admin')
)
WITH CHECK (
  organization_id = get_user_organization(auth.uid()) AND
  has_role(auth.uid(), 'admin')
);

-- Trigger para updated_at
CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_org_fiscal_data_updated_at
BEFORE UPDATE ON public.organization_fiscal_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
