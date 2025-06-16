/**
 * Serviço de Impressão via Rede
 * Permite impressão na Tanca TP-650 via porta 9100
 */

class NetworkPrintService {
  constructor() {
    this.printerIP = localStorage.getItem('printerIP') || '';
    this.printerPort = 9100;  // Porta padrão para impressoras ESC/POS
    this.lastError = null;
    this.isConnected = false;
  }

  /**
   * Definir o IP da impressora
   * @param {string} ip - Endereço IP da impressora
   */
  setPrinterIP(ip) {
    this.printerIP = ip;
    localStorage.setItem('printerIP', ip);
  }

  /**
   * Verificar se a impressora está online (ping)
   * @returns {Promise<boolean>}
   */
  async testConnection() {
    if (!this.printerIP) {
      this.lastError = 'Endereço IP da impressora não configurado';
      return false;
    }

    try {
      // Usamos fetch para testar a conexão, mas infelizmente não podemos fazer ping diretamente
      // Esta é apenas uma verificação básica se o dispositivo está online
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`http://${this.printerIP}/`, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      this.isConnected = true;
      return true;
    } catch (error) {
      // Timeout ou erro de conexão
      this.lastError = `Não foi possível conectar à impressora no IP ${this.printerIP}`;
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Enviar dados para a impressora via socket WebSocket
   * @param {string} data - Texto e comandos a serem enviados
   * @returns {Promise<boolean>}
   */
  async sendData(data) {
    if (!this.printerIP) {
      this.lastError = 'Endereço IP da impressora não configurado';
      return false;
    }

    // Infelizmente, não é possível enviar dados diretamente para a porta 9100 usando JavaScript no browser
    // devido a restrições de segurança. Seria necessário um servidor backend para isso.
    this.lastError = 'Impressão direta via rede requer um servidor backend. ' +
      'Utilize a função printViaBackend() ou o serviço WebPrintService para impressão direta.';
    return false;
  }

  /**
   * Imprimir via backend
   * @param {string} text - Texto a ser impresso
   * @param {Object} options - Opções de impressão
   * @returns {Promise<boolean>}
   */
  async printViaBackend(text, options = {}) {
    if (!this.printerIP) {
      this.lastError = 'Endereço IP da impressora não configurado';
      return false;
    }

    try {
      // Esta função simula uma chamada para um backend que faria a impressão
      // Na implementação real, isso chamaria um endpoint da API
      console.log(`Solicitando impressão via backend para ${this.printerIP}:${this.printerPort}`);
      console.log('Texto:', text);
      console.log('Opções:', options);
      
      // Simula chamada para API
      const response = await this.simulateApiCall(text, options);
      
      if (response.success) {
        return true;
      } else {
        this.lastError = response.error || 'Erro ao imprimir';
        return false;
      }
    } catch (error) {
      this.lastError = `Erro na comunicação com o backend: ${error.message}`;
      return false;
    }
  }

  /**
   * Simula uma chamada de API para o backend
   * @private
   * @param {string} text - Texto a ser impresso
   * @param {Object} options - Opções de impressão
   * @returns {Promise<Object>}
   */
  async simulateApiCall(text, options) {
    // Em uma implementação real, isso seria substituído por fetch() ou axios.post()
    // para um endpoint real da API do backend
    return new Promise(resolve => {
      setTimeout(() => {
        // Simula uma resposta bem-sucedida
        resolve({
          success: true,
          message: 'Impressão enviada com sucesso'
        });
      }, 1000);
    });
  }

  /**
   * Envia comandos formatados para impressão ESC/POS
   * @param {string} text - Texto a ser impresso
   * @returns {Promise<boolean>}
   */
  async printText(text) {
    return await this.printViaBackend(text);
  }

  /**
   * Imprimir cupom formatado
   * @param {Object} data - Dados do cupom
   * @returns {Promise<boolean>}
   */
  async printReceipt(data) {
    // Formatar o texto do cupom
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
    
    // Imprimir
    return await this.printText(receiptText);
  }

  /**
   * Obter o último erro
   * @returns {string|null}
   */
  getLastError() {
    return this.lastError;
  }
}

// Exportar instância única (singleton)
export default new NetworkPrintService(); 