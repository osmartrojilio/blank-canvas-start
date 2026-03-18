import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
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
  ChevronLeft,
  ChevronRight,
  X,
  CreditCard,
  LogOut,
  BookOpen,
  Building2,
} from "lucide-react";

// Menu de navegação principal
const isSaturday = new Date().getDay() === 6;

const menuItems = [
  { icon: LayoutDashboard, label: "Painel", path: "/", role: null, badge: null as string | null },
  { icon: Car, label: "Veículos", path: "/veiculos", role: null, badge: null as string | null },
  { icon: Fuel, label: "Abastecimentos", path: "/abastecimentos", role: null, badge: null as string | null },
  { icon: Route, label: "Viagens", path: "/viagens", role: null, badge: null as string | null },
  { icon: Building2, label: "Clientes", path: "/clientes", role: null, badge: null as string | null },
  { icon: Wrench, label: "Manutenções", path: "/manutencoes", role: null, badge: null as string | null },
  { icon: DollarSign, label: "Despesas", path: "/despesas", role: null, badge: null as string | null },
  { icon: BarChart3, label: "Relatórios", path: "/relatorios", role: "manager" as const, badge: null as string | null },
  { icon: FileText, label: "Anexos", path: "/anexos", role: null, badge: null as string | null },
  { icon: Users, label: "Usuários", path: "/usuarios", role: "admin" as const, badge: null as string | null },
  { icon: CreditCard, label: "Planos", path: "/planos", role: null, badge: null as string | null, blockedOnSaturday: true },
  { icon: BookOpen, label: "API Docs", path: "/api-docs", role: "admin" as const, badge: null as string | null },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const Sidebar = ({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { organization, userRole, signOut } = useAuth();

  const roleHierarchy = { admin: 3, manager: 2, driver: 1 };
  const userLevel = userRole ? roleHierarchy[userRole.role] : 0;

  const filteredMenuItems = menuItems.filter((item) => {
    if (!item.role) return true;
    const requiredLevel = roleHierarchy[item.role];
    return userLevel >= requiredLevel;
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside className={`
        fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 z-50
        ${collapsed ? "lg:w-16" : "lg:w-64"}
        ${mobileOpen ? "w-64 translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Logo */}
        <div className="p-4 border-b border-sidebar-border pt-safe">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                <Car className="w-6 h-6 text-primary-foreground" />
              </div>
              {(!collapsed || mobileOpen) && (
                <div className="overflow-hidden">
                  <h1 className="font-bold text-foreground text-lg whitespace-nowrap">
                    {organization?.name || "gerenciarfrotas"}
                  </h1>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {organization?.subscription_status === "trialing" ? "Trial Ativo" : "Gestão de Frota"}
                  </p>
                </div>
              )}
            </div>
            {/* Mobile Close Button */}
            <button
              onClick={onMobileClose}
              className="lg:hidden p-1 rounded-lg hover:bg-sidebar-accent transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Toggle Button - Desktop Only */}
        <button
          onClick={onToggle}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-primary rounded-full items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg z-50"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => onMobileClose()}
                className={`sidebar-link ${isActive ? "active" : ""} ${collapsed && !mobileOpen ? "lg:justify-center lg:px-2" : ""}`}
                title={collapsed && !mobileOpen ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {(!collapsed || mobileOpen) && (
                  <span className="font-medium whitespace-nowrap">{item.label}</span>
                )}
                {collapsed && !mobileOpen && <span className="lg:hidden font-medium whitespace-nowrap">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-2 border-t border-sidebar-border space-y-1">
          {/* Sair Button */}
          <button 
            onClick={() => {
              onMobileClose();
              handleSignOut();
            }}
            className={`sidebar-link w-full text-destructive hover:text-destructive hover:bg-destructive/10 ${collapsed && !mobileOpen ? "lg:justify-center lg:px-2" : ""}`}
            title={collapsed && !mobileOpen ? "Sair" : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {(!collapsed || mobileOpen) && <span className="font-medium">Sair</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
