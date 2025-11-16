import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PRODUCT_CATEGORIES, CATEGORY_LABELS } from "@/lib/productCategories";

interface ProfileData {
  full_name: string;
  foto_url: string | null;
}

interface FeiranteData {
  id: string;
  cpf_cnpj: string;
}

export default function CompleteProfileFeirante({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    full_name: "",
    foto_url: null,
  });
  const [feirante, setFeirante] = useState<FeiranteData | null>(null);
  const [cpf, setCpf] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<Record<string, string[]>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    // Load profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name, foto_url")
      .eq("id", userId)
      .single();

    if (profileData) {
      setProfile(profileData);
    }

    // Load feirante data
    const { data: feiranteData } = await supabase
      .from("feirantes")
      .select("id, cpf_cnpj")
      .eq("user_id", userId)
      .single();

    if (feiranteData) {
      setFeirante(feiranteData);
      setCpf(feiranteData.cpf_cnpj);

      // Load selected products
      const { data: produtos } = await supabase
        .from("produtos_feirante")
        .select("categoria, subcategoria")
        .eq("feirante_id", feiranteData.id);

      if (produtos) {
        const grouped: Record<string, string[]> = {};
        produtos.forEach((p) => {
          if (!grouped[p.categoria]) grouped[p.categoria] = [];
          grouped[p.categoria].push(p.subcategoria);
        });
        setSelectedProducts(grouped);
      }
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `avatar-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
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
    setUploading(false);
  };

  const toggleProduct = (categoria: string, subcategoria: string) => {
    setSelectedProducts((prev) => {
      const current = prev[categoria] || [];
      const isSelected = current.includes(subcategoria);
      
      if (isSelected) {
        return {
          ...prev,
          [categoria]: current.filter((s) => s !== subcategoria),
        };
      } else {
        return {
          ...prev,
          [categoria]: [...current, subcategoria],
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update profile
      await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          foto_url: profile.foto_url,
        })
        .eq("id", userId);

      // Create or update feirante
      let feiranteId = feirante?.id;
      
      if (!feirante) {
        const { data: newFeirante, error: feiranteError } = await supabase
          .from("feirantes")
          .insert({
            user_id: userId,
            cpf_cnpj: cpf,
            segmento: "outros",
          })
          .select("id")
          .single();

        if (feiranteError) throw feiranteError;
        feiranteId = newFeirante.id;
      } else {
        await supabase
          .from("feirantes")
          .update({ cpf_cnpj: cpf })
          .eq("id", feirante.id);
      }

      // Update products
      if (feiranteId) {
        // Delete existing products
        await supabase
          .from("produtos_feirante")
          .delete()
          .eq("feirante_id", feiranteId);

        // Insert new products
        const productsToInsert = Object.entries(selectedProducts).flatMap(
          ([categoria, subcategorias]) =>
            subcategorias.map((subcategoria) => ({
              feirante_id: feiranteId,
              categoria,
              subcategoria,
            }))
        );

        if (productsToInsert.length > 0) {
          await supabase.from("produtos_feirante").insert(productsToInsert);
        }
      }

      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar perfil",
        description: error.message,
        variant: "destructive",
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
          
          <Label htmlFor="photo-upload" className="cursor-pointer">
            <Button type="button" variant="outline" size="sm" disabled={uploading} asChild>
              <span>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                Adicionar Foto (opcional)
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
          <Label htmlFor="cpf">CPF *</Label>
          <Input
            id="cpf"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            required
          />
        </div>

        <div className="space-y-4">
          <Label className="text-lg font-semibold">Produtos que você oferece *</Label>
          
          {Object.entries(PRODUCT_CATEGORIES).map(([categoria, subcategorias]) => (
            <div key={categoria} className="space-y-3">
              <h3 className="font-medium text-base">
                {CATEGORY_LABELS[categoria as keyof typeof CATEGORY_LABELS]}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                {subcategorias.map((subcategoria) => (
                  <div key={subcategoria} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${categoria}-${subcategoria}`}
                      checked={selectedProducts[categoria]?.includes(subcategoria) || false}
                      onCheckedChange={() => toggleProduct(categoria, subcategoria)}
                    />
                    <label
                      htmlFor={`${categoria}-${subcategoria}`}
                      className="text-sm cursor-pointer"
                    >
                      {subcategoria}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Salvar Perfil
        </Button>
      </form>
    </Card>
  );
}
