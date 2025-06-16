import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Printer, 
  Download, 
  Save, 
  Copy,
  User,
  CreditCard,
  Plus,
  Trash2,
  Upload,
  Truck,
  Briefcase
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { v4 as uuidv4 } from 'uuid';

import {
  loadSettings as loadSupabaseSettings,
  saveSettings as saveSupabaseSettings,
  uploadCompanyLogo as uploadSupabaseCompanyLogo,
  removeCompanyLogo as removeSupabaseCompanyLogo,
  UserSettings as SupabaseUserSettings,
  CompanyData as SupabaseCompanyData,
  InstallmentFee as SupabaseInstallmentFee,
  DeliverySettings as SupabaseDeliverySettings,
  DeliveryRadius as SupabaseDeliveryRadius,
  PrinterSettings as SupabasePrinterSettings
} from '@/lib/supabaseSettings';

// Local interface for installment fees (with local ID for UI management)
interface LocalInstallmentFee {
  id: string;
  installments: number;
  fee: number;
}

// Local interface for company data
interface LocalCompanyData {
  name: string;
  cnpj: string;
  address: string;
  neighborhood?: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  logo_url?: string;
  logo_path?: string;
}

// Local interface for delivery radiuses
interface LocalDeliveryRadius {
  id: string;
  radius: number;
  price: number;
  color: string;
}

const SettingsNew = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");

  // Installment Fees State
  const [installmentFees, setInstallmentFees] = useState<LocalInstallmentFee[]>([]);
  const [newInstallment, setNewInstallment] = useState<number>(2);
  const [newFee, setNewFee] = useState<number>(0);
  
  // Company Data State
  const [companyData, setCompanyData] = useState<LocalCompanyData>({
    name: '',
    cnpj: '',
    address: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: ''
  });

  // Delivery Radiuses State
  const [deliveryRadiuses, setDeliveryRadiuses] = useState<LocalDeliveryRadius[]>([]);
  const [newRadius, setNewRadius] = useState<number>(2);
  const [newPrice, setNewPrice] = useState<number>(5);
  const [selectedColor, setSelectedColor] = useState<string>('#FF9800');

  // --- Se necessário, carregue dados quando iniciar ---
  useEffect(() => {
    if (user) {
      // Aqui você pode carregar dados do Supabase
    }
  }, [user]);
  
  // --- Save Settings ---
  const handleSaveSettings = async () => {
    // Implemente a lógica para salvar configurações aqui
    toast({ title: "Configurações salvas", description: "Suas configurações foram salvas com sucesso" });
  };

  // FUNÇÃO SEGURA: Adicionar Taxas de Parcelamento (sem refresh)
  const handleAddInstallment = (e: React.MouseEvent) => {
    // Prevenção agressiva de eventos
    e.preventDefault(); 
    e.stopPropagation();
    
    if (newInstallment < 2) return;
    
    // Adiciona a taxa na lista
    const newFeeItem = { 
      id: uuidv4(), 
      installments: newInstallment, 
      fee: newFee 
    };
    
    setInstallmentFees(prev => [...prev, newFeeItem]);
    setNewInstallment(2);
    setNewFee(0);
    
    toast({ 
      title: 'Taxa adicionada',
      description: `Taxa de ${newFee}% para ${newInstallment}x adicionada.`
    });
    
    return false;
  };

  // FUNÇÃO SEGURA: Remover taxa
  const handleRemoveFee = (id: string) => {
    setInstallmentFees(prev => prev.filter(fee => fee.id !== id));
  };

  // FUNÇÃO SEGURA: Adicionar Raio de Entrega (sem refresh)
  const handleAddRadius = (e: React.MouseEvent) => {
    // Prevenção agressiva de eventos
    e.preventDefault();
    e.stopPropagation();
    
    if (newRadius <= 0) return;
    
    // Adiciona o raio na lista
    const newRadiusItem = {
      id: uuidv4(),
      radius: newRadius,
      price: newPrice,
      color: selectedColor
    };
    
    setDeliveryRadiuses(prev => [...prev, newRadiusItem]);
    setNewRadius(2);
    setNewPrice(5);
    
    toast({
      title: 'Raio adicionado',
      description: `Raio de ${newRadius}km adicionado com valor R$${newPrice}`
    });
    
    return false;
  };

  // FUNÇÃO SEGURA: Remover raio
  const handleRemoveRadius = (id: string) => {
    setDeliveryRadiuses(prev => prev.filter(radius => radius.id !== id));
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2UyZThmMCIgb3BhY2l0eT0iMC4zIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]">
        <div className="space-y-6 pb-10 max-w-3xl mx-auto">
          {/* Cabeçalho */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold flex items-center">
                <SettingsIcon size={28} className="mr-3 text-green-600" />
                Configurações Melhoradas
              </h1>
              <Button 
                type="button"
                onClick={handleSaveSettings} 
                className="bg-green-600 hover:bg-green-700"
              >
                <Save size={18} className="mr-2" />
                Salvar Configurações
              </Button>
            </div>
          </div>
          
          {/* Dados da Empresa */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold flex items-center">
                <Briefcase size={20} className="mr-3 text-green-600" />
                Dados da Empresa
              </h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa</label>
                  <input
                    type="text"
                    value={companyData.name}
                    onChange={(e) => setCompanyData({...companyData, name: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border-2 border-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                  <input
                    type="text"
                    value={companyData.cnpj}
                    onChange={(e) => setCompanyData({...companyData, cnpj: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border-2 border-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                  <input
                    type="text"
                    value={companyData.zipCode}
                    onChange={(e) => setCompanyData({...companyData, zipCode: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border-2 border-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                  <input
                    type="text"
                    value={companyData.address}
                    onChange={(e) => setCompanyData({...companyData, address: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border-2 border-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={companyData.city}
                    onChange={(e) => setCompanyData({...companyData, city: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border-2 border-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <input
                    type="text"
                    value={companyData.state}
                    onChange={(e) => setCompanyData({...companyData, state: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border-2 border-gray-300"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Taxas de Parcelamento */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold flex items-center">
                <CreditCard size={20} className="mr-3 text-green-600" />
                Taxas de Parcelamento
              </h2>
            </div>
            <div className="p-4 space-y-4">
              {/* Lista de taxas existentes */}
              {installmentFees.length === 0 ? (
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Nenhuma taxa configurada.</p>
                </div>
              ) : (
                installmentFees.map(fee => (
                  <div key={fee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span>{fee.installments}x: {fee.fee}%</span>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveFee(fee.id);
                      }} 
      <div className="space-y-6 pb-10 max-w-3xl mx-auto">
        {/* Cabeçalho */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold flex items-center">
              <SettingsIcon size={28} className="mr-3 text-green-600" />
              Configurações Melhoradas
            </h1>
            <Button 
              type="button"
              onClick={handleSaveSettings} 
              className="bg-green-600 hover:bg-green-700"
            >
              <Save size={18} className="mr-2" />
              Salvar Configurações
            </Button>
          </div>
        </div>
        
        {/* Dados da Empresa */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold flex items-center">
              <Briefcase size={20} className="mr-3 text-green-600" />
              Dados da Empresa
            </h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa</label>
                <input
                  type="text"
                  value={companyData.name}
                  onChange={(e) => setCompanyData({...companyData, name: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                <input
                  type="text"
                  value={companyData.cnpj}
                  onChange={(e) => setCompanyData({...companyData, cnpj: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                <input
                  type="text"
                  value={companyData.zipCode}
                  onChange={(e) => setCompanyData({...companyData, zipCode: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                <input
                  type="text"
                  value={companyData.address}
                  onChange={(e) => setCompanyData({...companyData, address: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                <input
                  type="text"
                  value={companyData.city}
                  onChange={(e) => setCompanyData({...companyData, city: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <input
                  type="text"
                  value={companyData.state}
                  onChange={(e) => setCompanyData({...companyData, state: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-300"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Taxas de Parcelamento */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold flex items-center">
              <CreditCard size={20} className="mr-3 text-green-600" />
              Taxas de Parcelamento
            </h2>
          </div>
          <div className="p-4 space-y-4">
            {/* Lista de taxas existentes */}
            {installmentFees.length === 0 ? (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Nenhuma taxa configurada.</p>
              </div>
            ) : (
              installmentFees.map(fee => (
                <div key={fee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span>{fee.installments}x: {fee.fee}%</span>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveFee(fee.id);
                    }} 
                    className="text-gray-500 hover:text-red-600 p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
            
            {/* Formulário para adicionar/atualizar taxa */}
            <div className="pt-4 space-y-3 border-t border-gray-200">
              <p className="text-sm font-medium">Adicionar/Atualizar Taxa</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Parcelas</label>
                  <input
                    type="number"
                    value={newInstallment}
                    onChange={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setNewInstallment(parseInt(e.target.value) || 2);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                    min="2"
                    className="w-full px-3 py-2 rounded-lg border-2 border-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Taxa (%)</label>
                  <input
                    type="number"
                    value={newFee}
                    onChange={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setNewFee(parseFloat(e.target.value) || 0);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                    min="0"
                    step="0.1"
                    className="w-full px-3 py-2 rounded-lg border-2 border-gray-300"
                  />
                </div>
              </div>
              <span 
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddInstallment(e);
                }}
                className="w-full flex items-center justify-center bg-white border-2 border-green-500 text-green-700 font-medium py-2 rounded-xl cursor-pointer"
              >
                <Plus size={18} className="mr-1.5" /> 
                Adicionar/Atualizar Taxa
              </span>
            </div>
          </div>
        </div>
        
        {/* Configurações de Entrega */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold flex items-center">
              <Truck size={20} className="mr-3 text-green-600" />
              Configurações de Entrega
            </h2>
          </div>
          <div className="p-4 space-y-4">
            {/* Lista de raios existentes */}
            {deliveryRadiuses.length === 0 ? (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Nenhum raio de entrega configurado.</p>
              </div>
            ) : (
              deliveryRadiuses.map(radius => (
                <div key={radius.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span style={{ backgroundColor: radius.color }} className="w-3 h-3 rounded-full mr-2"></span>
                    <span>{radius.radius}km: R${radius.price.toFixed(2)}</span>
                  </div>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveRadius(radius.id);
                    }}
                    className="text-gray-500 hover:text-red-600 p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
            
            {/* Formulário para adicionar/atualizar raio */}
            <div className="pt-4 space-y-3 border-t border-gray-200">
              <p className="text-sm font-medium">Adicionar/Atualizar Raio</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Raio (km)</label>
                  <input
                    type="number"
                    value={newRadius}
                    onChange={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setNewRadius(parseInt(e.target.value) || 1);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                    min="1"
                    className="w-full px-3 py-2 rounded-lg border-2 border-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Preço (R$)</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setNewPrice(parseFloat(e.target.value) || 0);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 rounded-lg border-2 border-gray-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cor do Raio</label>
                <input 
                  type="color" 
                  value={selectedColor} 
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-full h-10 p-1 border-2 border-gray-300 rounded-lg"
                />
              </div>
              <span 
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddRadius(e);
                }}
                className="w-full flex items-center justify-center bg-white border-2 border-green-500 text-green-700 font-medium py-2 rounded-xl cursor-pointer"
              >
                <Plus size={18} className="mr-1.5" /> 
                Adicionar/Atualizar Raio
              </span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsNew;
