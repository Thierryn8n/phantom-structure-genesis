/**
 * Utilitário para validar e processar arquivos CSV para importação
 */

export interface CsvProductData {
  ncm: string;
  name: string;
  unit: string;
  quantity: number;
  price: number;
  total?: number;
  code?: string;
}

export interface CsvValidationResult {
  valid: boolean;
  products: CsvProductData[];
  errors: string[];
  warnings: string[];
}

/**
 * Normaliza texto removendo acentos e caracteres especiais
 * @param text Texto a ser normalizado
 * @returns Texto normalizado
 */
export const normalizeText = (text: string): string => {
  return text.trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^a-z0-9]/g, "");  // remove caracteres especiais
};

/**
 * Mapeia colunas do CSV para colunas esperadas
 */
export const columnMappings = [
  { name: 'NCM', alternatives: ['ncm', 'codigo_ncm'] },
  { name: 'Nome', alternatives: ['descricao', 'nome', 'produto', 'description', 'desc'] },
  { name: 'Unidade', alternatives: ['unidade', 'un', 'unit', 'medida'] },
  { name: 'Quantidade', alternatives: ['quantidade', 'qtd', 'qty', 'quantity'] },
  { name: 'Preço', alternatives: ['preco', 'price', 'valor', 'unitario', 'preço', 'preço(r$)', 'unitário', 'unit', 'valor'] },
  { name: 'Total', alternatives: ['total', 'total(r$)', 'valor_total', 'subtotal'] }
];

/**
 * Converte string de preço ou quantidade para número
 * @param value String a ser convertida
 * @returns Número ou undefined se inválido
 */
export const parseNumericValue = (value: string): number | undefined => {
  if (!value || value.trim() === '') return undefined;
  
  try {
    // Remover espaços e substituir vírgula por ponto
    let normalized = value.trim()
      .replace(/\s/g, '')  // remover espaços
      .replace(/\./g, '')  // remover pontos de milhar
      .replace(',', '.');  // substituir vírgula decimal por ponto
    
    // Tentar extrair um número, mesmo que a string tenha outros caracteres
    const matches = normalized.match(/(\d+\.?\d*)/);
    if (matches && matches[1]) {
      normalized = matches[1];
    }
    
    // Converter para número
    const numericValue = parseFloat(normalized);
    
    // Se é NaN, retornar 0 em vez de undefined
    return isNaN(numericValue) ? 0 : numericValue;
  } catch (e) {
    // Em caso de erro, retornar 0
    return 0;
  }
};

/**
 * Valida e processa conteúdo CSV
 * @param csvContent Conteúdo CSV em texto
 * @returns Resultado da validação com produtos processados
 */
export const validateAndProcessCsv = (csvContent: string): CsvValidationResult => {
  const result: CsvValidationResult = {
    valid: false,
    products: [],
    errors: [],
    warnings: []
  };
  
  // Verificar se o conteúdo está vazio
  if (!csvContent || csvContent.trim() === '') {
    result.errors.push('O arquivo CSV está vazio');
    return result;
  }
  
  // Dividir texto em linhas removendo linhas vazias
  const lines = csvContent.split('\n').filter(line => line.trim() !== '');
  
  if (lines.length < 2) {
    result.errors.push('O arquivo CSV deve conter um cabeçalho e pelo menos uma linha de dados');
    return result;
  }
  
  // Analisar o cabeçalho
  const header = lines[0].trim().split(/[;,]/);
  const normalizedHeaders = header.map(normalizeText);
  
  // Encontrar a posição de cada coluna
  const columnMapping = columnMappings.map(mapping => {
    // Adicionar a coluna principal às alternativas
    const allOptions = [normalizeText(mapping.name), ...mapping.alternatives.map(normalizeText)];
    
    // Procurar por qualquer uma das alternativas nos cabeçalhos
    const index = normalizedHeaders.findIndex(h => allOptions.some(opt => h.includes(opt)));
    
    return {
      name: mapping.name,
      index
    };
  });
  
  // Verificar se as colunas essenciais estão presentes
  const requiredColumns = ['NCM', 'Nome', 'Preço'];
  const missingColumns = requiredColumns
    .filter(col => columnMapping.find(c => c.name === col)?.index === -1);
  
  if (missingColumns.length > 0) {
    result.errors.push(`Colunas obrigatórias ausentes no CSV: ${missingColumns.join(', ')}`);
    return result;
  }
  
  // Armazenar produtos únicos para evitar duplicações
  const uniqueProducts = new Map<string, CsvProductData>();
  const rows = lines.slice(1);
  
  // Processar cada linha
  rows.forEach((row, rowIndex) => {
    // Dividir a linha em colunas
    const cols = row.trim().split(/[;,]/);
    if (cols.length < 3) {
      // Não mostrar avisos para linhas com poucas colunas
      return;
    }
    
    // Obter índices das colunas
    const ncmIndex = columnMapping.find(c => c.name === 'NCM')?.index ?? -1;
    const nameIndex = columnMapping.find(c => c.name === 'Nome')?.index ?? -1;
    const unitIndex = columnMapping.find(c => c.name === 'Unidade')?.index ?? -1;
    const quantityIndex = columnMapping.find(c => c.name === 'Quantidade')?.index ?? -1;
    const priceIndex = columnMapping.find(c => c.name === 'Preço')?.index ?? -1;
    const totalIndex = columnMapping.find(c => c.name === 'Total')?.index ?? -1;
    
    // Extrair valores
    const ncm = ncmIndex >= 0 && ncmIndex < cols.length ? cols[ncmIndex].trim() : '';
    const name = nameIndex >= 0 && nameIndex < cols.length ? cols[nameIndex].trim() : '';
    const unit = unitIndex >= 0 && unitIndex < cols.length ? 
      cols[unitIndex].trim().substring(0, 50) : 'UN'; // Limitar a 50 caracteres
    
    // Processar quantidade
    let quantity = 0;
    if (quantityIndex >= 0 && quantityIndex < cols.length) {
      quantity = parseNumericValue(cols[quantityIndex]) ?? 0;
      // Não exibir avisos para quantidades inválidas
    }
    
    // Processar preço
    let price = 0;
    if (priceIndex >= 0 && priceIndex < cols.length) {
      price = parseNumericValue(cols[priceIndex]) ?? 0;
      // Não exibir avisos para preços inválidos
    }
    
    // Processar total (opcional)
    let total = price * quantity;
    if (totalIndex >= 0 && totalIndex < cols.length) {
      const parsedTotal = parseNumericValue(cols[totalIndex]);
      if (parsedTotal !== undefined) {
        total = parsedTotal;
      }
    }
    
    // Validar dados essenciais
    if (!name || name.length < 2) {
      // Não mostrar avisos para nomes inválidos
      return;
    }
    
    // Criar código único para o produto
    const productKey = `${ncm}-${name}`.toLowerCase().replace(/\s+/g, '_');
    
    // Código único para o produto
    const generatedCode = `IMP-${ncm.slice(0, 4) || 'XXXX'}-${Date.now().toString(36).slice(-5)}`;
    
    // Adicionar produto ao mapa ou atualizar quantidade se já existir
    if (uniqueProducts.has(productKey)) {
      const existing = uniqueProducts.get(productKey)!;
      
      // Somar quantidades
      const newQuantity = existing.quantity + quantity;
      
      // Usar o maior preço entre os dois
      const newPrice = Math.max(existing.price, price);
      
      uniqueProducts.set(productKey, {
        ...existing,
        quantity: newQuantity,
        price: newPrice,
        total: newQuantity * newPrice
      });
      
      // Não mostrar avisos sobre produtos duplicados
    } else {
      uniqueProducts.set(productKey, {
        ncm,
        name,
        unit,
        quantity,
        price,
        total,
        code: generatedCode
      });
    }
  });
  
  // Converter o mapa em array de produtos
  result.products = Array.from(uniqueProducts.values());
  
  // Verificar se encontramos produtos válidos
  if (result.products.length === 0) {
    result.errors.push('Nenhum produto válido encontrado no arquivo CSV');
  } else {
    // Sempre considerar válido se temos pelo menos um produto
    result.valid = true;
    // Limpar os avisos para não incomodar o usuário
    result.warnings = [];
  }
  
  return result;
};

/**
 * Gera um arquivo CSV de exemplo
 * @returns Conteúdo CSV de exemplo
 */
export const generateSampleCsv = (): string => {
  const header = 'NCM;nome;Unidade;Quantidade;preço(R$);Total(R$)';
  const rows = [
    '73241000; PIA INOX ACO 430 1,20 X 0,53 LISA;UN;9;135;1.215,00',
    '73241000; PIA INOX ESCORREDOR;UN;4;159,99;639,96',
    '90178090; TRENA 19 X 5 MTS. EMBORRACHADA C/IMA;UN;24;10;240',
    '76042920; CANTONEIRA ALUMINIO L PLD. 3/4\'\' 3 MTS.;UN;10;12;120',
    '63079010; MASCARA RESPIRATORIA C/VALVULA AZUL;UN;6;4;24'
  ];
  
  return [header, ...rows].join('\n');
};

export default {
  validateAndProcessCsv,
  normalizeText,
  parseNumericValue,
  generateSampleCsv
}; 