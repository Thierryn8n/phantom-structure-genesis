/**
 * Formata um número para o formato de moeda brasileira (BRL)
 * @param value Valor a ser formatado
 * @returns String formatada no padrão R$ X.XXX,XX
 */
export function formatPrice(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Formata um número para o formato de porcentagem
 * @param value Valor a ser formatado
 * @returns String formatada no padrão XX,XX%
 */
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value / 100);
}

/**
 * Remove a formatação de um valor monetário
 * @param value String formatada (ex: "R$ 1.234,56")
 * @returns Número (ex: 1234.56)
 */
export function unformatPrice(value: string): number {
  return Number(value.replace(/[^\d,-]/g, '').replace(',', '.'));
}

/**
 * Formata um número para ter sempre 2 casas decimais
 * @param value Número a ser formatado
 * @returns String formatada com 2 casas decimais
 */
export function formatDecimal(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Formata um número para ter separadores de milhar
 * @param value Número a ser formatado
 * @returns String formatada com separadores de milhar
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

/**
 * Formata uma data para o formato brasileiro
 * @param date Data a ser formatada
 * @returns String formatada no padrão DD/MM/YYYY
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR').format(date);
}

/**
 * Formata uma data e hora para o formato brasileiro
 * @param date Data a ser formatada
 * @returns String formatada no padrão DD/MM/YYYY HH:mm
 */
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

/**
 * Formata um CPF/CNPJ
 * @param value String contendo apenas números
 * @returns String formatada no padrão XXX.XXX.XXX-XX ou XX.XXX.XXX/XXXX-XX
 */
export function formatDocument(value: string): string {
  const numbers = value.replace(/\D/g, '');
  
  if (numbers.length <= 11) {
    // CPF
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } else {
    // CNPJ
    return numbers
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
}

/**
 * Formata um número de telefone
 * @param value String contendo apenas números
 * @returns String formatada no padrão (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 */
export function formatPhone(value: string): string {
  const numbers = value.replace(/\D/g, '');
  
  if (numbers.length === 11) {
    return numbers
      .replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  } else {
    return numbers
      .replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }
}

/**
 * Formata um CEP
 * @param value String contendo apenas números
 * @returns String formatada no padrão XXXXX-XXX
 */
export function formatCEP(value: string): string {
  const numbers = value.replace(/\D/g, '');
  return numbers.replace(/^(\d{5})(\d{3})$/, '$1-$2');
} 