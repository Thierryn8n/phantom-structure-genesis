import React, { useState, useEffect } from 'react';
import NetworkPrintService from '../services/NetworkPrintService';

const NetworkPrinterSettings = () => {
  const [printerIP, setPrinterIP] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Carregar o IP salvo no localStorage
    const savedIP = localStorage.getItem('printerIP');
    if (savedIP) {
      setPrinterIP(savedIP);
    }
  }, []);

  const handleSaveIP = async () => {
    // Validar o formato do IP
    const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    
    if (!ipRegex.test(printerIP)) {
      setErrorMessage('Digite um endereço IP válido');
      return;
    }

    setErrorMessage('');
    setStatusMessage('Salvando configuração...');
    
    NetworkPrintService.setPrinterIP(printerIP);
    setStatusMessage('Configuração salva com sucesso!');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleTestConnection = async () => {
    if (!printerIP) {
      setErrorMessage('Insira o endereço IP da impressora');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setStatusMessage('Testando conexão com a impressora...');
    
    try {
      const result = await NetworkPrintService.testConnection();
      
      if (result) {
        setIsConnected(true);
        setStatusMessage('Impressora conectada com sucesso!');
        setTimeout(() => setStatusMessage(''), 3000);
      } else {
        setIsConnected(false);
        setErrorMessage(NetworkPrintService.getLastError() || 'Não foi possível conectar à impressora');
      }
    } catch (error) {
      setIsConnected(false);
      setErrorMessage(`Erro: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestPrint = async () => {
    if (!isConnected) {
      setErrorMessage('A impressora não está conectada ou não foi testada');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setStatusMessage('Enviando teste de impressão...');
    
    try {
      // Texto de teste formatado
      const testText = [
        "=== TESTE DE IMPRESSÃO ===",
        "Impressora Tanca TP-650",
        "",
        "FISCAL FLOW NOTES",
        "Teste de impressão via rede",
        "IP: " + printerIP,
        "",
        "Caracteres especiais:",
        "áéíóúãõâêô",
        "",
        "================================",
        "TESTE CONCLUÍDO COM SUCESSO!",
        ""
      ].join("\n");

      const result = await NetworkPrintService.printText(testText);
      
      if (result) {
        setStatusMessage('Teste de impressão enviado com sucesso!');
        setTimeout(() => setStatusMessage(''), 3000);
      } else {
        setErrorMessage(NetworkPrintService.getLastError() || 'Erro ao enviar teste de impressão');
      }
    } catch (error) {
      setErrorMessage(`Erro: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReceiptTest = async () => {
    if (!isConnected) {
      setErrorMessage('A impressora não está conectada ou não foi testada');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setStatusMessage('Imprimindo cupom de teste...');
    
    // Dados de exemplo para o teste
    const testData = {
      companyName: 'FISCAL FLOW NOTES',
      address: 'Rua Exemplo, 123 - Centro',
      cnpj: '12.345.678/0001-99',
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      items: [
        { qty: 1, name: 'TESTE DE IMPRESSÃO REDE', price: 0.00 },
        { qty: 2, name: 'PRODUTO TESTE', price: 10.50 },
        { qty: 1, name: 'DESCONTO', price: -5.00 }
      ],
      total: 16.00
    };
    
    try {
      const result = await NetworkPrintService.printReceipt(testData);
      
      if (result) {
        setStatusMessage('Cupom de teste enviado com sucesso!');
        setTimeout(() => setStatusMessage(''), 3000);
      } else {
        setErrorMessage(NetworkPrintService.getLastError() || 'Erro ao enviar cupom de teste');
      }
    } catch (error) {
      setErrorMessage(`Erro: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-cascadia mb-6 flex items-center">
        <span className="bg-fiscal-green-500 text-white p-2 rounded-lg mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
          </svg>
        </span>
        Impressora via Rede (Ethernet/WiFi)
      </h2>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {errorMessage}
        </div>
      )}

      {statusMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
          {statusMessage}
        </div>
      )}

      <p className="mb-4 text-gray-700">
        Configure a impressora Tanca TP-650 para impressão via rede. Certifique-se de que a impressora 
        esteja corretamente configurada com um IP fixo ou reservado no DHCP.
      </p>

      <div className="mb-4">
        <label htmlFor="printerIP" className="block text-sm font-medium text-gray-700 mb-1">
          Endereço IP da Impressora
        </label>
        <div className="flex gap-2">
          <input
            id="printerIP"
            type="text"
            placeholder="192.168.0.100"
            value={printerIP}
            onChange={(e) => setPrinterIP(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-fiscal-green-500 focus:border-fiscal-green-500"
          />
          <button
            onClick={handleSaveIP}
            className="px-4 py-2 bg-fiscal-green-500 hover:bg-fiscal-green-600 text-white rounded-lg"
            disabled={isLoading}
          >
            Salvar
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={handleTestConnection}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center"
          disabled={isLoading || !printerIP}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Testar Conexão
        </button>

        <button
          onClick={handleTestPrint}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center"
          disabled={isLoading || !isConnected}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
          </svg>
          Teste Simples
        </button>

        <button
          onClick={handleReceiptTest}
          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg flex items-center"
          disabled={isLoading || !isConnected}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          Teste de Cupom
        </button>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="font-medium text-gray-700 mb-2">Como configurar sua impressora na rede:</h3>
        <ol className="text-sm text-gray-600 list-decimal ml-6 mt-1">
          <li>Conecte a impressora Tanca TP-650 à sua rede via cabo Ethernet</li>
          <li>Use a utility do fabricante para definir um IP fixo ou configure no seu roteador uma reserva de DHCP</li>
          <li>Verifique se o firewall não está bloqueando a porta 9100 (porta padrão de impressão)</li>
          <li>Insira o IP configurado no campo acima e clique em "Salvar"</li>
          <li>Use o botão "Testar Conexão" para verificar a comunicação</li>
        </ol>
        <p className="text-sm text-gray-600 mt-3">
          <strong>Observação:</strong> A impressão via rede no navegador requer um servidor backend intermediário.
          Esta interface simula a impressão que poderia ser implementada com um serviço backend real.
        </p>
      </div>
    </div>
  );
};

export default NetworkPrinterSettings; 