import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProfileData {
  full_name: string;
  whatsapp: string;
  foto_url: string | null;
  feiras_por_semana: number | null;
  media_feirantes_por_feira: number | null;
  pix_key: string | null;
}

export default function CompleteProfileAdmin({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    full_name: "",
    whatsapp: "",
    foto_url: null,
    feiras_por_semana: null,
    media_feirantes_por_feira: null,
    pix_key: null,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, whatsapp, foto_url, feiras_por_semana, media_feirantes_por_feira, pix_key")
      .eq("id", userId)
      .single();

    if (data && !error) {
      setProfile(data);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;

      // Delete old avatar if exists
      if (profile.foto_url) {
        const oldPath = profile.foto_url.split('/avatars/')[1];
        if (oldPath) {
          await supabase.storage.from("avatars").remove([oldPath]);
        }
      }

      const { error: uploadError, data } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        toast({
          title: "Erro ao enviar foto",
          description: uploadError.message,
          variant: "destructive",
        });
        setUploading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      setProfile({ ...profile, foto_url: publicUrl });
      
      toast({
        title: "Foto carregada!",
        description: "Agora clique em Salvar Perfil para confirmar.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao enviar foto",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        whatsapp: profile.whatsapp,
        foto_url: profile.foto_url,
        feiras_por_semana: profile.feiras_por_semana,
        media_feirantes_por_feira: profile.media_feirantes_por_feira,
        pix_key: profile.pix_key,
      })
      .eq("id", userId);

    if (error) {
      toast({
        title: "Erro ao salvar perfil",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
    }

    setLoading(false);
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Complete seu Perfil</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col items-center gap-4">
          <Avatar className="w-32 h-32">
            <AvatarImage src={profile.foto_url || undefined} />
            <AvatarFallback className="text-4xl">
              {profile.full_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex gap-2">
            <Label htmlFor="photo-upload" className="cursor-pointer">
              <Button type="button" variant="outline" size="sm" disabled={uploading} asChild>
                <span>
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                  Galeria
                </span>
              </Button>
            </Label>
            <Input
              id="photo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
              disabled={uploading}
            />
            
            <Label htmlFor="camera-upload" className="cursor-pointer">
              <Button type="button" variant="outline" size="sm" disabled={uploading} asChild>
                <span>
                  <Camera className="w-4 h-4 mr-2" />
                  Câmera
                </span>
              </Button>
            </Label>
            <Input
              id="camera-upload"
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoUpload}
              disabled={uploading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="full_name">Nome Completo *</Label>
          <Input
            id="full_name"
            value={profile.full_name}
            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp *</Label>
          <Input
            id="whatsapp"
            type="tel"
            placeholder="(00) 00000-0000"
            value={profile.whatsapp}
            onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="feiras_por_semana">Quantidade média de feiras por semana (opcional)</Label>
          <Input
            id="feiras_por_semana"
            type="number"
            placeholder="Ex: 4"
            value={profile.feiras_por_semana || ""}
            onChange={(e) => setProfile({ ...profile, feiras_por_semana: e.target.value ? parseInt(e.target.value) : null })}
            min="1"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="media_feirantes_por_feira">Média de feirantes por feira (opcional)</Label>
          <Input
            id="media_feirantes_por_feira"
            type="number"
            placeholder="Ex: 30"
            value={profile.media_feirantes_por_feira || ""}
            onChange={(e) => setProfile({ ...profile, media_feirantes_por_feira: e.target.value ? parseInt(e.target.value) : null })}
            min="1"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pix_key">Chave PIX (opcional)</Label>
          <Input
            id="pix_key"
            type="text"
            placeholder="Digite sua chave PIX"
            value={profile.pix_key || ""}
            onChange={(e) => setProfile({ ...profile, pix_key: e.target.value })}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Salvar Perfil
        </Button>
      </form>
    </Card>
  );
}
