import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { SettingsService } from '@/services/settings.service';
import { UserSettings, CompanyData, InstallmentFee, DeliveryRadius, PrinterSettings } from '@/types/settings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlusCircle, Trash2, Save, Building, CreditCard, MapPin, Printer, Info } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const defaultSettings: UserSettings = {
  company_data: {
    name: '',
    cnpj: '',
    address: '',
    phone: '',
    email: '',
    logo: ''
  },
  installment_fees: [],
  delivery_settings: {
    delivery_radii: [],
    default_delivery_fee: 0
  },
  printer_settings: {
    default_printer: '',
    auto_print: false,
  },
};

export default function Settings() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const userSettings = await SettingsService.getUserSettings();
        if (userSettings) {
          setSettings(userSettings);
          if (userSettings.company_data.logo) {
            setLogoPreview(userSettings.company_data.logo);
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        toast({
          title: "Erro ao carregar configurações",
          description: "Não foi possível carregar suas configurações. Tente novamente mais tarde.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      let updatedSettings = { ...settings };

      if (logoFile) {
        const logoUrl = await SettingsService.uploadCompanyLogo(logoFile);
        if (logoUrl) {
          updatedSettings.company_data.logo = logoUrl;
        } else {
          toast({
            title: "Erro no Upload",
            description: "Não foi possível fazer upload do logo. Tente um arquivo menor ou formato diferente.",
            variant: "destructive",
          });
        }
      }

      const existingSettings = await SettingsService.getUserSettings();
      let result;
      if (existingSettings && existingSettings.id) {
        result = await SettingsService.updateUserSettings(updatedSettings);
      } else {
        result = await SettingsService.createUserSettings(updatedSettings);
      }

      if (result) {
        setSettings(result);
        toast({
          title: "Configurações salvas",
          description: "Suas configurações foram salvas com sucesso.",
        });
      } else {
         toast({
          title: "Erro ao salvar",
          description: "Não foi possível salvar suas configurações. Verifique os dados e tente novamente.",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: "Erro Crítico ao Salvar",
        description: "Ocorreu um erro inesperado. Contate o suporte.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          title: "Arquivo Muito Grande",
          description: "O logo deve ter no máximo 2MB.",
          variant: "destructive",
        });
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addInstallmentFee = () => {
    setSettings(prev => ({
      ...prev,
      installment_fees: [
        ...prev.installment_fees,
        { installments: 2, fee: 0 }
      ]
    }));
  };

  const updateInstallmentFee = (index: number, field: keyof InstallmentFee, value: string | number) => {
    const parsedValue = typeof value === 'string' ? (field === 'fee' ? parseFloat(value) : parseInt(value)) : value;
    const newFees = [...settings.installment_fees];
    newFees[index] = { ...newFees[index], [field]: parsedValue };
    setSettings({ ...settings, installment_fees: newFees });
  };

  const removeInstallmentFee = (index: number) => {
    const newFees = settings.installment_fees.filter((_, i) => i !== index);
    setSettings({ ...settings, installment_fees: newFees });
  };

  const addDeliveryRadius = () => {
    setSettings(prev => ({
      ...prev,
      delivery_settings: {
        ...prev.delivery_settings,
        delivery_radii: [
          ...prev.delivery_settings.delivery_radii,
          { radius: 0, fee: 0 }
        ]
      }
    }));
  };

  const updateDeliveryRadius = (index: number, field: keyof DeliveryRadius, value: string | number) => {
    const parsedValue = typeof value === 'string' ? parseFloat(value) : value;
    const newRadii = [...settings.delivery_settings.delivery_radii];
    newRadii[index] = { ...newRadii[index], [field]: parsedValue };
    setSettings(prev => ({ ...prev, delivery_settings: { ...prev.delivery_settings, delivery_radii: newRadii }}));
  };

  const removeDeliveryRadius = (index: number) => {
    const newRadii = settings.delivery_settings.delivery_radii.filter((_, i) => i !== index);
    setSettings(prev => ({ ...prev, delivery_settings: { ...prev.delivery_settings, delivery_radii: newRadii }}));
  };

  const updateCompanyData = (field: keyof CompanyData, value: string) => {
    setSettings(prev => ({
      ...prev,
      company_data: {
        ...prev.company_data,
        [field]: value
      }
    }));
  };

  const updatePrinterSettings = (field: keyof PrinterSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      printer_settings: {
        ...prev.printer_settings,
        [field]: value
      }
    }));
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[calc(100vh-150px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 bg-slate-50 p-4 rounded-lg bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2UyZThmMCIgb3BhY2l0eT0iMC40IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Configurações da Conta</h1>
              <p className="text-gray-500">Personalize as configurações do seu sistema</p>
            </div>
            <Button 
              onClick={handleSave} 
              disabled={saving} 
              className="bg-fiscal-green-600 hover:bg-fiscal-green-700 text-white font-medium px-4 py-1.5 rounded-xl flex items-center gap-2 text-sm transition-colors mt-4 sm:mt-0"
            >
            {saving ? (
              <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></span>
            ) : (
              <Save size={16} className="text-white" />
            )}
            Salvar Alterações
          </Button>
        </div>

        <Tabs defaultValue="company" className="w-full">
            <div className="mb-6">
              <TabsList className="!bg-white p-[5px] rounded-[20px] border border-gray-300 w-full flex justify-between">
              <TabsTrigger 
                value="company" 
                  className="data-[state=active]:bg-fiscal-green-50 data-[state=active]:text-fiscal-green-700 data-[state=active]:font-medium data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-fiscal-green-300 bg-slate-50 transition-all duration-200 rounded-xl mx-0.5 border border-transparent hover:border-gray-200 text-sm flex items-center justify-center gap-1.5 py-2 flex-1 whitespace-nowrap"
              >
                  <Building size={16} />
                Empresa
              </TabsTrigger>
              <TabsTrigger 
                value="payment" 
                  className="data-[state=active]:bg-fiscal-green-50 data-[state=active]:text-fiscal-green-700 data-[state=active]:font-medium data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-fiscal-green-300 bg-slate-50 transition-all duration-200 rounded-xl mx-0.5 border border-transparent hover:border-gray-200 text-sm flex items-center justify-center gap-1.5 py-2 flex-1 whitespace-nowrap"
              >
                  <CreditCard size={16} />
                Pagamento
              </TabsTrigger>
              <TabsTrigger 
                value="delivery" 
                  className="data-[state=active]:bg-fiscal-green-50 data-[state=active]:text-fiscal-green-700 data-[state=active]:font-medium data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-fiscal-green-300 bg-slate-50 transition-all duration-200 rounded-xl mx-0.5 border border-transparent hover:border-gray-200 text-sm flex items-center justify-center gap-1.5 py-2 flex-1 whitespace-nowrap"
              >
                  <MapPin size={16} />
                Entrega
              </TabsTrigger>
              <TabsTrigger 
                value="printer" 
                  className="data-[state=active]:bg-fiscal-green-50 data-[state=active]:text-fiscal-green-700 data-[state=active]:font-medium data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-fiscal-green-300 bg-slate-50 transition-all duration-200 rounded-xl mx-0.5 border border-transparent hover:border-gray-200 text-sm flex items-center justify-center gap-1.5 py-2 flex-1 whitespace-nowrap"
              >
                  <Printer size={16} />
                Impressora
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Company Tab */}
          <TabsContent value="company">
              <Card className="shadow-sm border border-gray-300 rounded-[20px] overflow-hidden bg-white">
              <CardHeader className="bg-gray-50 p-5 border-b border-gray-200">
                <CardTitle className="text-xl font-semibold text-gray-700">Dados da Empresa</CardTitle>
                <CardDescription className="text-sm text-gray-500 pt-1">
                  Informações que aparecerão em suas notas e recibos.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="company-name" className="text-sm font-medium text-gray-700">Nome da Empresa</Label>
                      <Input
                        id="company-name"
                        value={settings.company_data.name || ''}
                        onChange={(e) => updateCompanyData('name', e.target.value)}
                        placeholder="Ex: Minha Loja LTDA"
                          className="w-full px-3 py-2 border border-gray-300 rounded-[20px] shadow-sm focus:ring-fiscal-green-500 focus:border-fiscal-green-500 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="company-cnpj" className="text-sm font-medium text-gray-700">CNPJ</Label>
                      <Input
                        id="company-cnpj"
                        value={settings.company_data.cnpj || ''}
                        onChange={(e) => updateCompanyData('cnpj', e.target.value)}
                        placeholder="00.000.000/0000-00"
                          className="w-full px-3 py-2 border border-gray-300 rounded-[20px] shadow-sm focus:ring-fiscal-green-500 focus:border-fiscal-green-500 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="company-address" className="text-sm font-medium text-gray-700">Endereço Completo</Label>
                      <Input
                        id="company-address"
                        value={settings.company_data.address || ''}
                        onChange={(e) => updateCompanyData('address', e.target.value)}
                        placeholder="Rua Exemplo, 123, Bairro, Cidade - UF"
                          className="w-full px-3 py-2 border border-gray-300 rounded-[20px] shadow-sm focus:ring-fiscal-green-500 focus:border-fiscal-green-500 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="company-phone" className="text-sm font-medium text-gray-700">Telefone</Label>
                      <Input
                        id="company-phone"
                        value={settings.company_data.phone || ''}
                        onChange={(e) => updateCompanyData('phone', e.target.value)}
                        placeholder="(00) 90000-0000"
                          className="w-full px-3 py-2 border border-gray-300 rounded-[20px] shadow-sm focus:ring-fiscal-green-500 focus:border-fiscal-green-500 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="company-email" className="text-sm font-medium text-gray-700">Email de Contato</Label>
                      <Input
                        id="company-email"
                        type="email"
                        value={settings.company_data.email || ''}
                        onChange={(e) => updateCompanyData('email', e.target.value)}
                        placeholder="contato@suaempresa.com"
                          className="w-full px-3 py-2 border border-gray-300 rounded-[20px] shadow-sm focus:ring-fiscal-green-500 focus:border-fiscal-green-500 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="company-logo" className="text-sm font-medium text-gray-700">Logo da Empresa</Label>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20 rounded-xl border border-gray-200 bg-gray-50">
                          <AvatarImage src={logoPreview || settings.company_data.logo || ''} alt="Logo da empresa" className="object-contain"/>
                          <AvatarFallback className="bg-gray-200 text-gray-500 text-xl">
                            {settings.company_data.name?.substring(0,2).toUpperCase() || 'LG'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <Input
                            id="company-logo"
                            type="file"
                            accept="image/png, image/jpeg, image/webp"
                            onChange={handleLogoChange}
                            className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-xl"
                          />
                          <p className="text-xs text-gray-500 mt-1.5">
                            PNG, JPG ou WEBP (Máx. 2MB). Recomendado: 200x200px.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Tab */}
          <TabsContent value="payment">
              <Card className="shadow-sm border border-gray-300 rounded-[20px] overflow-hidden bg-white">
              <CardHeader className="bg-gray-50 p-5 border-b border-gray-200">
                <CardTitle className="text-xl font-semibold text-gray-700">Taxas de Parcelamento</CardTitle>
                <CardDescription className="text-sm text-gray-500 pt-1">
                  Configure as taxas de juros para pagamentos parcelados.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {settings.installment_fees.length === 0 && (
                    <Alert variant="default" className="bg-blue-50 border-blue-300 text-blue-700">
                        <Info className="h-5 w-5 text-blue-600" />
                        <AlertTitle className="font-medium">Nenhuma taxa configurada</AlertTitle>
                        <AlertDescription className="text-sm">
                        Você ainda não adicionou nenhuma configuração de taxa de parcelamento.
                        </AlertDescription>
                    </Alert>
                )}
                <div className="space-y-4">
                  {settings.installment_fees.map((fee, index) => (
                    <div key={index} className="flex items-end gap-3 p-4 border border-gray-200 rounded-lg bg-white">
                      <div className="flex-1 space-y-1.5">
                        <Label htmlFor={`installments-${index}`} className="text-sm font-medium text-gray-700">Nº de Parcelas</Label>
                        <Input
                          id={`installments-${index}`}
                          type="number"
                          min="2"
                          value={fee.installments}
                          onChange={(e) => updateInstallmentFee(index, 'installments', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                        />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <Label htmlFor={`fee-${index}`} className="text-sm font-medium text-gray-700">Taxa de Juros (%)</Label>
                        <Input
                          id={`fee-${index}`}
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={fee.fee}
                          onChange={(e) => updateInstallmentFee(index, 'fee', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:bg-red-100 p-2 rounded-md h-10 w-10 flex items-center justify-center"
                        onClick={() => removeInstallmentFee(index)}
                        aria-label="Remover taxa"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full mt-5 py-2.5 border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700 font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 transition duration-150 ease-in-out"
                    onClick={addInstallmentFee}
                  >
                    <PlusCircle size={18} />
                    Adicionar Nova Taxa de Parcelamento
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Delivery Tab */}
          <TabsContent value="delivery">
              <Card className="shadow-sm border border-gray-300 rounded-[20px] overflow-hidden bg-white">
              <CardHeader className="bg-gray-50 p-5 border-b border-gray-200">
                <CardTitle className="text-xl font-semibold text-gray-700">Configurações de Entrega</CardTitle>
                <CardDescription className="text-sm text-gray-500 pt-1">
                  Defina taxas de entrega padrão e baseadas em raio de distância.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-1.5">
                  <Label htmlFor="default-delivery-fee" className="text-sm font-medium text-gray-700">Taxa Padrão de Entrega (R$)</Label>
                  <Input
                    id="default-delivery-fee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={settings.delivery_settings.default_delivery_fee || ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      delivery_settings: {
                        ...prev.delivery_settings,
                        default_delivery_fee: parseFloat(e.target.value) || 0
                      }
                    }))}
                    placeholder="Ex: 5.00"
                    className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                  />
                </div>
                <div className="pt-4">
                  <h3 className="text-lg font-medium text-gray-700 mb-1">Taxas por Raio de Entrega</h3>
                  <p className="text-sm text-gray-500 mb-4">Adicione taxas específicas para diferentes distâncias.</p>
                  {settings.delivery_settings.delivery_radii.length === 0 && (
                    <Alert variant="default" className="bg-blue-50 border-blue-300 text-blue-700">
                        <Info className="h-5 w-5 text-blue-600" />
                        <AlertTitle className="font-medium">Nenhum raio configurado</AlertTitle>
                        <AlertDescription className="text-sm">
                        Você ainda não adicionou nenhuma configuração de taxa por raio de entrega.
                        </AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-4">
                    {settings.delivery_settings.delivery_radii.map((radiusItem, index) => (
                      <div key={index} className="flex items-end gap-3 p-4 border border-gray-200 rounded-lg bg-white">
                        <div className="flex-1 space-y-1.5">
                          <Label htmlFor={`radius-${index}`} className="text-sm font-medium text-gray-700">Raio Máximo (km)</Label>
                          <Input
                            id={`radius-${index}`}
                            type="number"
                            step="0.1"
                            min="0"
                            value={radiusItem.radius}
                            onChange={(e) => updateDeliveryRadius(index, 'radius', e.target.value)}
                            placeholder="Ex: 5"
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                          />
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <Label htmlFor={`delivery-fee-${index}`} className="text-sm font-medium text-gray-700">Taxa de Entrega (R$)</Label>
                          <Input
                            id={`delivery-fee-${index}`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={radiusItem.fee}
                            onChange={(e) => updateDeliveryRadius(index, 'fee', e.target.value)}
                            placeholder="Ex: 10.00"
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:bg-red-100 p-2 rounded-md h-10 w-10 flex items-center justify-center"
                          onClick={() => removeDeliveryRadius(index)}
                          aria-label="Remover raio de entrega"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      className="w-full mt-5 py-2.5 border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700 font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 transition duration-150 ease-in-out"
                      onClick={addDeliveryRadius}
                    >
                      <PlusCircle size={18} />
                      Adicionar Novo Raio de Entrega
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Printer Tab */}
          <TabsContent value="printer">
              <Card className="shadow-sm border border-gray-300 rounded-[20px] overflow-hidden bg-white">
              <CardHeader className="bg-gray-50 p-5 border-b border-gray-200">
                <CardTitle className="text-xl font-semibold text-gray-700">Configurações de Impressora</CardTitle>
                <CardDescription className="text-sm text-gray-500 pt-1">
                  Gerencie as preferências de impressão para suas notas e recibos.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-1.5">
                  <Label htmlFor="default-printer" className="text-sm font-medium text-gray-700">Impressora Padrão</Label>
                  <Input
                    id="default-printer"
                    value={settings.printer_settings.default_printer}
                    onChange={(e) => updatePrinterSettings('default_printer', e.target.value)}
                    placeholder="Ex: EPSON L3150 Series"
                    className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                  />
                  <p className="text-xs text-gray-500">Nome exato da impressora instalada no seu sistema.</p>
                </div>
                <div className="flex items-center space-x-3 pt-2">
                  <Switch
                    id="auto-print"
                    checked={settings.printer_settings.auto_print}
                    onCheckedChange={(checked) => updatePrinterSettings('auto_print', checked)}
                    className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-200"
                  />
                  <Label htmlFor="auto-print" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Imprimir automaticamente ao finalizar uma nota/orçamento
                  </Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </Layout>
  );
} 