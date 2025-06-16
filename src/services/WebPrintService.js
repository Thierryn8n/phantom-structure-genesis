/**
 * Serviço de Impressão Web
 * Permite impressão direta a partir do navegador para impressoras térmicas
 * Compatível com Tanca TP-650
 */

class WebPrintService {
  constructor() {
    this.isWebPrintSupported = this.checkBrowserSupport();
    this.connection = null;
    this.device = null;
    this.encoder = null;
    this.lastError = null;
  }

  /**
   * Verificar se o navegador suporta impressão direta via Web USB
   * @returns {boolean}
   */
  checkBrowserSupport() {
    return !!(navigator && navigator.usb);
  }

  /**
   * Solicitar conexão com a impressora via USB
   * @returns {Promise<boolean>}
   */
  async requestUSBDevice() {
    if (!this.isWebPrintSupported) {
      this.lastError = 'Navegador não suporta Web USB';
      return false;
    }

    try {
      // Filtros para identificar a impressora Tanca TP-650
      const filters = [
        // Algumas impressoras térmicas podem usar os seguintes IDs
        { vendorId: 0x0483 }, // ID do fabricante Tanca/Outro
        { vendorId: 0x04b8 }, // Epson
        { vendorId: 0x0dd4 }, // Outro ID comum para impressoras térmicas
      ];

      // Solicitar dispositivo via Web USB
      this.device = await navigator.usb.requestDevice({ filters });
      
      if (!this.device) {
        throw new Error('Nenhuma impressora selecionada');
      }

      await this.device.open();
      
      // Configurar o dispositivo
      await this.device.selectConfiguration(1);
      await this.device.claimInterface(0);

      console.log('Impressora conectada via Web USB:', this.device);
      this.lastError = null;
      return true;
    } catch (error) {
      this.lastError = `Erro ao conectar impressora: ${error.message}`;
      console.error(this.lastError, error);
      return false;
    }
  }

  /**
   * Enviar dados ESC/POS para a impressora
   * @param {Uint8Array} data - Dados formatados em ESC/POS
   * @returns {Promise<boolean>}
   */
  async sendData(data) {
    if (!this.device) {
      this.lastError = 'Impressora não conectada';
      return false;
    }

    try {
      // Endpoins para envio de dados podem variar conforme o dispositivo
      const endpointOut = this.device.configuration.interfaces[0].alternate.endpoints.find(
        ep => ep.direction === 'out'
      );

      if (!endpointOut) {
        throw new Error('Endpoint de saída não encontrado');
      }

      await this.device.transferOut(endpointOut.endpointNumber, data);
      return true;
    } catch (error) {
      this.lastError = `Erro ao enviar dados: ${error.message}`;
      console.error(this.lastError, error);
      return false;
    }
  }

  /**
   * Formatar e imprimir um texto simples
   * @param {string} text - Texto a ser impresso
   * @returns {Promise<boolean>}
   */
  async printText(text) {
    if (!this.device) {
      this.lastError = 'Impressora não conectada';
      return false;
    }

    try {
      // Comandos ESC/POS básicos
      const ESC = 0x1B;
      const GS = 0x1D;
      
      // Criar buffer com comandos
      const encoder = new TextEncoder();
      const textBytes = encoder.encode(text);
      
      // Inicializar impressora
      const init = new Uint8Array([ESC, 0x40]);  // ESC @
      
      // Alinhar texto ao centro
      const center = new Uint8Array([ESC, 0x61, 0x01]);  // ESC a 1
      
      // Cortar papel
      const cut = new Uint8Array([GS, 0x56, 0x41, 0x03]);  // GS V A 3
      
      // Combinar todos os comandos
      const data = new Uint8Array([
        ...init,
        ...center,
        ...textBytes,
        ...new Uint8Array([0x0A, 0x0A, 0x0A]),  // 3 linhas em branco
        ...cut
      ]);
      
      // Enviar para a impressora
      return await this.sendData(data);
    } catch (error) {
      this.lastError = `Erro ao imprimir texto: ${error.message}`;
      console.error(this.lastError, error);
      return false;
    }
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
   * Desconectar da impressora
   * @returns {Promise<boolean>}
   */
  async disconnect() {
    if (!this.device) {
      return true;
    }

    try {
      await this.device.releaseInterface(0);
      await this.device.close();
      this.device = null;
      this.lastError = null;
      return true;
    } catch (error) {
      this.lastError = `Erro ao desconectar: ${error.message}`;
      console.error(this.lastError, error);
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
}

// Exportar instância única (singleton)
export default new WebPrintService(); 