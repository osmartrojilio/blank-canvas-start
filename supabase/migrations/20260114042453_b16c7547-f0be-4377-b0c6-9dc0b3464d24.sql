-- Enum para roles de usuário
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'driver');

-- Enum para status de assinatura
CREATE TYPE public.subscription_status AS ENUM ('active', 'trialing', 'past_due', 'canceled', 'unpaid');

-- Tabela de planos de assinatura
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_trucks INTEGER,
  max_users INTEGER,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de organizações (tenants)
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  plan_id UUID REFERENCES public.subscription_plans(id),
  subscription_status public.subscription_status DEFAULT 'trialing',
  trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '14 days'),
  subscription_ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de perfis de usuários
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  is_owner BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de roles (separada para segurança)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'driver',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, organization_id)
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Function to check if user has role (security definer para evitar recursão)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's organization
CREATE OR REPLACE FUNCTION public.get_user_organization(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.profiles
  WHERE id = _user_id
$$;

-- RLS Policies

-- Planos: leitura pública (para exibir na landing page)
CREATE POLICY "Plans are publicly readable"
ON public.subscription_plans FOR SELECT
USING (is_active = true);

-- Organizações: usuários veem apenas sua organização
CREATE POLICY "Users can view their organization"
ON public.organizations FOR SELECT
TO authenticated
USING (id = public.get_user_organization(auth.uid()));

CREATE POLICY "Admins can update their organization"
ON public.organizations FOR UPDATE
TO authenticated
USING (id = public.get_user_organization(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- Perfis: usuários veem perfis da mesma organização
CREATE POLICY "Users can view profiles in their organization"
ON public.profiles FOR SELECT
TO authenticated
USING (organization_id = public.get_user_organization(auth.uid()));

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- User roles: usuários veem roles da mesma organização
CREATE POLICY "Users can view roles in their organization"
ON public.user_roles FOR SELECT
TO authenticated
USING (organization_id = public.get_user_organization(auth.uid()));

CREATE POLICY "Admins can manage roles in their organization"
ON public.user_roles FOR ALL
TO authenticated
USING (
  organization_id = public.get_user_organization(auth.uid()) 
  AND public.has_role(auth.uid(), 'admin')
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir planos padrão
INSERT INTO public.subscription_plans (name, slug, description, price_monthly, max_trucks, max_users, features) VALUES
  ('Básico', 'basic', 'Ideal para pequenas frotas', 99.00, 5, 3, '["Dashboard básico", "Controle de abastecimento", "Relatórios simples"]'),
  ('Profissional', 'pro', 'Para frotas em crescimento', 199.00, 20, 10, '["Tudo do Básico", "Gestão de viagens", "Relatórios avançados", "Anexos ilimitados"]'),
  ('Enterprise', 'enterprise', 'Para grandes operações', 499.00, NULL, NULL, '["Tudo do Pro", "Caminhões ilimitados", "Usuários ilimitados", "API access", "Suporte prioritário"]');