import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export type AppRole = 'admin' | 'manager' | 'driver';

export interface OrganizationUser {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  role: AppRole;
  is_owner: boolean;
  created_at: string;
  avatar_url: string | null;
  vehicle_prefix?: string | null;
}

export interface InviteFormData {
  email: string;
  role: AppRole;
}

export function useUsers() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUsers = async () => {
    if (!profile?.organization_id) {
      setUsers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch profiles with their roles for the organization
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          phone,
          avatar_url,
          is_owner,
          created_at
        `)
        .eq('organization_id', profile.organization_id);

      if (profilesError) throw profilesError;

      // Fetch user roles for the organization
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('organization_id', profile.organization_id);

      if (rolesError) throw rolesError;

      // Fetch drivers
      const { data: drivers, error: driversError } = await supabase
        .from('drivers')
        .select('profile_id')
        .eq('organization_id', profile.organization_id);

      if (driversError) throw driversError;

      // Fetch vehicles to get driver assignments (vehicles have driver_id FK to profiles)
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('driver_id, prefix')
        .eq('organization_id', profile.organization_id);

      if (vehiclesError) throw vehiclesError;

      // Create a map of roles and vehicle prefixes by profile_id
      const roleMap = new Map(roles?.map(r => [r.user_id, r.role as AppRole]) || []);
      const vehicleMap = new Map(
        vehicles?.filter(v => v.driver_id).map(v => [v.driver_id!, v.prefix]) || []
      );

      // We need to get emails from auth.users, but we can't query directly
      // So we'll use RPC or leave email empty for now
      // For a proper implementation, you'd create an RPC function

      const formattedUsers: OrganizationUser[] = (profiles || []).map(p => ({
        id: p.id,
        full_name: p.full_name,
        email: '', // Will be populated if we add an RPC
        phone: p.phone,
        role: roleMap.get(p.id) || 'driver',
        is_owner: p.is_owner,
        created_at: p.created_at,
        avatar_url: p.avatar_url,
        vehicle_prefix: vehicleMap.get(p.id) || null,
      }));

      setUsers(formattedUsers);

      // Fetch pending invitations
      const { data: invitations, error: invitationsError } = await supabase
        .from('invitations')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString());

      if (!invitationsError) {
        setPendingInvitations(invitations || []);
      }

    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Error fetching users:', err);
      }
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [profile?.organization_id]);

  const inviteUser = async (data: InviteFormData): Promise<string | null> => {
    if (!profile?.organization_id) {
      toast({
        title: 'Erro',
        description: 'Organização não encontrada',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const { data: invitation, error } = await supabase
        .from('invitations')
        .insert({
          email: data.email.toLowerCase(),
          role: data.role,
          organization_id: profile.organization_id,
          invited_by: profile.id,
        })
        .select()
        .single();

      if (error) throw error;

      const appUrl = window.location.origin;
      const inviteLink = `${appUrl}/aceitar-convite?token=${encodeURIComponent(invitation.token)}`;

      toast({
        title: 'Convite criado',
        description: `Convite criado para ${data.email}. Copie o link e envie para o usuário.`,
      });

      await fetchUsers();
      return inviteLink;
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error('Error inviting user:', err);
      }
      toast({
        title: 'Erro ao criar convite',
        description: err.message || 'Não foi possível criar o convite',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateUserRole = async (userId: string, newRole: AppRole): Promise<boolean> => {
    if (!profile?.organization_id) return false;

    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId)
        .eq('organization_id', profile.organization_id);

      if (error) throw error;

      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));

      toast({
        title: 'Cargo atualizado',
        description: 'O cargo do usuário foi atualizado com sucesso.',
      });

      return true;
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error('Error updating user role:', err);
      }
      toast({
        title: 'Erro ao atualizar cargo',
        description: err.message || 'Não foi possível atualizar o cargo',
        variant: 'destructive',
      });
      return false;
    }
  };

  const cancelInvitation = async (invitationId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      setPendingInvitations(prev => prev.filter(i => i.id !== invitationId));

      toast({
        title: 'Convite cancelado',
        description: 'O convite foi cancelado com sucesso.',
      });

      return true;
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error('Error canceling invitation:', err);
      }
      toast({
        title: 'Erro ao cancelar convite',
        description: err.message || 'Não foi possível cancelar o convite',
        variant: 'destructive',
      });
      return false;
    }
  };

  const removeUser = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('remove_user_from_organization', {
        _user_id: userId,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'Falha ao remover usuário');
      }

      setUsers(prev => prev.filter(u => u.id !== userId));

      toast({
        title: 'Usuário removido',
        description: 'O usuário foi removido da organização com sucesso.',
      });

      return true;
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error('Error removing user:', err);
      }
      toast({
        title: 'Erro ao remover usuário',
        description: err.message || 'Não foi possível remover o usuário',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Stats
  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    managers: users.filter(u => u.role === 'manager').length,
    drivers: users.filter(u => u.role === 'driver').length,
    pending: pendingInvitations.length,
  };

  return {
    users,
    pendingInvitations,
    loading,
    error,
    stats,
    fetchUsers,
    inviteUser,
    updateUserRole,
    removeUser,
    cancelInvitation,
  };
}
