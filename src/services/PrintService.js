/**
 * Serviço de Impressão
 * Gerencia a impressão de documentos e cupons
 */

import { getDefaultPrinter, getPrinterById } from '../config/printers';

class PrintServiceClass {
  constructor() {
    this.currentPrinter = getDefaultPrinter(); // Tanca TP-650 como padrão
    this.isConnected = false;
    this.lastError = null;
    this.pendingRequests = [];
    this.subscribers = [];
  }

  /**
   * Conectar à impressora
   * @param {string} printerId - ID da impressora (opcional)
   * @returns {boolean} - Sucesso da conexão
   */
  connect(printerId = null) {
    try {
      if (printerId) {
        const printer = getPrinterById(printerId);
        if (printer) {
          this.currentPrinter = printer;
        } else {
          throw new Error(`Impressora com ID ${printerId} não encontrada`);
        }
      }
      
      console.log(`Conectando à impressora ${this.currentPrinter.name}...`);
      // Lógica de conexão seria implementada aqui
      this.isConnected = true;
      this.lastError = null;
      return true;
    } catch (error) {
      this.lastError = error.message;
      console.error(`Erro ao conectar à impressora: ${error.message}`);
      return false;
    }
  }

  /**
   * Desconectar da impressora
   */
  disconnect() {
    try {
      console.log(`Desconectando da impressora ${this.currentPrinter.name}...`);
      // Lógica de desconexão seria implementada aqui
      this.isConnected = false;
      this.lastError = null;
      return true;
    } catch (error) {
      this.lastError = error.message;
      console.error(`Erro ao desconectar da impressora: ${error.message}`);
      return false;
    }
  }

  /**
   * Verificar se a impressora está conectada
   * @returns {boolean}
   */
  isReady() {
    return this.isConnected;
  }

  /**
   * Imprimir texto
   * @param {string} text - Texto a ser impresso
   * @param {Object} options - Opções de impressão
   * @returns {boolean} - Sucesso da impressão
   */
  printText(text, options = {}) {
    if (!this.isConnected) {
      this.lastError = 'Impressora não conectada';
      return false;
    }

    try {
      console.log(`Imprimindo texto na impressora ${this.currentPrinter.name}...`);
      console.log(`Texto: ${text}`);
      
      // Configurações padrão
      const defaultOptions = {
        align: 'left',
        font: 'normal',
        cut: true,
        feed: 3
      };
      
      // Mesclar opções
      const finalOptions = { ...defaultOptions, ...options };
      
      // Simulação de impressão
      console.log(`Opções: ${JSON.stringify(finalOptions)}`);
      
      if (finalOptions.cut && this.currentPrinter.commands.cut) {
        console.log('Cortando papel...');
      }
      
      this.lastError = null;
      return true;
    } catch (error) {
      this.lastError = error.message;
      console.error(`Erro ao imprimir: ${error.message}`);
      return false;
    }
  }

  /**
   * Imprimir cupom
   * @param {Object} data - Dados do cupom
   * @returns {boolean} - Sucesso da impressão
   */
  printReceipt(data) {
    if (!this.isConnected) {
      this.lastError = 'Impressora não conectada';
      return false;
    }

    try {
      console.log(`Imprimindo cupom na impressora ${this.currentPrinter.name}...`);
      
      // Exemplo de formatação de cupom
      let receiptText = '';
      
      // Cabeçalho
      receiptText += `${data.companyName}\n`;
      receiptText += `${data.address}\n`;
      receiptText += `CNPJ: ${data.cnpj}\n`;
      receiptText += `Data: ${data.date} Hora: ${data.time}\n`;
      receiptText += `-------------------------------\n`;
      
      // Itens
      receiptText += `CUPOM NÃO FISCAL\n`;
      data.items.forEach(item => {
        receiptText += `${item.qty}x ${item.name}\n`;
        receiptText += `${item.price.toFixed(2)}\n`;
      });
      
      // Totais
      receiptText += `-------------------------------\n`;
      receiptText += `TOTAL: R$ ${data.total.toFixed(2)}\n`;
      
      // Rodapé
      receiptText += `-------------------------------\n`;
      receiptText += `Obrigado e volte sempre!\n`;
      
      // Imprimir o texto formatado
      return this.printText(receiptText, {
        align: 'center',
        cut: true,
        feed: 5
      });
    } catch (error) {
      this.lastError = error.message;
      console.error(`Erro ao imprimir cupom: ${error.message}`);
      return false;
    }
  }

  /**
   * Obter o último erro
   * @returns {string|null}
   */
  getLastError() {
    return this.lastError;
  }

  /**
   * Obter a impressora atual
   * @returns {Object}
   */
  getCurrentPrinter() {
    return this.currentPrinter;
  }

  /**
   * Verificar se a gaveta de dinheiro está disponível
   * @returns {boolean}
   */
  hasCashDrawer() {
    return !!this.currentPrinter.commands.openDrawer;
  }

  /**
   * Abrir gaveta de dinheiro
   * @returns {boolean}
   */
  openCashDrawer() {
    if (!this.isConnected) {
      this.lastError = 'Impressora não conectada';
      return false;
    }

    if (!this.hasCashDrawer()) {
      this.lastError = 'Gaveta de dinheiro não suportada por esta impressora';
      return false;
    }

    try {
      console.log('Abrindo gaveta de dinheiro...');
      // A lógica de abertura da gaveta seria implementada aqui
      return true;
    } catch (error) {
      this.lastError = error.message;
      console.error(`Erro ao abrir gaveta: ${error.message}`);
      return false;
    }
  }

  /**
   * Obter solicitações de impressão pendentes
   * @returns {Promise<Array>} - Lista de solicitações pendentes
   */
  async getPendingPrintRequests() {
    try {
      // Aqui você implementaria a lógica para buscar solicitações pendentes do banco de dados ou API
      // Por enquanto, retornaremos os dados do exemplo para teste
      console.log('Buscando solicitações de impressão pendentes...');
      
      // Simular busca com delay
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(this.pendingRequests);
        }, 300);
      });
    } catch (error) {
      console.error('Erro ao buscar solicitações pendentes:', error);
      throw error;
    }
  }

  /**
   * Adicionar uma nova solicitação de impressão
   * @param {Object} noteData - Dados da nota fiscal/orçamento para impressão
   * @returns {Promise<Object>} - Solicitação de impressão criada
   */
  async addPrintRequest(noteData) {
    try {
      const newRequest = {
        id: `req_${Date.now()}`,
        note_id: noteData.noteNumber || 'SN',
        note_data: noteData,
        created_at: new Date().toISOString(),
        status: 'pending'
      };
      
      this.pendingRequests.push(newRequest);
      
      // Notificar subscribers
      this.notifySubscribers(newRequest);
      
      return newRequest;
    } catch (error) {
      console.error('Erro ao adicionar solicitação de impressão:', error);
      throw error;
    }
  }

  /**
   * Marcar solicitação como impressa
   * @param {string} requestId - ID da solicitação
   * @returns {Promise<boolean>} - Sucesso da operação
   */
  async markAsPrinted(requestId) {
    try {
      const index = this.pendingRequests.findIndex(req => req.id === requestId);
      if (index !== -1) {
        this.pendingRequests[index].status = 'printed';
        this.pendingRequests[index].printed_at = new Date().toISOString();
        // Em produção, você atualizaria no banco de dados ou na API
        
        // Remover da lista de pendentes
        this.pendingRequests = this.pendingRequests.filter(req => req.id !== requestId);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao marcar solicitação como impressa:', error);
      throw error;
    }
  }

  /**
   * Marcar solicitação com erro
   * @param {string} requestId - ID da solicitação
   * @param {string} errorMessage - Mensagem de erro
   * @returns {Promise<boolean>} - Sucesso da operação
   */
  async markAsError(requestId, errorMessage) {
    try {
      const index = this.pendingRequests.findIndex(req => req.id === requestId);
      if (index !== -1) {
        this.pendingRequests[index].status = 'error';
        this.pendingRequests[index].error_message = errorMessage;
        this.pendingRequests[index].error_at = new Date().toISOString();
        // Em produção, você atualizaria no banco de dados ou na API
        
        // Remover da lista de pendentes
        this.pendingRequests = this.pendingRequests.filter(req => req.id !== requestId);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao marcar solicitação com erro:', error);
      throw error;
    }
  }

  /**
   * Assinar para receber novas solicitações de impressão
   * @param {Function} callback - Função de callback para ser chamada quando houver nova solicitação
   * @returns {Object} - Objeto de inscrição com método para cancelar
   */
  subscribeToNewPrintRequests(callback) {
    if (typeof callback !== 'function') {
      throw new Error('O callback deve ser uma função');
    }
    
    const id = Date.now().toString();
    this.subscribers.push({
      id,
      callback
    });
    
    return {
      unsubscribe: () => {
        this.subscribers = this.subscribers.filter(sub => sub.id !== id);
      }
    };
  }

  /**
   * Notificar inscritos sobre uma nova solicitação
   * @param {Object} request - Solicitação de impressão
   * @private
   */
  notifySubscribers(request) {
    this.subscribers.forEach(sub => {
      try {
        sub.callback(request);
      } catch (error) {
        console.error('Erro ao notificar subscriber:', error);
      }
    });
  }
}

// Criar instância única (singleton)
const PrintService = new PrintServiceClass();

// Exportar como default export
export default PrintService;

// Exportar também como named export para compatibilidade com importações existentes
export { PrintService };

// Definir tipo PrintRequest para exportação (usado em outros arquivos)
export class PrintRequest {
  constructor(data = {}) {
    this.content = data.content || '';
    this.options = data.options || {};
    this.timestamp = new Date();
    this.completed = false;
    this.error = null;
    
    // Campos adicionais para compatibilidade com PrintMonitor
    this.id = data.id || null;
    this.note_id = data.note_id || null;
    this.note_data = data.note_data || {};
    this.created_at = data.created_at || new Date().toISOString();
    this.status = data.status || 'pending';
  }

  markAsCompleted() {
    this.completed = true;
    return this;
  }

  setError(error) {
    this.error = error;
    return this;
  }
} 