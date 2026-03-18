import { Link } from "react-router-dom";
import {
  Car,
  Fuel,
  Route,
  Wrench,
  DollarSign,
  BarChart3,
  FileText,
  Users,
  LayoutDashboard,
  CreditCard,
  Settings,
  HelpCircle,
  BookOpen,
  LogIn,
  Building2,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const screens = [
  {
    name: "Login / Cadastro",
    path: "/auth",
    icon: LogIn,
    description: "Tela de autenticação com login por email/senha, Google OAuth e criação de conta com verificação de email.",
    features: ["Login com email", "Google OAuth", "Criação de conta", "Recuperação de senha"],
    category: "Público",
    color: "bg-amber-500/10 text-amber-500",
  },
  {
    name: "Painel (Dashboard)",
    path: "/",
    icon: LayoutDashboard,
    description: "Visão geral da frota com estatísticas, gráficos de combustível, viagens recentes, alertas proativos e rentabilidade.",
    features: ["Estatísticas gerais", "Gráfico de combustível", "Viagens recentes", "Alertas proativos", "Rentabilidade"],
    category: "Principal",
    color: "bg-primary/10 text-primary",
  },
  {
    name: "Veículos",
    path: "/veiculos",
    icon: Car,
    description: "Gestão completa da frota com cadastro de veículos, status, quilometragem, manutenções e documentação.",
    features: ["CRUD de veículos", "Status da frota", "Quilometragem", "Filtros e busca"],
    category: "Operacional",
    color: "bg-blue-500/10 text-blue-500",
  },
  {
    name: "Abastecimentos",
    path: "/abastecimentos",
    icon: Fuel,
    description: "Registro de abastecimentos com controle de litros, preço por litro, posto, km e cálculo de consumo médio.",
    features: ["Registro de abastecimento", "Consumo médio", "Histórico por veículo", "Relatório de gastos"],
    category: "Operacional",
    color: "bg-green-500/10 text-green-500",
  },
  {
    name: "Viagens",
    path: "/viagens",
    icon: Route,
    description: "Controle de viagens com origem/destino, motorista, veículo, valor do frete, carga e geração de CT-e.",
    features: ["CRUD de viagens", "Atribuição de motorista", "Valor do frete", "Preview CT-e"],
    category: "Operacional",
    color: "bg-orange-500/10 text-orange-500",
  },
  {
    name: "Clientes",
    path: "/clientes",
    icon: Building2,
    description: "Cadastro de clientes (PF/PJ) com CPF/CNPJ, endereço completo, contato e integração com busca de CEP.",
    features: ["Cadastro PF/PJ", "Busca por CEP", "Código IBGE", "Inscrição Estadual"],
    category: "Operacional",
    color: "bg-indigo-500/10 text-indigo-500",
  },
  {
    name: "Manutenções",
    path: "/manutencoes",
    icon: Wrench,
    description: "Controle de manutenções preventivas e corretivas com custo de peças, mão de obra e próxima manutenção.",
    features: ["Preventiva/Corretiva", "Custo detalhado", "Próxima manutenção", "Histórico por veículo"],
    category: "Operacional",
    color: "bg-red-500/10 text-red-500",
  },
  {
    name: "Despesas",
    path: "/despesas",
    icon: DollarSign,
    description: "Gestão financeira de despesas com categorias, fornecedores, status de pagamento e vinculação a viagens.",
    features: ["Categorias de despesa", "Status de pagamento", "Fornecedores", "Vínculo com viagem"],
    category: "Financeiro",
    color: "bg-emerald-500/10 text-emerald-500",
  },
  {
    name: "Relatórios",
    path: "/relatorios",
    icon: BarChart3,
    description: "Relatórios avançados com exportação para Excel e PDF, gráficos interativos e análise de rentabilidade.",
    features: ["Exportação Excel/PDF", "Gráficos interativos", "Análise de rentabilidade", "Filtros avançados"],
    category: "Análise",
    color: "bg-violet-500/10 text-violet-500",
    requiresPlan: true,
  },
  {
    name: "Anexos",
    path: "/anexos",
    icon: FileText,
    description: "Gestão de documentos e arquivos anexados a veículos, viagens e despesas com upload e visualização.",
    features: ["Upload de arquivos", "Vinculação a entidades", "Visualização inline", "Storage seguro"],
    category: "Documentos",
    color: "bg-cyan-500/10 text-cyan-500",
    requiresPlan: true,
  },
  {
    name: "Usuários",
    path: "/usuarios",
    icon: Users,
    description: "Gestão de usuários com convites por email, papéis (admin, manager, driver) e controle de acesso.",
    features: ["Convites por email", "Papéis e permissões", "Remoção de usuários", "Motoristas"],
    category: "Administração",
    color: "bg-pink-500/10 text-pink-500",
    requiredRole: "admin",
  },
  {
    name: "Planos",
    path: "/planos",
    icon: CreditCard,
    description: "Visualização e contratação de planos com integração Mercado Pago, cupons de desconto e gestão de assinatura.",
    features: ["Planos e preços", "Pagamento via Mercado Pago", "Cupons de desconto", "Cancelamento"],
    category: "Comercial",
    color: "bg-yellow-500/10 text-yellow-500",
  },
  {
    name: "Configurações",
    path: "/configuracoes",
    icon: Settings,
    description: "Central de configurações com perfil, empresa, frota, fiscal, financeiro, integrações, segurança e backup.",
    features: ["Perfil e empresa", "Dados fiscais", "Integrações (ERP/Contábil)", "Backup e segurança"],
    category: "Sistema",
    color: "bg-slate-500/10 text-slate-500",
  },
  {
    name: "Suporte",
    path: "/suporte",
    icon: HelpCircle,
    description: "Canal de suporte com FAQ, contato via WhatsApp e acesso à documentação do sistema.",
    features: ["FAQ", "Contato WhatsApp", "Documentação"],
    category: "Ajuda",
    color: "bg-teal-500/10 text-teal-500",
  },
  {
    name: "API Docs",
    path: "/api-docs",
    icon: BookOpen,
    description: "Documentação da API REST com endpoints, autenticação via API Key, webhooks e exemplos de uso.",
    features: ["Endpoints REST", "API Keys", "Webhooks", "Exemplos cURL"],
    category: "Desenvolvedor",
    color: "bg-fuchsia-500/10 text-fuchsia-500",
    requiredRole: "admin",
    requiresPlan: true,
  },
];

const categories = [...new Set(screens.map((s) => s.category))];

const Catalogo = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">Catálogo de Telas</h1>
              <p className="text-sm text-muted-foreground">
                Índice visual de todas as {screens.length} telas do sistema
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {categories.map((category) => {
          const categoryScreens = screens.filter((s) => s.category === category);
          return (
            <section key={category} className="mb-10">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                {category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryScreens.map((screen) => (
                  <Link key={screen.path} to={screen.path}>
                    <Card className="h-full hover:border-primary/50 hover:shadow-lg transition-all duration-200 group cursor-pointer">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className={`p-2.5 rounded-lg ${screen.color}`}>
                            <screen.icon className="w-5 h-5" />
                          </div>
                          <div className="flex gap-1.5">
                            {screen.requiredRole && (
                              <Badge variant="outline" className="text-xs">
                                {screen.requiredRole}
                              </Badge>
                            )}
                            {screen.requiresPlan && (
                              <Badge variant="secondary" className="text-xs">
                                Plano pago
                              </Badge>
                            )}
                          </div>
                        </div>
                        <CardTitle className="text-base mt-3 group-hover:text-primary transition-colors flex items-center gap-2">
                          {screen.name}
                          <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </CardTitle>
                        <CardDescription className="text-xs leading-relaxed">
                          {screen.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex flex-wrap gap-1.5">
                          {screen.features.map((feature) => (
                            <span
                              key={feature}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
};

export default Catalogo;
