import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { User, Mail, Lock, Phone, UserCog, Store, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PRODUCT_CATEGORIES, CATEGORY_LABELS } from "@/lib/productCategories";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Email inválido" }).max(255, { message: "Email muito longo" }),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }),
});

const signupSchema = z.object({
  fullName: z.string().trim().min(1, { message: "Nome é obrigatório" }).max(100, { message: "Nome muito longo" }),
  phone: z.string().trim().min(10, { message: "Telefone inválido" }).max(15, { message: "Telefone muito longo" }),
  email: z.string().trim().email({ message: "Email inválido" }).max(255, { message: "Email muito longo" }),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }).max(100, { message: "Senha muito longa" }),
  role: z.enum(["admin", "feirante"], { message: "Selecione um tipo de usuário" }),
  cpf: z.string().trim().min(11, { message: "CPF inválido" }).max(14, { message: "CPF inválido" }),
  feiras_por_semana: z.number().optional(),
  media_feirantes: z.number().optional(),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"admin" | "feirante">("feirante");
  const [cpf, setCpf] = useState("");
  const [feiras_por_semana, setFeirasPorSemana] = useState<number>();
  const [media_feirantes, setMediaFeirantes] = useState<number>();
  const [selectedCategories, setSelectedCategories] = useState<Record<string, string[]>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      if (isLogin) {
        // Validate login
        const result = loginSchema.safeParse({ email, password });
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: result.data.email,
          password: result.data.password,
        });
        if (error) throw error;
        toast.success("Login realizado com sucesso!");
        navigate("/dashboard");
      } else {
        // Validate signup
        const result = signupSchema.safeParse({ 
          fullName, 
          phone, 
          email, 
          password, 
          role,
          cpf,
          feiras_por_semana: role === "admin" ? feiras_por_semana : undefined,
          media_feirantes: role === "admin" ? media_feirantes : undefined,
        });
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email: result.data.email,
          password: result.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: result.data.fullName,
              phone: result.data.phone,
              whatsapp: result.data.phone,
              role: result.data.role,
              cpf: result.data.cpf,
              feiras_por_semana: result.data.feiras_por_semana,
              media_feirantes: result.data.media_feirantes,
            },
          },
        });
        if (error) throw error;
        
        // If feirante, create feirante profile and products
        if (result.data.role === "feirante") {
          const { data: userData } = await supabase.auth.signInWithPassword({
            email: result.data.email,
            password: result.data.password,
          });
          
          if (userData.user) {
            // Create feirante record
            const { data: feiranteData } = await supabase
              .from("feirantes")
              .insert({
                user_id: userData.user.id,
                cpf_cnpj: result.data.cpf,
                segmento: Object.keys(selectedCategories)[0] as any || "outros",
              })
              .select("id")
              .single();
            
            // Save selected products
            if (feiranteData && Object.keys(selectedCategories).length > 0) {
              const produtos = Object.entries(selectedCategories).flatMap(([categoria, subcategorias]) =>
                subcategorias.map((subcategoria) => ({
                  feirante_id: feiranteData.id,
                  categoria,
                  subcategoria,
                }))
              );
              
              if (produtos.length > 0) {
                await supabase.from("produtos_feirante").insert(produtos);
              }
            }
            
            await supabase.auth.signOut();
          }
        }
        
        toast.success("Conta criada! Faça login para continuar.");
        setIsLogin(true);
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao processar solicitação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="hover:bg-accent"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex-1 flex justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow">
              <Store className="w-9 h-9" color="white" />
            </div>
          </div>
          
          <div className="w-10" /> {/* Spacer for alignment */}
        </div>

        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">Feira Fácil</h1>
          <p className="text-lg text-muted-foreground">
            Sua plataforma de gestão completa de feiras
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Seu nome completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone/WhatsApp</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Tipo de Usuário</Label>
                <div className="relative">
                  <UserCog className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                  <Select value={role} onValueChange={(value: "admin" | "feirante") => setRole(value)}>
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="feirante">Feirante</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  disabled={loading}
                  className={errors.cpf ? "border-destructive" : ""}
                  required
                />
                {errors.cpf && <p className="text-sm text-destructive">{errors.cpf}</p>}
              </div>

              {role === "feirante" && (
                <div className="space-y-3">
                  <Label>Categorias e Produtos *</Label>
                  <p className="text-sm text-muted-foreground">
                    Selecione as categorias e subcategorias dos produtos que você vende
                  </p>
                  <Accordion type="multiple" className="w-full">
                    {Object.entries(PRODUCT_CATEGORIES).map(([categoria, subcategorias]) => (
                      <AccordionItem key={categoria} value={categoria}>
                        <AccordionTrigger className="text-sm font-medium">
                          {CATEGORY_LABELS[categoria]}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3 pl-2">
                            {subcategorias.map((subcategoria) => (
                              <div key={subcategoria} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${categoria}-${subcategoria}`}
                                  checked={selectedCategories[categoria]?.includes(subcategoria) || false}
                                  onCheckedChange={(checked) => {
                                    setSelectedCategories((prev) => {
                                      const current = prev[categoria] || [];
                                      if (checked) {
                                        return {
                                          ...prev,
                                          [categoria]: [...current, subcategoria],
                                        };
                                      } else {
                                        return {
                                          ...prev,
                                          [categoria]: current.filter((s) => s !== subcategoria),
                                        };
                                      }
                                    });
                                  }}
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
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}

              {role === "admin" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="feiras_por_semana">Quantidade média de feiras por semana (opcional)</Label>
                    <Input
                      id="feiras_por_semana"
                      type="number"
                      placeholder="Ex: 4"
                      value={feiras_por_semana || ""}
                      onChange={(e) => setFeirasPorSemana(e.target.value ? parseInt(e.target.value) : undefined)}
                      disabled={loading}
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="media_feirantes">Média de feirantes por feira (opcional)</Label>
                    <Input
                      id="media_feirantes"
                      type="number"
                      placeholder="Ex: 30"
                      value={media_feirantes || ""}
                      onChange={(e) => setMediaFeirantes(e.target.value ? parseInt(e.target.value) : undefined)}
                      disabled={loading}
                      min="1"
                    />
                  </div>
                </>
              )}
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                required
                minLength={6}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Processando..." : isLogin ? "Entrar" : "Criar conta"}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-primary hover:underline"
          >
            {isLogin
              ? "Não tem conta? Cadastre-se"
              : "Já tem conta? Faça login"}
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Auth;
