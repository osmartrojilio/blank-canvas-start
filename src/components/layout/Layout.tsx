import { ReactNode, useState } from "react";
import Sidebar from "./Sidebar";
import GlobalSearch from "./GlobalSearch";
import FloatingAssistant from "@/components/chat/FloatingAssistant";
import { Bell, Menu, LogOut, Settings, User, Check, Trash2, UserPlus, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePlatformAdmin } from "@/contexts/PlatformAdminContext";
import { useNavigate, Link } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAvatarUrl } from "@/hooks/useAvatarUrl";

interface LayoutProps {
  children: ReactNode;
}

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  manager: "Gerente",
  driver: "Motorista",
};

const notificationIcons: Record<string, React.ReactNode> = {
  invitation_accepted: <UserPlus className="w-4 h-4 text-green-500" />,
};

const Layout = ({ children }: LayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { profile, userRole, signOut } = useAuth();
  const { isPlatformAdmin } = usePlatformAdmin();
  const avatarUrl = useAvatarUrl(profile?.avatar_url);
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const getInitials = (name: string | null) => {
    if (!name) return "US";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />
      
      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
        }`}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-4 md:px-8 py-4 pt-safe">
          <div className="flex items-center justify-between gap-4">
            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-secondary transition-colors flex-shrink-0"
            >
              <Menu className="w-5 h-5 text-muted-foreground" />
            </button>

            <div className="flex-1 min-w-0">
              <GlobalSearch />
            </div>

            <div className="flex items-center gap-1 sm:gap-2 md:gap-4 flex-shrink-0">
              {/* Platform Admin Link */}
              {isPlatformAdmin && (
                <Link 
                  to="/platform-admin"
                  className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                  title="Admin Plataforma"
                >
                  <Shield className="w-5 h-5" />
                  <span className="hidden md:inline text-sm font-medium">Admin Plataforma</span>
                </Link>
              )}
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center bg-primary text-primary-foreground text-xs font-bold rounded-full px-1">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <DropdownMenuLabel className="p-0">Notificações</DropdownMenuLabel>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={(e) => {
                          e.preventDefault();
                          markAllAsRead();
                        }}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Marcar todas como lidas
                      </Button>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      Nenhuma notificação no momento
                    </div>
                  ) : (
                    <ScrollArea className="max-h-80">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0 ${
                            !notification.read_at ? "bg-primary/5" : ""
                          }`}
                        >
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            {notificationIcons[notification.type] || <Bell className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{notification.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {!notification.read_at && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  markAsRead(notification.id);
                                }}
                                className="p-1 hover:bg-muted rounded transition-colors"
                                title="Marcar como lida"
                              >
                                <Check className="w-3 h-3 text-muted-foreground" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                deleteNotification(notification.id);
                              }}
                              className="p-1 hover:bg-muted rounded transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-3 h-3 text-muted-foreground" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 sm:gap-3 sm:pl-4 sm:border-l border-border hover:bg-secondary/50 rounded-lg p-2 transition-colors">
                    <Avatar className="w-8 h-8 sm:w-9 sm:h-9">
                      <AvatarImage src={avatarUrl ?? undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary font-semibold text-xs sm:text-sm">
                        {getInitials(profile?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-foreground">
                        {profile?.full_name || "Usuário"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {roleLabels[userRole?.role || ""] || "Membro"}
                      </p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{profile?.full_name || "Usuário"}</p>
                      <p className="text-xs text-muted-foreground">
                        {roleLabels[userRole?.role || ""] || "Membro"}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => navigate("/configuracoes?tab=perfil")}>
                    <User className="mr-2 h-4 w-4" />
                    Meu Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => navigate("/configuracoes?tab=empresa")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Configurações
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>

      <FloatingAssistant />
    </div>
  );
};

export default Layout;
