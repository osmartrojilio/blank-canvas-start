import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/formatters";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePlatformAdmin } from "@/contexts/PlatformAdminContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { 
  Building2, Users, Clock, TrendingUp, Shield, 
  CheckCircle2, XCircle, RefreshCw, Eye, Pencil, Trash2, Ticket
} from "lucide-react";
import { CouponManagement } from "@/components/admin/CouponManagement";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  subscription_status: string;
  is_active: boolean;
  created_at: string;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  plan_name: string | null;
  price_monthly: number | null;
  user_count: number;
  admin_count: number;
}

interface PlatformUser {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  organization_id: string | null;
  organization_name: string | null;
  role: string;
  is_owner: boolean;
  created_at: string;
}

const subscriptionStatusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  trialing: { label: "Teste", variant: "secondary" },
  active: { label: "Ativo", variant: "default" },
  past_due: { label: "Atrasado", variant: "destructive" },
  canceled: { label: "Cancelado", variant: "outline" },
  unpaid: { label: "Não pago", variant: "destructive" },
};

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  manager: "Gerente",
  driver: "Motorista",
  none: "Sem função",
};

const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('pt-BR') : "—";

export default function PlatformAdmin() {
  const navigate = useNavigate();
  const { isPlatformAdmin, loading: adminLoading } = usePlatformAdmin();
  const { user, loading: authLoading } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Dialogs state
  const [viewOrg, setViewOrg] = useState<Organization | null>(null);
  const [editOrg, setEditOrg] = useState<Organization | null>(null);
  const [deleteOrg, setDeleteOrg] = useState<Organization | null>(null);
  const [editOrgName, setEditOrgName] = useState("");
  const [editOrgStatus, setEditOrgStatus] = useState("");
  const [editOrgActive, setEditOrgActive] = useState(true);

  const [viewUser, setViewUser] = useState<PlatformUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<PlatformUser | null>(null);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [{ data: orgsData, error: orgsError }, { data: usersData, error: usersError }] = await Promise.all([
        supabase.rpc('get_all_organizations_for_admin'),
        supabase.rpc('get_all_users_for_admin'),
      ]);

      if (orgsError) {
        console.error("Error loading organizations:", orgsError);
        toast({ title: "Erro", description: "Não foi possível carregar as organizações.", variant: "destructive" });
      } else {
        setOrganizations(orgsData || []);
      }

      if (usersError) {
        console.error("Error loading users:", usersError);
        toast({ title: "Erro", description: "Não foi possível carregar os usuários.", variant: "destructive" });
      } else {
        setUsers(usersData || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoadingData(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isPlatformAdmin && !adminLoading) {
      loadData();
    }
  }, [isPlatformAdmin, adminLoading]);

  // --- Organization actions ---
  const openEditOrg = (org: Organization) => {
    setEditOrg(org);
    setEditOrgName(org.name);
    setEditOrgStatus(org.subscription_status);
    setEditOrgActive(org.is_active);
  };

  const handleUpdateOrg = async () => {
    if (!editOrg) return;
    try {
      const { error } = await supabase.rpc('admin_update_organization', {
        _org_id: editOrg.id,
        _name: editOrgName,
        _subscription_status: editOrgStatus as any,
        _is_active: editOrgActive,
      });
      if (error) throw error;
      setOrganizations(prev => prev.map(o => o.id === editOrg.id ? { ...o, name: editOrgName, subscription_status: editOrgStatus, is_active: editOrgActive } : o));
      setEditOrg(null);
      toast({ title: "Organização atualizada", description: "Os dados foram atualizados com sucesso." });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Não foi possível atualizar.", variant: "destructive" });
    }
  };

  const handleDeleteOrg = async () => {
    if (!deleteOrg) return;
    try {
      const { data, error } = await supabase.rpc('admin_delete_organization', { _org_id: deleteOrg.id });
      if (error) throw error;
      setOrganizations(prev => prev.filter(o => o.id !== deleteOrg.id));
      setUsers(prev => prev.filter(u => u.organization_id !== deleteOrg.id));
      setDeleteOrg(null);
      toast({ title: "Organização excluída", description: "A organização e todos os dados foram removidos." });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Não foi possível excluir.", variant: "destructive" });
    }
  };

  // --- User actions ---
  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    try {
      const { data, error } = await supabase.rpc('admin_remove_user', { _user_id: deleteUser.id });
      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error || "Falha ao remover");
      setUsers(prev => prev.map(u => u.id === deleteUser.id ? { ...u, organization_id: null, organization_name: null, role: 'none', is_owner: false } : u));
      setDeleteUser(null);
      toast({ title: "Usuário removido", description: "O usuário foi desvinculado da organização." });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Não foi possível remover.", variant: "destructive" });
    }
  };

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Shield className="h-12 w-12 animate-pulse text-primary mx-auto" />
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!isPlatformAdmin) {
    return <Navigate to="/" replace />;
  }

  const totalUsers = users.length;
  const activeOrgs = organizations.filter(o => o.is_active).length;
  const trialingOrgs = organizations.filter(o => o.subscription_status === "trialing").length;
  const monthlyRevenue = organizations
    .filter(o => o.subscription_status === "active" && o.price_monthly)
    .reduce((sum, o) => sum + (o.price_monthly || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Administração da Plataforma</h1>
                <p className="text-sm text-muted-foreground">Controle global do sistema</p>
              </div>
            </div>
            <Button variant="outline" onClick={loadData} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Organizações</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{organizations.length}</div>
              <p className="text-xs text-muted-foreground">{activeOrgs} ativas, {organizations.length - activeOrgs} inativas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">Em {organizations.length} organizações</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Período de Teste</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{trialingOrgs}</div>
              <p className="text-xs text-muted-foreground">Organizações em trial</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(monthlyRevenue)}</div>
              <p className="text-xs text-muted-foreground">De assinaturas ativas</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="organizations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="organizations" className="gap-2"><Building2 className="h-4 w-4" />Organizações</TabsTrigger>
            <TabsTrigger value="users" className="gap-2"><Users className="h-4 w-4" />Usuários</TabsTrigger>
            <TabsTrigger value="coupons" className="gap-2"><Ticket className="h-4 w-4" />Cupons</TabsTrigger>
          </TabsList>

          {/* Organizations Tab */}
          <TabsContent value="organizations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Todas as Organizações</CardTitle>
                <CardDescription>Gerencie todas as empresas cadastradas na plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
                ) : (
                  <div className="overflow-auto max-h-[500px]">
                    <Table className="min-w-[1000px]">
                      <TableHeader className="sticky top-0 bg-card z-10">
                        <TableRow>
                          <TableHead>Organização</TableHead>
                          <TableHead>Plano</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Usuários</TableHead>
                          <TableHead>Criado em</TableHead>
                          <TableHead>Ativo</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {organizations.map((org) => (
                          <TableRow key={org.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                  <div className="font-medium">{org.name}</div>
                                  <div className="text-xs text-muted-foreground">{org.slug}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{org.plan_name || "Sem plano"}</span>
                                {org.price_monthly != null && <span className="text-xs text-muted-foreground">{formatCurrency(org.price_monthly)}/mês</span>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={subscriptionStatusLabels[org.subscription_status]?.variant || "secondary"}>
                                {subscriptionStatusLabels[org.subscription_status]?.label || org.subscription_status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1"><Users className="h-3 w-3 text-muted-foreground" /><span>{org.user_count}</span></div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{formatDate(org.created_at)}</TableCell>
                            <TableCell>
                              <Switch checked={org.is_active} onCheckedChange={() => {
                                setOrganizations(prev => prev.map(o => o.id === org.id ? { ...o, is_active: !o.is_active } : o));
                                supabase.rpc('toggle_organization_status', { _org_id: org.id, _is_active: !org.is_active });
                              }} />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => setViewOrg(org)} title="Visualizar">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => openEditOrg(org)} title="Editar">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setDeleteOrg(org)} title="Excluir" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {organizations.length === 0 && (
                          <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma organização encontrada</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Todos os Usuários</CardTitle>
                <CardDescription>Visualize e gerencie todos os usuários cadastrados na plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
                ) : (
                  <div className="overflow-auto max-h-[500px]">
                    <Table className="min-w-[900px]">
                      <TableHeader className="sticky top-0 bg-card z-10">
                        <TableRow>
                          <TableHead>Usuário</TableHead>
                          <TableHead>Organização</TableHead>
                          <TableHead>Função</TableHead>
                          <TableHead>Proprietário</TableHead>
                          <TableHead>Cadastro</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{u.full_name || "Sem nome"}</div>
                                <div className="text-xs text-muted-foreground">{u.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>{u.organization_name || <span className="text-muted-foreground">Sem organização</span>}</TableCell>
                            <TableCell><Badge variant="outline">{roleLabels[u.role] || u.role}</Badge></TableCell>
                            <TableCell>
                              {u.is_owner ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{formatDate(u.created_at)}</TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => setViewUser(u)} title="Visualizar">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {u.organization_id && u.id !== user?.id && (
                                  <Button variant="ghost" size="icon" onClick={() => setDeleteUser(u)} title="Remover da organização" className="text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {users.length === 0 && (
                          <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum usuário encontrado</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Coupons Tab */}
          <TabsContent value="coupons" className="space-y-4">
            <CouponManagement />
          </TabsContent>
        </Tabs>
      </main>

      {/* View Organization Dialog */}
      <Dialog open={!!viewOrg} onOpenChange={() => setViewOrg(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes da Organização</DialogTitle>
          </DialogHeader>
          {viewOrg && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Nome</span><span className="font-medium">{viewOrg.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Slug</span><span>{viewOrg.slug}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Plano</span><span>{viewOrg.plan_name || "Sem plano"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Preço Mensal</span><span>{formatCurrency(viewOrg.price_monthly)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status Assinatura</span>
                <Badge variant={subscriptionStatusLabels[viewOrg.subscription_status]?.variant || "secondary"}>
                  {subscriptionStatusLabels[viewOrg.subscription_status]?.label || viewOrg.subscription_status}
                </Badge>
              </div>
              <div className="flex justify-between"><span className="text-muted-foreground">Ativo</span><span>{viewOrg.is_active ? "Sim" : "Não"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Usuários</span><span>{viewOrg.user_count}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Admins</span><span>{viewOrg.admin_count}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Criado em</span><span>{formatDate(viewOrg.created_at)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Trial até</span><span>{formatDate(viewOrg.trial_ends_at)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Assinatura até</span><span>{formatDate(viewOrg.subscription_ends_at)}</span></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Organization Dialog */}
      <Dialog open={!!editOrg} onOpenChange={() => setEditOrg(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Organização</DialogTitle>
            <DialogDescription>Atualize os dados da organização</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={editOrgName} onChange={e => setEditOrgName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Status da Assinatura</Label>
              <Select value={editOrgStatus} onValueChange={setEditOrgStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="trialing">Teste</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="past_due">Atrasado</SelectItem>
                  <SelectItem value="canceled">Cancelado</SelectItem>
                  <SelectItem value="unpaid">Não pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Ativo</Label>
              <Switch checked={editOrgActive} onCheckedChange={setEditOrgActive} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOrg(null)}>Cancelar</Button>
            <Button onClick={handleUpdateOrg}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Organization Dialog */}
      <AlertDialog open={!!deleteOrg} onOpenChange={() => setDeleteOrg(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Organização</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteOrg?.name}</strong>? Esta ação é irreversível e removerá todos os dados da organização (veículos, viagens, despesas, usuários vinculados, etc).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOrg} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View User Dialog */}
      <Dialog open={!!viewUser} onOpenChange={() => setViewUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
          </DialogHeader>
          {viewUser && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Nome</span><span className="font-medium">{viewUser.full_name || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">E-mail</span><span>{viewUser.email}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Telefone</span><span>{viewUser.phone || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Organização</span><span>{viewUser.organization_name || "Sem organização"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Função</span><Badge variant="outline">{roleLabels[viewUser.role] || viewUser.role}</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Proprietário</span><span>{viewUser.is_owner ? "Sim" : "Não"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Cadastro</span><span>{formatDate(viewUser.created_at)}</span></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <AlertDialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{deleteUser?.full_name || deleteUser?.email}</strong> da organização <strong>{deleteUser?.organization_name}</strong>? O usuário será desvinculado mas sua conta continuará existindo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
