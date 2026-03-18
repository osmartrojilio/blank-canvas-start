import { useState, useCallback } from 'react';

interface CepData {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  ibge: string;
}

export function useCepLookup() {
  const [loading, setLoading] = useState(false);

  const lookupCep = useCallback(async (cep: string): Promise<CepData | null> => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return null;

    setLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) return null;

      return {
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || '',
        ibge: data.ibge || '',
      };
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { lookupCep, loading };
}
