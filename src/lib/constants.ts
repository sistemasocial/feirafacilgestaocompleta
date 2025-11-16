// Segmentos de produtos disponíveis para feirantes
export const SEGMENTOS_PRODUTOS = [
  { value: "alimentacao", label: "Alimentação" },
  { value: "roupas", label: "Roupas" },
  { value: "doces", label: "Doces" },
  { value: "joias", label: "Joias" },
  { value: "tapetes", label: "Tapetes" },
  { value: "artesanato", label: "Artesanato" },
  { value: "servicos", label: "Serviços" },
  { value: "outros", label: "Outros" },
] as const;

export const DIAS_SEMANA = [
  { id: "0", label: "Domingo", short: "Dom" },
  { id: "1", label: "Segunda", short: "Seg" },
  { id: "2", label: "Terça", short: "Ter" },
  { id: "3", label: "Quarta", short: "Qua" },
  { id: "4", label: "Quinta", short: "Qui" },
  { id: "5", label: "Sexta", short: "Sex" },
  { id: "6", label: "Sábado", short: "Sáb" },
] as const;

export const FORMAS_PAGAMENTO = [
  { id: "pix", label: "PIX" },
  { id: "debito", label: "Débito" },
  { id: "credito", label: "Crédito" },
  { id: "dinheiro", label: "Dinheiro" },
] as const;

// Helper function para obter label do segmento
export const getSegmentoLabel = (value: string): string => {
  const segmento = SEGMENTOS_PRODUTOS.find(s => s.value === value);
  return segmento?.label || value;
};

// Helper function para obter label curto do dia da semana
export const getDiaSemanShort = (id: string): string => {
  const dia = DIAS_SEMANA.find(d => d.id === id);
  return dia?.short || id;
};
