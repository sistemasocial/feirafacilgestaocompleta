import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { useBrasilAPI } from "@/hooks/useBrasilAPI";
import { DraggableStatsCards } from "./DraggableStatsCards";

const feiraSchema = z.object({
  nome: z.string().trim().min(1, { message: "Nome é obrigatório" }).max(100, { message: "Nome muito longo" }),
  estado: z.string().min(1, { message: "Estado é obrigatório" }),
  cidade: z.string().min(1, { message: "Cidade é obrigatória" }),
  bairro: z.string().trim().min(1, { message: "Bairro é obrigatório" }).max(100, { message: "Bairro muito longo" }),
  endereco: z.string().trim().min(1, { message: "Endereço é obrigatório" }).max(200, { message: "Endereço muito longo" }),
  tipo_feira: z.string().min(1, { message: "Tipo de feira é obrigatório" }),
  dias_semana: z.array(z.string()).min(1, { message: "Selecione pelo menos um dia" }),
  horario_inicio: z.string().min(1, { message: "Horário de início é obrigatório" }),
  horario_fim: z.string().min(1, { message: "Horário de fim é obrigatório" }),
  tempo_antecedencia_minutos: z.number().min(0, { message: "Tempo deve ser positivo" }),
  formas_pagamento: z.array(z.string()).min(1, { message: "Selecione pelo menos uma forma de pagamento" }),
  horas_cancelamento_sem_multa: z.number().min(0, { message: "Horas devem ser positivas" }),
  taxa_cancelamento: z.string().refine(val => !val || !isNaN(parseFloat(val)) && parseFloat(val) >= 0, { 
    message: "Taxa deve ser um número positivo" 
  }),
  valor_participacao: z.string().refine(val => !val || !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Valor deve ser um número positivo"
  }),
  taxa_energia: z.string().refine(val => !val || !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Taxa deve ser um número positivo"
  }),
  taxa_limpeza: z.string().refine(val => !val || !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Taxa deve ser um número positivo"
  }),
  taxa_seguranca: z.string().refine(val => !val || !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Taxa deve ser um número positivo"
  }),
  regras_evento: z.string().max(5000, { message: "Regras muito longas" }).optional(),
  politica_cancelamento: z.string().max(5000, { message: "Política muito longa" }).optional(),
  avisos: z.string().max(2000, { message: "Avisos muito longos" }).optional(),
  observacoes: z.string().max(2000, { message: "Observações muito longas" }).optional(),
}).refine(data => {
  if (data.horario_inicio && data.horario_fim) {
    return data.horario_fim > data.horario_inicio;
  }
  return true;
}, {
  message: "Horário de fim deve ser após o horário de início",
  path: ["horario_fim"],
});

interface FeiraFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const DIAS_SEMANA = [
  { id: "0", label: "Domingo" },
  { id: "1", label: "Segunda" },
  { id: "2", label: "Terça" },
  { id: "3", label: "Quarta" },
  { id: "4", label: "Quinta" },
  { id: "5", label: "Sexta" },
  { id: "6", label: "Sábado" },
];

const FORMAS_PAGAMENTO = [
  { id: "pix", label: "PIX" },
  { id: "debito", label: "Débito" },
  { id: "credito", label: "Crédito" },
];

export const FeiraForm = ({ onSuccess, onCancel }: FeiraFormProps) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { estados, loadingEstados, fetchMunicipios } = useBrasilAPI();
  const [cidades, setCidades] = useState<string[]>([]);
  const [loadingCidades, setLoadingCidades] = useState(false);
  
  const [bairros, setBairros] = useState<string[]>([]);
  const [loadingBairros, setLoadingBairros] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: "",
    estado: "",
    cidade: "",
    bairro: "",
    endereco: "",
    tipo_feira: "publica",
    dias_semana: [] as string[],
    horario_inicio: "",
    horario_fim: "",
    tempo_antecedencia_minutos: 30,
    prazo_pagamento_dias: 3,
    formas_pagamento: ["pix", "debito", "credito"],
    horas_cancelamento_sem_multa: 24,
    taxa_cancelamento: "",
    valor_participacao: "",
    taxa_energia: "",
    taxa_limpeza: "",
    taxa_seguranca: "",
    regras_evento: "",
    politica_cancelamento: "",
    avisos: "",
    observacoes: "",
    recorrente: false,
    segmento_exclusivo: false,
  });

  useEffect(() => {
    if (formData.estado) {
      loadCidades(formData.estado);
    }
  }, [formData.estado]);

  const loadCidades = async (uf: string) => {
    setLoadingCidades(true);
    const municipios = await fetchMunicipios(uf);
    setCidades(municipios);
    setLoadingCidades(false);
    setFormData(prev => ({ ...prev, cidade: "", bairro: "" }));
    setBairros([]);
  };

  const loadBairros = async (cidade: string) => {
    setLoadingBairros(true);
    try {
      const estadoSigla = formData.estado;
      const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estadoSigla}/distritos`);
      const data = await response.json();
      const bairrosDaCidade = data
        .filter((d: any) => d.municipio.nome === cidade)
        .map((d: any) => d.nome)
        .sort();
      
      if (bairrosDaCidade.length > 0) {
        setBairros(bairrosDaCidade);
      } else {
        setBairros([]);
      }
    } catch (error) {
      console.error("Erro ao buscar bairros:", error);
      setBairros([]);
    } finally {
      setLoadingBairros(false);
    }
  };

  const handleDiaChange = (diaId: string) => {
    setFormData(prev => ({
      ...prev,
      dias_semana: prev.dias_semana.includes(diaId)
        ? prev.dias_semana.filter(d => d !== diaId)
        : [...prev.dias_semana, diaId]
    }));
  };

  const handlePagamentoChange = (pagamentoId: string) => {
    setFormData(prev => ({
      ...prev,
      formas_pagamento: prev.formas_pagamento.includes(pagamentoId)
        ? prev.formas_pagamento.filter(p => p !== pagamentoId)
        : [...prev.formas_pagamento, pagamentoId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = feiraSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path) {
          fieldErrors[err.path[0]] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast.error("Por favor, corrija os erros no formulário");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("feiras").insert({
        nome: formData.nome,
        cidade: formData.cidade,
        bairro: formData.bairro,
        endereco: formData.endereco,
        tipo_feira: formData.tipo_feira,
        dias_semana: formData.dias_semana,
        horario_inicio: formData.horario_inicio,
        horario_fim: formData.horario_fim,
        horario_limite_montagem: formData.horario_inicio,
        tempo_antecedencia_minutos: formData.tempo_antecedencia_minutos,
        formas_pagamento: formData.formas_pagamento,
        horas_cancelamento_sem_multa: formData.horas_cancelamento_sem_multa,
        taxa_cancelamento: parseFloat(formData.taxa_cancelamento) || 0,
        valor_participacao: parseFloat(formData.valor_participacao) || 0,
        taxa_energia: parseFloat(formData.taxa_energia) || 0,
        taxa_limpeza: parseFloat(formData.taxa_limpeza) || 0,
        taxa_seguranca: parseFloat(formData.taxa_seguranca) || 0,
        regras_evento: formData.regras_evento || null,
        politica_cancelamento: formData.politica_cancelamento || null,
        avisos: formData.avisos || null,
        observacoes: formData.observacoes || null,
        recorrente: formData.recorrente,
        segmento_exclusivo: formData.segmento_exclusivo,
        created_by: user?.id,
        prazo_pagamento_dias: formData.prazo_pagamento_dias || 3,
      });

      if (error) throw error;

      toast.success("Feira cadastrada com sucesso!");
      onSuccess();
    } catch (error: any) {
      toast.error("Erro ao cadastrar feira: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formCards = [
    // Card 1: Informações Básicas
    <Card key="info-basicas" className="h-full">
      <CardHeader>
        <CardTitle>Informações Básicas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="nome">Nome da Feira *</Label>
          <Input
            id="nome"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            placeholder="Ex: Feira do Setor Bueno"
            required
          />
          {errors.nome && <p className="text-sm text-destructive mt-1">{errors.nome}</p>}
        </div>

        <div>
          <Label htmlFor="estado">Estado *</Label>
          <Select 
            value={formData.estado} 
            onValueChange={(value) => setFormData({ ...formData, estado: value })}
            disabled={loadingEstados}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o estado" />
            </SelectTrigger>
            <SelectContent>
              {estados.map((estado) => (
                <SelectItem key={estado.sigla} value={estado.sigla}>
                  {estado.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.estado && <p className="text-sm text-destructive mt-1">{errors.estado}</p>}
        </div>

        <div>
          <Label htmlFor="cidade">Cidade *</Label>
          <Select 
            value={formData.cidade} 
            onValueChange={(value) => {
              setFormData({ ...formData, cidade: value, bairro: "" });
              loadBairros(value);
            }}
            disabled={!formData.estado || loadingCidades}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a cidade" />
            </SelectTrigger>
            <SelectContent>
              {cidades.map((cidade) => (
                <SelectItem key={cidade} value={cidade}>
                  {cidade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.cidade && <p className="text-sm text-destructive mt-1">{errors.cidade}</p>}
        </div>

        <div>
          <Label htmlFor="bairro">Bairro *</Label>
          {bairros.length > 0 ? (
            <Select
              value={formData.bairro}
              onValueChange={(value) => setFormData({ ...formData, bairro: value })}
              disabled={!formData.cidade || loadingBairros}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingBairros ? "Carregando..." : "Selecione o bairro"} />
              </SelectTrigger>
              <SelectContent>
                {bairros.map((bairro) => (
                  <SelectItem key={bairro} value={bairro}>
                    {bairro}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="bairro"
              value={formData.bairro}
              onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
              placeholder="Digite o bairro"
              disabled={loadingBairros}
            />
          )}
          {errors.bairro && <p className="text-sm text-destructive mt-1">{errors.bairro}</p>}
        </div>

        <div>
          <Label htmlFor="endereco">Endereço Completo *</Label>
          <Input
            id="endereco"
            value={formData.endereco}
            onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
            placeholder="Rua, número, complemento"
            required
          />
          {errors.endereco && <p className="text-sm text-destructive mt-1">{errors.endereco}</p>}
        </div>

        <div>
          <Label htmlFor="tipo_feira">Tipo de Feira *</Label>
          <Select value={formData.tipo_feira} onValueChange={(value) => setFormData({ ...formData, tipo_feira: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="publica">Feira Pública</SelectItem>
              <SelectItem value="condominio">Condomínio</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>,

    // Card 2: Valores e Taxas
    <Card key="valores-taxas" className="h-full">
      <CardHeader>
        <CardTitle>Valores e Taxas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="valor_participacao">Valor de Participação (R$)</Label>
          <Input
            id="valor_participacao"
            type="number"
            step="0.01"
            min="0"
            value={formData.valor_participacao}
            onChange={(e) => setFormData({ ...formData, valor_participacao: e.target.value })}
            placeholder="0.00"
          />
          {errors.valor_participacao && <p className="text-sm text-destructive mt-1">{errors.valor_participacao}</p>}
        </div>

        <div>
          <Label htmlFor="taxa_energia">Taxa de Energia (R$)</Label>
          <Input
            id="taxa_energia"
            type="number"
            step="0.01"
            min="0"
            value={formData.taxa_energia}
            onChange={(e) => setFormData({ ...formData, taxa_energia: e.target.value })}
            placeholder="0.00"
          />
          {errors.taxa_energia && <p className="text-sm text-destructive mt-1">{errors.taxa_energia}</p>}
        </div>

        <div>
          <Label htmlFor="taxa_limpeza">Taxa de Limpeza (R$)</Label>
          <Input
            id="taxa_limpeza"
            type="number"
            step="0.01"
            min="0"
            value={formData.taxa_limpeza}
            onChange={(e) => setFormData({ ...formData, taxa_limpeza: e.target.value })}
            placeholder="0.00"
          />
          {errors.taxa_limpeza && <p className="text-sm text-destructive mt-1">{errors.taxa_limpeza}</p>}
        </div>

        <div>
          <Label htmlFor="taxa_seguranca">Taxa de Segurança (R$)</Label>
          <Input
            id="taxa_seguranca"
            type="number"
            step="0.01"
            min="0"
            value={formData.taxa_seguranca}
            onChange={(e) => setFormData({ ...formData, taxa_seguranca: e.target.value })}
            placeholder="0.00"
          />
          {errors.taxa_seguranca && <p className="text-sm text-destructive mt-1">{errors.taxa_seguranca}</p>}
        </div>

        <div>
          <Label htmlFor="prazo_pagamento_dias">Prazo de Pagamento (dias antes)</Label>
          <Input
            id="prazo_pagamento_dias"
            type="number"
            min="1"
            value={formData.prazo_pagamento_dias}
            onChange={(e) => setFormData({ ...formData, prazo_pagamento_dias: parseInt(e.target.value) || 3 })}
            placeholder="3"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Feirantes devem pagar até X dias antes da feira
          </p>
        </div>
      </CardContent>
    </Card>,

    // Card 3: Horários e Dias
    <Card key="horarios-dias" className="h-full">
      <CardHeader>
        <CardTitle>Horários e Dias</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Dias da Semana *</Label>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {DIAS_SEMANA.map((dia) => (
              <div key={dia.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`dia-${dia.id}`}
                  checked={formData.dias_semana.includes(dia.id)}
                  onCheckedChange={() => handleDiaChange(dia.id)}
                />
                <Label htmlFor={`dia-${dia.id}`} className="text-sm cursor-pointer">
                  {dia.label}
                </Label>
              </div>
            ))}
          </div>
          {errors.dias_semana && <p className="text-sm text-destructive mt-1">{errors.dias_semana}</p>}
        </div>

        <div>
          <Label htmlFor="horario_inicio">Horário de Início *</Label>
          <Input
            id="horario_inicio"
            type="time"
            value={formData.horario_inicio}
            onChange={(e) => setFormData({ ...formData, horario_inicio: e.target.value })}
            required
          />
          {errors.horario_inicio && <p className="text-sm text-destructive mt-1">{errors.horario_inicio}</p>}
        </div>

        <div>
          <Label htmlFor="horario_fim">Horário de Término *</Label>
          <Input
            id="horario_fim"
            type="time"
            value={formData.horario_fim}
            onChange={(e) => setFormData({ ...formData, horario_fim: e.target.value })}
            required
          />
          {errors.horario_fim && <p className="text-sm text-destructive mt-1">{errors.horario_fim}</p>}
        </div>

        <div>
          <Label htmlFor="tempo_antecedencia">Tempo de Antecedência (minutos)</Label>
          <Input
            id="tempo_antecedencia"
            type="number"
            min="0"
            value={formData.tempo_antecedencia_minutos}
            onChange={(e) => setFormData({ ...formData, tempo_antecedencia_minutos: parseInt(e.target.value) || 0 })}
          />
        </div>
      </CardContent>
    </Card>,

    // Card 4: Formas de Pagamento e Políticas
    <Card key="pagamento-politicas" className="h-full">
      <CardHeader>
        <CardTitle>Formas de Pagamento e Políticas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Formas de Pagamento Aceitas *</Label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {FORMAS_PAGAMENTO.map((forma) => (
              <div key={forma.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`pagamento-${forma.id}`}
                  checked={formData.formas_pagamento.includes(forma.id)}
                  onCheckedChange={() => handlePagamentoChange(forma.id)}
                />
                <Label htmlFor={`pagamento-${forma.id}`} className="text-sm cursor-pointer">
                  {forma.label}
                </Label>
              </div>
            ))}
          </div>
          {errors.formas_pagamento && <p className="text-sm text-destructive mt-1">{errors.formas_pagamento}</p>}
        </div>

        <div>
          <Label htmlFor="horas_cancelamento">Horas p/ Cancelamento sem Multa</Label>
          <Input
            id="horas_cancelamento"
            type="number"
            min="0"
            value={formData.horas_cancelamento_sem_multa}
            onChange={(e) => setFormData({ ...formData, horas_cancelamento_sem_multa: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div>
          <Label htmlFor="taxa_cancelamento">Taxa de Cancelamento (R$)</Label>
          <Input
            id="taxa_cancelamento"
            type="number"
            step="0.01"
            min="0"
            value={formData.taxa_cancelamento}
            onChange={(e) => setFormData({ ...formData, taxa_cancelamento: e.target.value })}
            placeholder="0.00"
          />
          {errors.taxa_cancelamento && <p className="text-sm text-destructive mt-1">{errors.taxa_cancelamento}</p>}
        </div>

        <div>
          <Label htmlFor="regras_evento">Regras do Evento</Label>
          <Textarea
            id="regras_evento"
            value={formData.regras_evento}
            onChange={(e) => setFormData({ ...formData, regras_evento: e.target.value })}
            rows={3}
            placeholder="Descreva as regras do evento"
          />
        </div>

        <div>
          <Label htmlFor="politica_cancelamento">Política de Cancelamento</Label>
          <Textarea
            id="politica_cancelamento"
            value={formData.politica_cancelamento}
            onChange={(e) => setFormData({ ...formData, politica_cancelamento: e.target.value })}
            rows={3}
            placeholder="Descreva a política de cancelamento"
          />
        </div>

        <div>
          <Label htmlFor="avisos">Avisos</Label>
          <Textarea
            id="avisos"
            value={formData.avisos}
            onChange={(e) => setFormData({ ...formData, avisos: e.target.value })}
            rows={2}
            placeholder="Avisos importantes"
          />
        </div>

        <div>
          <Label htmlFor="observacoes">Observações</Label>
          <Textarea
            id="observacoes"
            value={formData.observacoes}
            onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
            rows={2}
            placeholder="Observações adicionais"
          />
        </div>
      </CardContent>
    </Card>,

    // Card 5: Configurações da Feira
    <Card key="configuracoes" className="h-full">
      <CardHeader>
        <CardTitle>Configurações da Feira</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="recorrente"
            checked={formData.recorrente}
            onCheckedChange={(checked) => 
              setFormData(prev => ({ ...prev, recorrente: checked as boolean }))
            }
          />
          <Label htmlFor="recorrente" className="cursor-pointer">
            Feira Recorrente (reaparece automaticamente nas próximas datas)
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="segmento_exclusivo"
            checked={formData.segmento_exclusivo}
            onCheckedChange={(checked) => 
              setFormData(prev => ({ ...prev, segmento_exclusivo: checked as boolean }))
            }
          />
          <Label htmlFor="segmento_exclusivo" className="cursor-pointer">
            Segmento Exclusivo (apenas um feirante por segmento)
          </Label>
        </div>
      </CardContent>
    </Card>,
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DraggableStatsCards layout="vertical" storageKey="criarFeiraCardsOrder">
        {formCards}
      </DraggableStatsCards>

      <div className="flex gap-4 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Cadastrar Feira
        </Button>
      </div>
    </form>
  );
};
