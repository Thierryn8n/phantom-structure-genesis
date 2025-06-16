import React, { useState, useEffect } from 'react';
import WebPrintService from '../services/WebPrintService';

const WebPrinterSettings = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    // Verificar se o navegador suporta WebUSB
    const supported = WebPrintService.checkBrowserSupport();
    setIsSupported(supported);
    
    if (!supported) {
      setErrorMessage('Seu navegador não suporta impressão via WebUSB. Experimente usar o Google Chrome atualizado.');
    }
  }, []);

  const handleConnect = async () => {
    setErrorMessage('');
    setStatusMessage('Solicitando acesso à impressora...');
    
    try {
      const result = await WebPrintService.requestUSBDevice();
      
      if (result) {
        setIsConnected(true);
        setStatusMessage('Impressora conectada com sucesso!');
        setTimeout(() => setStatusMessage(''), 3000);
      } else {
        setErrorMessage(WebPrintService.getLastError() || 'Não foi possível conectar à impressora');
      }
    } catch (error) {
      setErrorMessage(`Erro: ${error.message}`);
    }
  };

  const handleDisconnect = async () => {
    setErrorMessage('');
    setStatusMessage('Desconectando impressora...');
    
    try {
      const result = await WebPrintService.disconnect();
      
      if (result) {
        setIsConnected(false);
        setStatusMessage('Impressora desconectada com sucesso!');
        setTimeout(() => setStatusMessage(''), 3000);
      } else {
        setErrorMessage(WebPrintService.getLastError() || 'Não foi possível desconectar a impressora');
      }
    } catch (error) {
      setErrorMessage(`Erro: ${error.message}`);
    }
  };

  const handleTestPrint = async () => {
    if (!isConnected) {
      setErrorMessage('Impressora não conectada');
      return;
    }

    setErrorMessage('');
    setStatusMessage('Enviando teste de impressão...');
    
    try {
      // Texto de teste formatado
      const testText = [
        "=== TESTE DE IMPRESSÃO ===",
        "Impressora Tanca TP-650",
        "",
        "FISCAL FLOW NOTES",
        "Teste de impressão direta",
        "via navegador usando WebUSB",
        "",
        "Caracteres especiais:",
        "áéíóúãõâêô",
        "",
        "================================",
        "TESTE CONCLUÍDO COM SUCESSO!",
        ""
      ].join("\n");

      const result = await WebPrintService.printText(testText);
      
      if (result) {
        setStatusMessage('Teste de impressão enviado com sucesso!');
        setTimeout(() => setStatusMessage(''), 3000);
      } else {
        setErrorMessage(WebPrintService.getLastError() || 'Erro ao enviar teste de impressão');
      }
    } catch (error) {
      setErrorMessage(`Erro: ${error.message}`);
    }
  };

  const handleReceiptTest = async () => {
    if (!isConnected) {
      setErrorMessage('Impressora não conectada');
      return;
    }

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
        { qty: 1, name: 'TESTE DE IMPRESSÃO WEB', price: 0.00 },
        { qty: 2, name: 'PRODUTO TESTE', price: 10.50 },
        { qty: 1, name: 'DESCONTO', price: -5.00 }
      ],
      total: 16.00
    };
    
    try {
      const result = await WebPrintService.printReceipt(testData);
      
      if (result) {
        setStatusMessage('Cupom de teste enviado com sucesso!');
        setTimeout(() => setStatusMessage(''), 3000);
      } else {
        setErrorMessage(WebPrintService.getLastError() || 'Erro ao enviar cupom de teste');
      }
    } catch (error) {
      setErrorMessage(`Erro: ${error.message}`);
    }
  };

  if (!isSupported) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-cascadia mb-6 flex items-center">
          <span className="bg-fiscal-green-500 text-white p-2 rounded-lg mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
            </svg>
          </span>
          Impressão via Navegador
        </h2>
        
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {errorMessage}
        </div>
        
        <p className="text-gray-700">
          Seu navegador não suporta a impressão direta via WebUSB. Para usar essa funcionalidade, por favor:
        </p>
        
        <ul className="list-disc ml-6 mt-2 text-gray-700">
          <li>Use o Google Chrome versão 61 ou superior</li>
          <li>Verifique se o WebUSB está habilitado nas configurações do navegador</li>
          <li>Em alguns casos, pode ser necessário executar o Chrome com a flag --disable-web-security</li>
        </ul>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-cascadia mb-6 flex items-center">
        <span className="bg-fiscal-green-500 text-white p-2 rounded-lg mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
          </svg>
        </span>
        Impressão via Navegador
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
        Esta funcionalidade permite imprimir diretamente na impressora Tanca TP-650 a partir do navegador, sem necessidade de drivers adicionais.
      </p>

      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={isConnected ? handleDisconnect : handleConnect}
          className={`px-4 py-2 rounded-lg flex items-center ${
            isConnected 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-fiscal-green-500 hover:bg-fiscal-green-600 text-white'
          }`}
          disabled={false}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            {isConnected ? (
              <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
            ) : (
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            )}
          </svg>
          {isConnected ? 'Desconectar Impressora' : 'Conectar Impressora'}
        </button>

        <button
          onClick={handleTestPrint}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center"
          disabled={!isConnected}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
          </svg>
          Teste Simples
        </button>

        <button
          onClick={handleReceiptTest}
          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg flex items-center"
          disabled={!isConnected}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          Teste de Cupom
        </button>
      </div>

      {isConnected && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-medium text-gray-700 mb-2">Impressora Conectada via WebUSB</h3>
          <p className="text-sm text-gray-600">
            <strong>Dicas de uso:</strong>
          </p>
          <ul className="text-sm text-gray-600 list-disc ml-6 mt-1">
            <li>Essa funcionalidade é experimental e funciona melhor no Chrome</li>
            <li>Caso tenha problemas, desconecte e reconecte a impressora fisicamente</li>
            <li>Verifique se a impressora está ligada e com papel</li>
            <li>Se a impressão não sair conforme esperado, ajuste as configurações da impressora</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default WebPrinterSettings; 