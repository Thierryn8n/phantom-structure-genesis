import React, { useState, useEffect } from 'react';
import printers, { getDefaultPrinter } from '../config/printers';
import PrintService from '../services/PrintService';

const PrinterSettings = () => {
  const [selectedPrinter, setSelectedPrinter] = useState(getDefaultPrinter().id);
  const [isConnected, setIsConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [testPrintStatus, setTestPrintStatus] = useState('');

  useEffect(() => {
    // Verificar estado inicial da conexão
    setIsConnected(PrintService.isReady());
  }, []);

  const handlePrinterChange = (e) => {
    setSelectedPrinter(e.target.value);
  };

  const handleConnect = () => {
    if (isConnected) {
      // Desconectar
      if (PrintService.disconnect()) {
        setIsConnected(false);
        setErrorMessage('');
      } else {
        setErrorMessage(PrintService.getLastError() || 'Erro ao desconectar da impressora');
      }
    } else {
      // Conectar
      if (PrintService.connect(selectedPrinter)) {
        setIsConnected(true);
        setErrorMessage('');
      } else {
        setErrorMessage(PrintService.getLastError() || 'Erro ao conectar à impressora');
      }
    }
  };

  const handleTestPrint = () => {
    if (!isConnected) {
      setErrorMessage('Impressora não conectada');
      return;
    }

    setTestPrintStatus('Imprimindo...');
    
    // Dados de exemplo para o teste
    const testData = {
      companyName: 'FISCAL FLOW NOTES',
      address: 'Rua Exemplo, 123 - Centro',
      cnpj: '12.345.678/0001-99',
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      items: [
        { qty: 1, name: 'TESTE DE IMPRESSAO', price: 0.00 }
      ],
      total: 0.00
    };
    
    if (PrintService.printReceipt(testData)) {
      setTestPrintStatus('Teste de impressão enviado com sucesso!');
      setTimeout(() => setTestPrintStatus(''), 3000);
    } else {
      setTestPrintStatus('');
      setErrorMessage(PrintService.getLastError() || 'Erro ao enviar teste de impressão');
    }
  };

  const handleOpenDrawer = () => {
    if (!isConnected) {
      setErrorMessage('Impressora não conectada');
      return;
    }

    if (!PrintService.hasCashDrawer()) {
      setErrorMessage('Esta impressora não suporta gaveta de dinheiro');
      return;
    }

    if (PrintService.openCashDrawer()) {
      setErrorMessage('');
    } else {
      setErrorMessage(PrintService.getLastError() || 'Erro ao abrir gaveta de dinheiro');
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
        Configurações de Impressora
      </h2>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {errorMessage}
        </div>
      )}

      {testPrintStatus && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
          {testPrintStatus}
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="printer" className="block text-sm font-medium text-gray-700 mb-1">
          Selecione a Impressora
        </label>
        <select
          id="printer"
          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-fiscal-green-500 focus:border-fiscal-green-500"
          value={selectedPrinter}
          onChange={handlePrinterChange}
          disabled={isConnected}
        >
          {printers.map(printer => (
            <option key={printer.id} value={printer.id}>
              {printer.name} ({printer.model})
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleConnect}
          className={`px-4 py-2 rounded-lg flex items-center ${
            isConnected 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-fiscal-green-500 hover:bg-fiscal-green-600 text-white'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            {isConnected ? (
              <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
            ) : (
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            )}
          </svg>
          {isConnected ? 'Desconectar' : 'Conectar'}
        </button>

        <button
          onClick={handleTestPrint}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center"
          disabled={!isConnected}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
          </svg>
          Teste de Impressão
        </button>

        <button
          onClick={handleOpenDrawer}
          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg flex items-center"
          disabled={!isConnected}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
            <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
          </svg>
          Abrir Gaveta
        </button>
      </div>

      {isConnected && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-medium text-gray-700 mb-2">Impressora Conectada:</h3>
          <p className="text-sm text-gray-600">
            <strong>Modelo:</strong> {PrintService.getCurrentPrinter().brand} {PrintService.getCurrentPrinter().model}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Tipo:</strong> {PrintService.getCurrentPrinter().type === 'thermal' ? 'Térmica' : 'Jato de Tinta'}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Largura do Papel:</strong> {PrintService.getCurrentPrinter().paperWidth}mm
          </p>
          <p className="text-sm text-gray-600">
            <strong>Gaveta:</strong> {PrintService.hasCashDrawer() ? 'Disponível' : 'Não disponível'}
          </p>
        </div>
      )}
    </div>
  );
};

export default PrinterSettings; 