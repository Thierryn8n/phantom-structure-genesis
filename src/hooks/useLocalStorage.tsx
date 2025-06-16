import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // Estado para armazenar o valor
  // Passa função de inicialização para useState para que seja executada apenas uma vez
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      // Obtém do localStorage pelo key
      const item = window.localStorage.getItem(key);
      // Analisa o JSON armazenado ou retorna initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // Se houver erro, retorna initialValue
      console.log('Erro ao recuperar do localStorage:', error);
      return initialValue;
    }
  });

  // Retorna uma versão encapsulada de setState que persiste o novo valor para localStorage.
  const setValue = (value: T) => {
    try {
      // Permite que value seja uma função para ter a mesma API do useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      // Salva state
      setStoredValue(valueToStore);
      // Salva no localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      // Melhor forma de lidar com erros de localStorage
      console.log('Erro ao salvar no localStorage:', error);
    }
  };

  // Sincronizar com outras abas/janelas
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue) {
        setStoredValue(JSON.parse(event.newValue));
      }
    };
    
    // Adiciona o event listener
    window.addEventListener('storage', handleStorageChange);
    
    // Remove na limpeza
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  return [storedValue, setValue];
} 