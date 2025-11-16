import { useState, useEffect } from "react";

interface Estado {
  id: number;
  sigla: string;
  nome: string;
}

interface Municipio {
  nome: string;
}

export const useBrasilAPI = () => {
  const [estados, setEstados] = useState<Estado[]>([]);
  const [loadingEstados, setLoadingEstados] = useState(true);

  useEffect(() => {
    const fetchEstados = async () => {
      try {
        const response = await fetch("https://brasilapi.com.br/api/ibge/uf/v1");
        const data = await response.json();
        setEstados(data.sort((a: Estado, b: Estado) => a.nome.localeCompare(b.nome)));
      } catch (error) {
        console.error("Erro ao buscar estados:", error);
      } finally {
        setLoadingEstados(false);
      }
    };

    fetchEstados();
  }, []);

  const fetchMunicipios = async (uf: string): Promise<string[]> => {
    try {
      const response = await fetch(`https://brasilapi.com.br/api/ibge/municipios/v1/${uf}`);
      const data: Municipio[] = await response.json();
      return data.map(m => m.nome).sort();
    } catch (error) {
      console.error("Erro ao buscar municípios:", error);
      return [];
    }
  };

  return {
    estados,
    loadingEstados,
    fetchMunicipios,
  };
};
