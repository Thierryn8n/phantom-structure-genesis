import React, { useState } from 'react';
import PrinterSettings from './PrinterSettings';
import WebPrinterSettings from './WebPrinterSettings';
import NetworkPrinterSettings from './NetworkPrinterSettings';
import AddPrinterForm from './AddPrinterForm';

const PrinterTabs = () => {
  const [activeTab, setActiveTab] = useState('traditional');

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-4 border-b border-gray-200">
        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
          <li className="mr-2">
            <button 
              className={`inline-block p-4 rounded-t-lg ${
                activeTab === 'traditional' 
                  ? 'text-fiscal-green-600 border-b-2 border-fiscal-green-600' 
                  : 'text-gray-500 hover:text-gray-600 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('traditional')}
            >
              Configuração Tradicional
            </button>
          </li>
          <li className="mr-2">
            <button 
              className={`inline-block p-4 rounded-t-lg ${
                activeTab === 'webusb' 
                  ? 'text-fiscal-green-600 border-b-2 border-fiscal-green-600' 
                  : 'text-gray-500 hover:text-gray-600 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('webusb')}
            >
              Impressão via Navegador
            </button>
          </li>
          <li className="mr-2">
            <button 
              className={`inline-block p-4 rounded-t-lg ${
                activeTab === 'network' 
                  ? 'text-fiscal-green-600 border-b-2 border-fiscal-green-600' 
                  : 'text-gray-500 hover:text-gray-600 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('network')}
            >
              Impressão via Rede
            </button>
          </li>
          <li className="mr-2">
            <button 
              className={`inline-block p-4 rounded-t-lg ${
                activeTab === 'add' 
                  ? 'text-fiscal-green-600 border-b-2 border-fiscal-green-600' 
                  : 'text-gray-500 hover:text-gray-600 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('add')}
            >
              Adicionar Impressora
            </button>
          </li>
        </ul>
      </div>
      
      <div className="tab-content mt-6">
        {activeTab === 'traditional' && <PrinterSettings />}
        {activeTab === 'webusb' && <WebPrinterSettings />}
        {activeTab === 'network' && <NetworkPrinterSettings />}
        {activeTab === 'add' && <AddPrinterForm />}
      </div>
      
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="font-medium text-gray-700 mb-2">Sobre a Impressora Tanca TP-650</h3>
        <p className="text-sm text-gray-600">
          A Tanca TP-650 é uma impressora térmica de alta velocidade (250 mm/s) que suporta múltiplas 
          interfaces de conexão (USB, Serial e Ethernet). Ela oferece excelente qualidade de impressão, 
          sistema de carga de papel simplificada (Easy Load) e suporta comandos ESC/POS para formatação 
          avançada de textos, impressão de códigos de barras e QR codes.
        </p>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col items-center">
            <div className="mb-2 text-fiscal-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h4 className="font-medium">Alta Durabilidade</h4>
            <p className="text-xs text-center text-gray-600">
              Cabeça de impressão com vida útil de 100km e guilhotina resistente para 1 milhão de cortes
            </p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="mb-2 text-fiscal-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h4 className="font-medium">Velocidade</h4>
            <p className="text-xs text-center text-gray-600">
              Impressão ultra-rápida de 250mm/s para atendimentos ágeis e sem filas
            </p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="mb-2 text-fiscal-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <h4 className="font-medium">Compatibilidade</h4>
            <p className="text-xs text-center text-gray-600">
              Suporte a Windows e Linux, compatível com protocolo ESC/POS para fácil integração
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrinterTabs; 