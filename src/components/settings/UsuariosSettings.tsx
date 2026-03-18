import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Users, UserPlus, Shield, Mail, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UserWithRole {
  id: string;
  full_name: string | null;
  phone: string | null;
  is_owner: boolean;
  role: string;
  created_at: string;
}

const roleLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  admin: { label: "Administrador", variant: "default" },
  manager: { label: "Gerente", variant: "secondary" },
  driver: { label: "Motorista", variant: "outline" },
};

export function UsuariosSettings() {
  const { toast } = useToast();
  const { profile, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("driver");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [profile?.organization_id]);

  const loadUsers = async () => {
    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }

    try {
      // Get all profiles in the organization
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .eq("organization_id", profile.organization_id);

      if (profilesError) throw profilesError;

      // Get roles for all users
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*")
        .eq("organization_id", profile.organization_id);

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles: UserWithRole[] = (profiles || []).map((p) => {
        const userRole = roles?.find((r) => r.user_id === p.id);
        return {
          id: p.id,
          full_name: p.full_name,
          phone: p.phone,
          is_owner: p.is_owner,
          role: userRole?.role || "driver",
          created_at: p.created_at,
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error loading users:", error);
      }
      toast({
        title: "Erro ao carregar usuários",
        description: "Não foi possível carregar a lista de usuários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!isAdmin || !profile?.organization_id) return;

    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole as any })
        .eq("user_id", userId)
        .eq("organization_id", profile.organization_id);

      if (error) throw error;

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );

      toast({
        title: "Perfil atualizado",
        description: "O perfil do usuário foi alterado com sucesso.",
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error updating role:", error);
      }
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível alterar o perfil do usuário.",
        variant: "destructive",
      });
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, informe o email do usuário.",
        variant: "destructive",
      });
      return;
    }

    if (!profile?.organization_id) {
      toast({
        title: "Erro",
        description: "Organização não encontrada.",
        variant: "destructive",
      });
      return;
    }

    setInviting(true);

    try {
      // Check if there's already a pending invitation for this email
      const { data: existingInvitation, error: checkError } = await supabase
        .from("invitations")
        .select("id, accepted_at, expires_at")
        .eq("organization_id", profile.organization_id)
        .eq("email", inviteEmail.toLowerCase())
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingInvitation) {
        if (!existingInvitation.accepted_at && new Date(existingInvitation.expires_at) > new Date()) {
          toast({
            title: "Convite já existe",
            description: "Já existe um convite pendente para este email.",
            variant: "destructive",
          });
          setInviting(false);
          return;
        }
        // Delete expired or accepted invitation to allow new one
        await supabase.from("invitations").delete().eq("id", existingInvitation.id);
      }

      // Get organization name for the email
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", profile.organization_id)
        .single();

      if (orgError) throw orgError;

      // Create invitation record
      const { data: invitation, error: inviteError } = await supabase
        .from("invitations")
        .insert({
          email: inviteEmail.toLowerCase(),
          organization_id: profile.organization_id,
          invited_by: profile.id,
          role: inviteRole as any,
        })
        .select()
        .single();

      if (inviteError) throw inviteError;

      // Generate invite link for manual sharing (no email sending)
      const appUrl = window.location.origin;
      const inviteLink = `${appUrl}/aceitar-convite?token=${invitation.token}`;

      // Copy link to clipboard
      try {
        await navigator.clipboard.writeText(inviteLink);
        toast({
          title: "Convite criado!",
          description: "O link de convite foi copiado para a área de transferência. Compartilhe com o usuário.",
        });
      } catch {
        toast({
          title: "Convite criado!",
          description: `Link de convite: ${inviteLink}`,
        });
      }

      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("driver");
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error sending invitation:", error);
      }
      toast({
        title: "Erro ao enviar convite",
        description: error instanceof Error ? error.message : "Não foi possível enviar o convite.",
        variant: "destructive",
      });
    } finally {
      setInviting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Usuários
              </CardTitle>
              <CardDescription>
                Gerencie os usuários da sua empresa
              </CardDescription>
            </div>
            {isAdmin && (
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Convidar Usuário
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Convidar Novo Usuário</DialogTitle>
                    <DialogDescription>
                      Envie um convite por email para adicionar um novo usuário.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="usuario@empresa.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Perfil</Label>
                      <Select value={inviteRole} onValueChange={setInviteRole}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="manager">Gerente</SelectItem>
                          <SelectItem value="driver">Motorista</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleInvite} disabled={inviting}>
                      <Mail className="h-4 w-4 mr-2" />
                      {inviting ? "Enviando..." : "Enviar Convite"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Nenhum usuário encontrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Cadastro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {user.full_name || "Sem nome"}
                        </span>
                        {user.is_owner && (
                          <Badge variant="outline" className="text-xs">
                            Proprietário
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{user.phone || "-"}</TableCell>
                    <TableCell>
                      {isAdmin && !user.is_owner ? (
                        <Select
                          value={user.role}
                          onValueChange={(value) => handleRoleChange(user.id, value)}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="manager">Gerente</SelectItem>
                            <SelectItem value="driver">Motorista</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={roleLabels[user.role]?.variant || "outline"}>
                          {roleLabels[user.role]?.label || user.role}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Perfis de Acesso
          </CardTitle>
          <CardDescription>
            Níveis de permissão disponíveis no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-lg border">
              <Badge>Administrador</Badge>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  Acesso total ao sistema. Pode gerenciar usuários, configurações, 
                  relatórios e todos os dados da empresa.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-lg border">
              <Badge variant="secondary">Gerente</Badge>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  Pode visualizar relatórios, validar lançamentos de motoristas e 
                  gerenciar a frota. Não pode alterar configurações.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-lg border">
              <Badge variant="outline">Motorista</Badge>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  Pode registrar abastecimentos, despesas e viagens. 
                  Visualiza apenas seus próprios lançamentos.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
