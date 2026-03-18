import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Building2, 
  Users, 
  Car, 
  DollarSign, 
  FileText, 
  Paperclip, 
  CreditCard, 
  Plug, 
  Shield, 
  Settings2,
  User,
  HardDrive,
  Receipt
} from "lucide-react";
import { BackToHome } from "@/components/shared/BackToHome";

import { PerfilSettings } from "@/components/settings/PerfilSettings";
import { EmpresaSettings } from "@/components/settings/EmpresaSettings";
import { UsuariosSettings } from "@/components/settings/UsuariosSettings";
import { FrotaSettings } from "@/components/settings/FrotaSettings";
import { FinanceiroSettings } from "@/components/settings/FinanceiroSettings";
import { RelatoriosSettings } from "@/components/settings/RelatoriosSettings";
import { AnexosSettings } from "@/components/settings/AnexosSettings";
import { PlanosSettings } from "@/components/settings/PlanosSettings";
import { IntegracoesSettings } from "@/components/settings/IntegracoesSettings";
import { SegurancaSettings } from "@/components/settings/SegurancaSettings";
import { BackupSettings } from "@/components/settings/BackupSettings";
import { FiscalSettings } from "@/components/settings/FiscalSettings";

const settingsSections = [
  { id: "perfil", label: "Meu Perfil", icon: User, description: "Suas informações pessoais" },
  { id: "empresa", label: "Empresa", icon: Building2, description: "Dados e configurações da empresa" },
  { id: "usuarios", label: "Usuários e Permissões", icon: Users, description: "Gerenciar usuários e acessos" },
  { id: "frota", label: "Frota", icon: Car, description: "Configurações de veículos" },
  { id: "financeiro", label: "Financeiro", icon: DollarSign, description: "Valores e cálculos" },
  { id: "fiscal", label: "Dados Fiscais", icon: Receipt, description: "CT-e, ICMS e emitente" },
  { id: "relatorios", label: "Relatórios", icon: FileText, description: "Preferências de relatórios" },
  { id: "anexos", label: "Anexos", icon: Paperclip, description: "Arquivos e documentos" },
  { id: "planos", label: "Planos e Limites", icon: CreditCard, description: "Seu plano atual" },
  { id: "integracoes", label: "Integrações", icon: Plug, description: "APIs e conexões externas" },
  { id: "seguranca", label: "Segurança", icon: Shield, description: "Senha e autenticação" },
  { id: "backup", label: "Backup", icon: HardDrive, description: "Exportar e restaurar dados" },
];

export default function Configuracoes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "empresa";
  const [activeTab, setActiveTab] = useState(initialTab);
  const { profile } = useAuth();

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && settingsSections.some(s => s.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <BackToHome />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações da sua empresa e do sistema
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <Card className="lg:w-72 shrink-0">
            <CardContent className="p-2">
              <ScrollArea className="h-auto lg:h-[calc(100vh-220px)]">
                <nav className="flex flex-col gap-1">
                  {settingsSections.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeTab === section.id;
                    return (
                      <button
                        key={section.id}
                        onClick={() => handleTabChange(section.id)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <div className="min-w-0">
                          <p className={`text-sm font-medium truncate ${isActive ? "" : "text-foreground"}`}>
                            {section.label}
                          </p>
                          <p className={`text-xs truncate ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                            {section.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            {activeTab === "perfil" && <PerfilSettings />}
            {activeTab === "empresa" && <EmpresaSettings />}
            {activeTab === "usuarios" && <UsuariosSettings />}
            {activeTab === "frota" && <FrotaSettings />}
            {activeTab === "financeiro" && <FinanceiroSettings />}
            {activeTab === "fiscal" && <FiscalSettings />}
            {activeTab === "relatorios" && <RelatoriosSettings />}
            {activeTab === "anexos" && <AnexosSettings />}
            {activeTab === "planos" && <PlanosSettings />}
            {activeTab === "integracoes" && <IntegracoesSettings />}
            {activeTab === "seguranca" && <SegurancaSettings />}
            {activeTab === "backup" && <BackupSettings />}
          </div>
        </div>
      </div>
    </Layout>
  );
}
