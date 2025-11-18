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

interface CompleteProfileFeiranteProps {
  userId: string;
  onSuccess?: () => void;
}

export default function CompleteProfileFeirante({ userId, onSuccess }: CompleteProfileFeiranteProps) {
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
      // Validação de campos obrigatórios
      if (!profile.full_name.trim()) {
        throw new Error("Nome completo é obrigatório");
      }
      
      if (!cpf.trim()) {
        throw new Error("CPF/CNPJ é obrigatório");
      }

      // Validar se pelo menos um produto foi selecionado
      const hasProdutosSelecionados = Object.values(selectedProducts).some(
        subcategorias => subcategorias.length > 0
      );
      
      if (!hasProdutosSelecionados) {
        throw new Error("Selecione pelo menos um produto que você vende");
      }

      console.log("Salvando perfil...", { userId, profile, cpf });

      // Update profile
      console.log("PASSO 1: Atualizando profile...");
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          foto_url: profile.foto_url,
        })
        .eq("id", userId);

      if (profileError) {
        console.error("Erro ao atualizar profile:", profileError);
        throw new Error(`Erro ao atualizar perfil: ${profileError.message}`);
      }
      console.log("PASSO 1: Profile atualizado com sucesso");

      // Create or update feirante
      let feiranteId = feirante?.id;
      
      if (!feirante) {
        console.log("PASSO 2: Criando novo feirante...");
        const { data: newFeirante, error: feiranteError } = await supabase
          .from("feirantes")
          .insert({
            user_id: userId,
            cpf_cnpj: cpf,
            segmento: "outros",
          })
          .select("id")
          .single();

        if (feiranteError) {
          console.error("Erro ao criar feirante:", feiranteError);
          throw new Error(`Erro ao criar registro de feirante: ${feiranteError.message}`);
        }
        feiranteId = newFeirante.id;
        console.log("PASSO 2: Feirante criado com ID:", feiranteId);
      } else {
        console.log("PASSO 2: Feirante já existe, ID:", feirante.id);
        // Only update CPF if it changed
        if (feirante.cpf_cnpj !== cpf) {
          console.log("PASSO 2B: Atualizando CPF do feirante...");
          const { error: updateError } = await supabase
            .from("feirantes")
            .update({ cpf_cnpj: cpf })
            .eq("id", feirante.id);
          
          if (updateError) {
            console.error("Erro ao atualizar CPF:", updateError);
            throw new Error(`Erro ao atualizar CPF: ${updateError.message}`);
          }
          console.log("PASSO 2B: CPF atualizado com sucesso");
        }
      }

      // Update products
      if (feiranteId) {
        console.log("PASSO 3: Atualizando produtos para feirante:", feiranteId);
        
        // Delete existing products
        console.log("PASSO 3A: Deletando produtos existentes...");
        const { error: deleteError } = await supabase
          .from("produtos_feirante")
          .delete()
          .eq("feirante_id", feiranteId);

        if (deleteError) {
          console.error("Erro ao deletar produtos:", deleteError);
          throw new Error(`Erro ao remover produtos anteriores: ${deleteError.message}`);
        }
        console.log("PASSO 3A: Produtos deletados com sucesso");

        // Insert new products
        const productsToInsert = Object.entries(selectedProducts).flatMap(
          ([categoria, subcategorias]) =>
            subcategorias.map((subcategoria) => ({
              feirante_id: feiranteId,
              categoria,
              subcategoria,
            }))
        );

        console.log("PASSO 3B: Inserindo", productsToInsert.length, "produtos");
        
        if (productsToInsert.length > 0) {
          const { error: productsError } = await supabase
            .from("produtos_feirante")
            .insert(productsToInsert);
          
          if (productsError) {
            console.error("Erro ao inserir produtos:", productsError);
            throw new Error(`Erro ao salvar produtos: ${productsError.message}`);
          }
          console.log("PASSO 3B: Produtos inseridos com sucesso");
        }
      }

      console.log("PASSO 4: Todas operações concluídas!");
      
      toast({
        title: "✅ Perfil salvo com sucesso!",
        description: "Suas informações foram atualizadas.",
      });
      
      console.log("PASSO 5: Recarregando dados...");
      // Recarregar dados localmente
      await loadData();
      console.log("PASSO 5: Dados recarregados");
      
      setLoading(false);
      
      console.log("PASSO 6: Chamando callback onSuccess...");
      // Chamar callback se fornecido
      if (onSuccess) {
        onSuccess();
      }
      console.log("PASSO 6: Callback executado");
      
    } catch (error: any) {
      console.error("ERRO CAPTURADO:", error);
      toast({
        title: "Erro ao salvar perfil",
        description: error.message || "Ocorreu um erro ao salvar as informações",
        variant: "destructive",
      });
      setLoading(false);
    }
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
