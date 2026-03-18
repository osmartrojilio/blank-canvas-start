import { useState, useMemo } from "react";
import { Plus, User, Shield, Edit, Trash2, Check, X, Save, Search, Loader2, Mail, Clock, ChevronLeft, ChevronRight, Copy, Link, Eye } from "lucide-react";
import { BackToHome } from "@/components/shared/BackToHome";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import UpgradeBanner from "@/components/plan/UpgradeBanner";
import Layout from "@/components/layout/Layout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useUsers, OrganizationUser, AppRole } from "@/hooks/useUsers";
import { useVehicles } from "@/hooks/useVehicles";
import { toast } from "@/hooks/use-toast";

const roleLabels: Record<AppRole, { label: string; class: string; icon: typeof Shield }> = {
  admin: { label: "Administrador", class: "badge-status bg-primary/20 text-primary", icon: Shield },
  manager: { label: "Gerente", class: "badge-success", icon: User },
  driver: { label: "Motorista", class: "badge-warning", icon: User },
};

const roleFilterOptions = [
  { value: "all", label: "Todos os cargos" },
  { value: "admin", label: "Administrador" },
  { value: "manager", label: "Gerente" },
  { value: "driver", label: "Motorista" },
];

const roleFormOptions: { value: AppRole; label: string }[] = [
  { value: "driver", label: "Motorista" },
  { value: "manager", label: "Gerente" },
  { value: "admin", label: "Administrador" },
];

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50];

const Usuarios = () => {
  const { users, pendingInvitations, loading, stats, inviteUser, updateUserRole, removeUser, cancelInvitation } = useUsers();
  const { vehicles } = useVehicles();
  const { maxUsers, isFreePlan } = usePlanLimits();
  const userLimitReached = maxUsers !== null && users.length >= maxUsers;
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<OrganizationUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<OrganizationUser | null>(null);
  const [selectedInvitation, setSelectedInvitation] = useState<any | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // New user form
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("driver");
  
  // Edit form state
  const [editRole, setEditRole] = useState<AppRole>("driver");

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = searchValue === "" || 
        (user.full_name?.toLowerCase().includes(searchValue.toLowerCase())) ||
        (user.email?.toLowerCase().includes(searchValue.toLowerCase()));
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchValue, roleFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to first page when filters change
  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    setCurrentPage(1);
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const handleView = (user: OrganizationUser) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (user: OrganizationUser) => {
    setSelectedUser(user);
    setEditRole(user.role);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (user: OrganizationUser) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    setSaving(true);
    const success = await removeUser(userToDelete.id);
    setSaving(false);
    if (success) {
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setSaving(true);
    const success = await updateUserRole(selectedUser.id, editRole);
    setSaving(false);

    if (success) {
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const handleCancelInvitation = (invitation: any) => {
    setSelectedInvitation(invitation);
    setIsCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedInvitation) return;

    setSaving(true);
    await cancelInvitation(selectedInvitation.id);
    setSaving(false);
    setIsCancelDialogOpen(false);
    setSelectedInvitation(null);
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setSaving(true);
    const link = await inviteUser({ email: newEmail, role: newRole });
    setSaving(false);

    if (link) {
      setNewEmail("");
      setNewRole("driver");
      setIsDialogOpen(false);
      setInviteLink(link);
      setIsLinkDialogOpen(true);
      
      // Auto-copy to clipboard
      try {
        await navigator.clipboard.writeText(link);
        toast({
          title: "Link copiado!",
          description: "O link de convite foi copiado automaticamente para a área de transferência.",
        });
      } catch {
        // Clipboard may fail in some contexts, user can still copy manually
      }
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: "Link copiado!",
      description: "O link de convite foi copiado para a área de transferência.",
    });
  };

  const getInitials = (name: string | null) => {
    if (!name) return "??";
    return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="animate-fade-in">
        <BackToHome />
        <div className="flex items-center justify-between mb-8">
          <div className="page-header mb-0">
            <h1 className="page-title">Usuários</h1>
            <p className="page-subtitle">Gerenciamento de acessos e permissões</p>
          </div>

          {userLimitReached ? (
            <UpgradeBanner message={`O plano gratuito permite apenas ${maxUsers} usuário. Faça upgrade para convidar mais.`} compact />
          ) : (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button className="btn-primary">
                <Plus className="w-5 h-5" />
                Convidar Usuário
              </button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-foreground">Convidar Usuário</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleInviteSubmit} className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">E-mail</label>
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
                    className="input-field"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Cargo</label>
                  <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                    <SelectTrigger className="input-field">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleFormOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm text-muted-foreground">
                  O convite será registrado e você receberá um link para compartilhar com o usuário.
                </p>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsDialogOpen(false)} className="btn-secondary flex-1">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary flex-1" disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link className="w-4 h-4" />}
                    Criar Convite
                  </button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="stat-card">
            <p className="text-sm text-muted-foreground mb-1">Total de Usuários</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground mb-1">Administradores</p>
            <p className="text-2xl font-bold text-foreground">{stats.admins}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground mb-1">Motoristas</p>
            <p className="text-2xl font-bold text-foreground">{stats.drivers}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground mb-1">Convites Pendentes</p>
            <p className="text-2xl font-bold text-warning">{stats.pending}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="stat-card mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
              <SelectTrigger className="input-field w-44">
                <SelectValue placeholder="Todos os cargos" />
              </SelectTrigger>
              <SelectContent>
                {roleFilterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Pending Invitations */}
        {pendingInvitations.length > 0 && (
          <div className="stat-card mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-warning" />
              Convites Pendentes
            </h3>
            <div className="space-y-3">
              {pendingInvitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{invitation.email}</p>
                      <p className="text-sm text-muted-foreground">
                        {roleLabels[invitation.role as AppRole]?.label || invitation.role} • 
                        Expira em {new Date(invitation.expires_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCancelInvitation(invitation)}
                    className="p-2 rounded-lg hover:bg-destructive/20 transition-colors"
                    title="Cancelar convite"
                  >
                    <X className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="stat-card overflow-hidden p-0">
          <div className="overflow-auto max-h-[calc(100vh-480px)] min-h-[300px]">
            <table className="data-table min-w-[900px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-secondary/30">
                  <th className="bg-secondary/80 backdrop-blur-sm">Usuário</th>
                  <th className="bg-secondary/80 backdrop-blur-sm">Cargo</th>
                  <th className="bg-secondary/80 backdrop-blur-sm">Veículo Vinculado</th>
                  <th className="bg-secondary/80 backdrop-blur-sm">Membro desde</th>
                  <th className="bg-secondary/80 backdrop-blur-sm text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                      {users.length === 0 ? "Nenhum usuário encontrado" : "Nenhum resultado para os filtros aplicados"}
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => {
                    const roleConfig = roleLabels[user.role];
                    
                    return (
                      <tr key={user.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                              <span className="text-primary font-semibold text-sm">
                                {getInitials(user.full_name)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {user.full_name || "Sem nome"}
                                {user.is_owner && (
                                  <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                                    Proprietário
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-muted-foreground">{user.phone || "Sem telefone"}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge-status ${roleConfig.class}`}>
                            {roleConfig.label}
                          </span>
                        </td>
                        <td className="text-muted-foreground">
                          {user.vehicle_prefix || "—"}
                        </td>
                        <td className="text-muted-foreground text-sm">
                          {new Date(user.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-1">
                            <button 
                              className="p-2 rounded-lg hover:bg-secondary transition-colors"
                              onClick={() => handleView(user)}
                              title="Visualizar"
                            >
                              <Eye className="w-4 h-4 text-muted-foreground" />
                            </button>
                            {!user.is_owner && (
                              <>
                                <button 
                                  className="p-2 rounded-lg hover:bg-secondary transition-colors"
                                  onClick={() => handleEdit(user)}
                                  title="Editar cargo"
                                >
                                  <Edit className="w-4 h-4 text-muted-foreground" />
                                </button>
                                <button 
                                  className="p-2 rounded-lg hover:bg-destructive/20 transition-colors"
                                  onClick={() => handleDeleteClick(user)}
                                  title="Remover usuário"
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {filteredUsers.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-t border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Exibindo</span>
                <Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={String(option)}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span>de {filteredUsers.length} usuários</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Edit Role Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-card border-border max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground">Editar Cargo</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Alterar cargo de <strong className="text-foreground">{selectedUser?.full_name || "Usuário"}</strong>
                </p>
                <label className="block text-sm font-medium text-foreground mb-2">Novo Cargo</label>
                <Select value={editRole} onValueChange={(v) => setEditRole(v as AppRole)}>
                  <SelectTrigger className="input-field">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleFormOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsEditDialogOpen(false)} className="btn-secondary flex-1">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary flex-1" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Cancel Invitation Dialog */}
        <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">Cancelar Convite</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja cancelar o convite para{" "}
                <strong>{selectedInvitation?.email}</strong>? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="btn-secondary">Voltar</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancelConfirm} className="btn-primary bg-destructive hover:bg-destructive/90">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cancelar Convite"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Invite Link Dialog */}
        <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-foreground">Link de Convite</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <p className="text-sm text-muted-foreground">
                O link foi copiado automaticamente. Caso precise, copie novamente abaixo:
              </p>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={inviteLink}
                  className="input-field text-sm"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button onClick={handleCopyLink} className="btn-primary shrink-0">
                  <Copy className="w-4 h-4" />
                  Copiar
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Este link expira em 7 dias.
              </p>
            </div>
          </DialogContent>
        </Dialog>

        {/* View User Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="bg-card border-border max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground">Detalhes do Usuário</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4 mt-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-semibold text-lg">
                      {getInitials(selectedUser.full_name)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-lg">
                      {selectedUser.full_name || "Sem nome"}
                    </p>
                    {selectedUser.is_owner && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                        Proprietário
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-3 bg-secondary/30 rounded-lg p-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Cargo</span>
                    <span className={`badge-status ${roleLabels[selectedUser.role].class}`}>
                      {roleLabels[selectedUser.role].label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Telefone</span>
                    <span className="text-sm text-foreground">{selectedUser.phone || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Veículo</span>
                    <span className="text-sm text-foreground">{selectedUser.vehicle_prefix || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Membro desde</span>
                    <span className="text-sm text-foreground">
                      {new Date(selectedUser.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setIsViewDialogOpen(false)} className="btn-secondary flex-1">
                    Fechar
                  </button>
                  {!selectedUser.is_owner && (
                    <button
                      onClick={() => {
                        setIsViewDialogOpen(false);
                        handleEdit(selectedUser);
                      }}
                      className="btn-primary flex-1"
                    >
                      <Edit className="w-4 h-4" />
                      Editar Cargo
                    </button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete User Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">Remover Usuário</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover <strong>{userToDelete?.full_name || "este usuário"}</strong> da organização?
                O usuário perderá acesso ao sistema e seus veículos serão desvinculados. Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="btn-secondary">Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="btn-primary bg-destructive hover:bg-destructive/90">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Remover Usuário"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Usuarios;
