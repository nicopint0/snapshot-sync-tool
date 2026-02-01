import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  Stethoscope, 
  UserCog,
  Loader2,
  Crown,
  Lock,
  Trash2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PlanLimits {
  professionals: number;
  admins: number;
  planName: string;
}

const planLimits: Record<string, PlanLimits> = {
  individual: { professionals: 1, admins: 0, planName: "Individual" },
  profesional: { professionals: 5, admins: 1, planName: "Profesional" },
  business: { professionals: 20, admins: 5, planName: "Business" },
};

const roleLabels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  admin: { label: "Administrador", icon: Shield, color: "bg-amber-500/10 text-amber-600" },
  dentist: { label: "Profesional", icon: Stethoscope, color: "bg-blue-500/10 text-blue-600" },
  assistant: { label: "Asistente", icon: UserCog, color: "bg-green-500/10 text-green-600" },
  receptionist: { label: "Recepcionista", icon: Users, color: "bg-purple-500/10 text-purple-600" },
};

const UsersManagementSection = () => {
  const { profile, user } = useAuth();
  const { plan: currentPlan, subscribed } = useSubscription();
  const queryClient = useQueryClient();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "dentist" as string,
  });

  const limits = planLimits[currentPlan] || planLimits.individual;
  const canManageUsers = subscribed && currentPlan !== "individual";

  // Fetch team members
  const { data: teamMembers = [], isLoading } = useQuery({
    queryKey: ["team-members", profile?.clinic_id],
    queryFn: async () => {
      if (!profile?.clinic_id) return [];
      
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("clinic_id", profile.clinic_id);
      
      if (error) throw error;

      // Get roles for each profile
      const { data: roles } = await supabase
        .from("user_roles")
        .select("*")
        .eq("clinic_id", profile.clinic_id);

      return profiles.map((p) => ({
        ...p,
        role: roles?.find((r) => r.user_id === p.user_id)?.role || "dentist",
        isCurrentUser: p.user_id === user?.id,
      }));
    },
    enabled: !!profile?.clinic_id,
  });

  // Count users by type
  const userCounts = {
    professionals: teamMembers.filter((m) => 
      ["dentist", "assistant", "receptionist"].includes(m.role)
    ).length,
    admins: teamMembers.filter((m) => m.role === "admin").length,
  };

  const canAddProfessional = userCounts.professionals < limits.professionals;
  const canAddAdmin = userCounts.admins < limits.admins;

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (profileId: string) => {
      const memberToDelete = teamMembers.find((m) => m.id === profileId);
      if (!memberToDelete) throw new Error("Usuario no encontrado");
      
      // Delete user role
      const { error: roleError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", memberToDelete.user_id);
      
      if (roleError) throw roleError;

      // Note: We can't delete from auth.users directly, but we can remove from profiles
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", profileId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("Usuario eliminado del equipo");
      setUserToDelete(null);
    },
    onError: (error) => {
      toast.error("Error al eliminar: " + error.message);
    },
  });

  // Fetch clinic info for the invitation email
  const { data: clinic } = useQuery({
    queryKey: ["clinic", profile?.clinic_id],
    queryFn: async () => {
      if (!profile?.clinic_id) return null;
      const { data, error } = await supabase
        .from("clinics")
        .select("name")
        .eq("id", profile.clinic_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.clinic_id,
  });

  const handleInvite = async () => {
    if (!inviteForm.email || !inviteForm.firstName) {
      toast.error("Por favor completa los campos requeridos");
      return;
    }

    setIsSendingInvite(true);

    try {
      const inviterName = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "Un administrador";
      const clinicName = clinic?.name || "tu clínica";
      const inviteUrl = `${window.location.origin}/auth/register?invite=true&clinic=${profile?.clinic_id}&role=${inviteForm.role}`;

      const { data, error } = await supabase.functions.invoke("send-invitation", {
        body: {
          email: inviteForm.email,
          firstName: inviteForm.firstName,
          lastName: inviteForm.lastName,
          role: inviteForm.role,
          clinicName,
          inviterName,
          inviteUrl,
        },
      });

      if (error) throw error;

      toast.success(`Invitación enviada a ${inviteForm.email}`);
      setShowInviteDialog(false);
      setInviteForm({ email: "", firstName: "", lastName: "", role: "dentist" });
    } catch (error: any) {
      console.error("Error sending invitation:", error);
      toast.error(error.message || "Error al enviar la invitación");
    } finally {
      setIsSendingInvite(false);
    }
  };

  if (!canManageUsers) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            Usuarios y Permisos
          </CardTitle>
          <CardDescription>Gestiona los miembros de tu equipo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-2">
              Función disponible en planes superiores
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Actualiza a Plan Profesional o Business para agregar más usuarios a tu equipo.
            </p>
            <Badge variant="outline" className="text-xs">
              Plan actual: Individual (1 profesional)
            </Badge>
          </div>
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
              <CardTitle>Usuarios y Permisos</CardTitle>
              <CardDescription>Gestiona los miembros de tu equipo</CardDescription>
            </div>
            <Button onClick={() => setShowInviteDialog(true)} disabled={!canAddProfessional && !canAddAdmin}>
              <UserPlus className="h-4 w-4 mr-2" />
              Agregar Usuario
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Plan Limits */}
          <div className="grid grid-cols-2 gap-4 mb-6 p-4 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Profesionales</span>
              </div>
              <Badge variant={canAddProfessional ? "secondary" : "destructive"}>
                {userCounts.professionals} / {limits.professionals}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-500" />
                <span className="text-sm">Administrativos</span>
              </div>
              <Badge variant={canAddAdmin ? "secondary" : "destructive"}>
                {userCounts.admins} / {limits.admins}
              </Badge>
            </div>
          </div>

          {/* Team Members List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay miembros en el equipo
            </div>
          ) : (
            <div className="space-y-3">
              {teamMembers.map((member) => {
                const roleInfo = roleLabels[member.role] || roleLabels.dentist;
                const RoleIcon = roleInfo.icon;
                
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {member.first_name?.[0]}{member.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">
                            {member.first_name} {member.last_name}
                          </p>
                          {member.isCurrentUser && (
                            <Badge variant="outline" className="text-xs">Tú</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge className={`${roleInfo.color} border`}>
                        <RoleIcon className="h-3 w-3 mr-1" />
                        {roleInfo.label}
                      </Badge>
                      {!member.isCurrentUser && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setUserToDelete(member.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Usuario al Equipo</DialogTitle>
            <DialogDescription>
              Invita a un nuevo miembro a tu clínica
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre</Label>
                <Input
                  id="firstName"
                  value={inviteForm.firstName}
                  onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                  placeholder="Juan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido</Label>
                <Input
                  id="lastName"
                  value={inviteForm.lastName}
                  onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                  placeholder="Pérez"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                placeholder="usuario@clinica.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <Select
                value={inviteForm.role}
                onValueChange={(value) => setInviteForm({ ...inviteForm, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dentist" disabled={!canAddProfessional}>
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" />
                      Profesional (Dentista)
                    </div>
                  </SelectItem>
                  <SelectItem value="assistant" disabled={!canAddProfessional}>
                    <div className="flex items-center gap-2">
                      <UserCog className="h-4 w-4" />
                      Asistente
                    </div>
                  </SelectItem>
                  <SelectItem value="receptionist" disabled={!canAddProfessional}>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Recepcionista
                    </div>
                  </SelectItem>
                  {limits.admins > 0 && (
                    <SelectItem value="admin" disabled={!canAddAdmin}>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Administrador
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)} disabled={isSendingInvite}>
              Cancelar
            </Button>
            <Button onClick={handleInvite} disabled={isSendingInvite}>
              {isSendingInvite ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              {isSendingInvite ? "Enviando..." : "Enviar Invitación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Este usuario será eliminado del equipo y perderá acceso al sistema.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && deleteUserMutation.mutate(userToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUserMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UsersManagementSection;
