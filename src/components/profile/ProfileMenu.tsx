import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  User,
  Camera,
  KeyRound,
  Phone,
  LogOut,
  Home,
  ChevronUp,
  Loader2,
  Pencil,
} from "lucide-react";
import { Link } from "react-router-dom";

interface ProfileMenuProps {
  variant: "admin" | "client";
}

export function ProfileMenu({ variant }: ProfileMenuProps) {
  const { user, signOut, userRole } = useAuth();
  const queryClient = useQueryClient();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [editDialog, setEditDialog] = useState<"profile" | "password" | "photo" | null>(null);

  // Form states
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  // Fetch profile
  const { data: profile } = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const roleLabel =
    userRole === "admin" ? "Administrador" :
    userRole === "receptionist" ? "Recepcionista" :
    userRole === "professional" ? "Profissional" :
    userRole === "client" ? "Cliente" : userRole;

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email || "";
  const initials = displayName.charAt(0).toUpperCase();

  const openEditDialog = (type: "profile" | "password" | "photo") => {
    if (type === "profile") {
      setFullName(profile?.full_name || "");
      setPhone(profile?.phone || "");
    }
    if (type === "password") {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setEditDialog(type);
    setPopoverOpen(false);
  };

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone: phone || null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
      if (error) throw error;

      // Also update auth metadata
      await supabase.auth.updateUser({
        data: { full_name: fullName },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast.success("Perfil atualizado com sucesso!");
      setEditDialog(null);
    },
    onError: () => toast.error("Erro ao atualizar perfil"),
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) throw new Error("As senhas não coincidem");
      if (newPassword.length < 6) throw new Error("A senha deve ter pelo menos 6 caracteres");
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Senha alterada com sucesso!");
      setEditDialog(null);
    },
    onError: (e: Error) => toast.error(e.message || "Erro ao alterar senha"),
  });

  // Upload avatar
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `avatars/${user.id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("blog-images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("blog-images")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast.success("Foto atualizada com sucesso!");
      setEditDialog(null);
    } catch {
      toast.error("Erro ao enviar foto");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="flex-shrink-0 p-4 border-t border-border bg-card">
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <button className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors text-left">
              <Avatar className="w-10 h-10 border-2 border-primary/20">
                <AvatarImage src={profile?.avatar_url || ""} alt={displayName} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{displayName}</div>
                <div className="text-xs text-muted-foreground">{roleLabel}</div>
              </div>
              <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="w-64 p-2" sideOffset={8}>
            <div className="flex items-center gap-3 p-2 mb-1">
              <Avatar className="w-12 h-12 border-2 border-primary/20">
                <AvatarImage src={profile?.avatar_url || ""} alt={displayName} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="font-semibold text-sm truncate">{displayName}</div>
                <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
                <div className="text-xs text-primary font-medium">{roleLabel}</div>
              </div>
            </div>

            <Separator className="my-1" />

            <div className="space-y-0.5">
              <button
                onClick={() => openEditDialog("profile")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-muted transition-colors"
              >
                <Pencil className="w-4 h-4 text-muted-foreground" />
                Editar Perfil
              </button>
              <button
                onClick={() => openEditDialog("photo")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-muted transition-colors"
              >
                <Camera className="w-4 h-4 text-muted-foreground" />
                Alterar Foto
              </button>
              <button
                onClick={() => openEditDialog("password")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-muted transition-colors"
              >
                <KeyRound className="w-4 h-4 text-muted-foreground" />
                Alterar Senha
              </button>
            </div>

            <Separator className="my-1" />

            {variant === "admin" && (
              <Link
                to="/"
                onClick={() => setPopoverOpen(false)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-muted transition-colors"
              >
                <Home className="w-4 h-4 text-muted-foreground" />
                Voltar ao Site
              </Link>
            )}

            <button
              onClick={() => { setPopoverOpen(false); signOut(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </PopoverContent>
        </Popover>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editDialog === "profile"} onOpenChange={(o) => !o && setEditDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Editar Perfil
            </DialogTitle>
            <DialogDescription>Atualize suas informações pessoais.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome completo</Label>
              <Input
                id="edit-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Telefone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="edit-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(51) 99999-9999"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input value={user?.email || ""} disabled className="bg-muted/50 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(null)}>Cancelar</Button>
            <Button onClick={() => updateProfileMutation.mutate()} disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={editDialog === "password"} onOpenChange={(o) => !o && setEditDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              Alterar Senha
            </DialogTitle>
            <DialogDescription>Defina uma nova senha para sua conta.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar nova senha</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(null)}>Cancelar</Button>
            <Button onClick={() => changePasswordMutation.mutate()} disabled={changePasswordMutation.isPending}>
              {changePasswordMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Alterar Senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Photo Dialog */}
      <Dialog open={editDialog === "photo"} onOpenChange={(o) => !o && setEditDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              Alterar Foto
            </DialogTitle>
            <DialogDescription>Escolha uma nova foto de perfil (máx. 2MB).</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6 py-4">
            <Avatar className="w-24 h-24 border-4 border-primary/20">
              <AvatarImage src={profile?.avatar_url || ""} alt={displayName} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-3xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="w-full">
              <Label htmlFor="avatar-upload" className="cursor-pointer">
                <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 transition-all text-sm font-medium text-primary">
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                  {uploading ? "Enviando..." : "Selecionar imagem"}
                </div>
              </Label>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={uploading}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
