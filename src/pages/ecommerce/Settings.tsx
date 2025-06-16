import React, { useState, useEffect, useCallback } from 'react';
import EcommerceDashboardLayout from '@/components/ecommerce/EcommerceDashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input as InputPrimitive } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button as ButtonPrimitive } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent, 
  SelectItem as SelectItemPrimitive, 
  SelectTrigger as SelectTriggerPrimitive, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Card as CardPrimitive, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch as SwitchPrimitive } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Palette, 
  LayoutGrid, 
  Type, 
  Image as ImageIcon,
  Settings as SettingsIcon,
  Save,
  Eye,
  Brush,
  ChevronRight,
  Store,
  Check,
  Bug,
  Loader2,
  FileSearch
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import useStoreTheme, { EcommerceSettings, ProductCardStyles } from '@/hooks/useStoreTheme';
import ThemeSelector from '@/components/ecommerce/ThemeSelector';
import { cn } from '@/lib/utils';
import { FileUploader } from '@/components/ui/file-uploader';
import { createRequiredBuckets } from '@/services/storageService';
import { supabase } from '@/integrations/supabase/client';

// Tipos para os formulários locais, espelhando as interfaces do hook
// mas permitindo que todos os campos sejam string/number/boolean para os inputs
// e convertendo para os tipos corretos antes de salvar.

const initialSettingsState: Partial<EcommerceSettings> = {
  primary_color: '#f59e0b',
  secondary_color: '#000000',
  accent_color: '#4b5563',
  background_color: '#ffffff',
  header_background_color: '#ffffff',
  footer_background_color: '#000000',
  font_family: 'Inter',
  button_style: 'filled',
  border_radius: 4,
  logo_url: '',
  logo_width: 120,
  favicon_url: '',
  banner_image_url: '',
  use_overlay_text: true,
  product_cards_per_row: 4,
  show_product_ratings: true,
  show_discount_badge: true,
  display_product_quick_view: true,
  enable_wishlist: true,
  show_social_share_buttons: true,
  store_name: 'TOOLPART',
  store_description: 'Loja de ferramentas e peças para profissionais',
  meta_keywords: 'ferramentas, peças, equipamentos, profissionais',
  store_cnpj: '',
  store_phone: '',
  store_email: '',
  store_address: '',
  footer_payment_methods: '',
  footer_card_flags: '',
  footer_social_facebook: '',
  footer_social_instagram: '',
  footer_social_twitter: '',
  footer_social_linkedin: '',
  footer_social_youtube: '',
  footer_custom_text: '',
  footer_credits: 'Orgulhosamente desenvolvido com Fiscal Flow',
};

const initialCardStylesState: Partial<ProductCardStyles> = {
  card_border_enabled: true,
  card_shadow_enabled: true,
  card_shadow_intensity: 1,
  card_hover_effect: 'scale',
  image_aspect_ratio: '1:1',
  image_fit: 'cover',
  display_product_name: true,
  display_price: true,
  display_original_price: true,
  display_discount_percentage: true,
  button_text: 'Adicionar ao carrinho',
  secondary_button_enabled: true,
  secondary_button_text: 'Ver detalhes',
  buttons_display_style: 'always',
};

const Card = ({ className, ...props }: React.ComponentProps<typeof CardPrimitive>) => (
  <CardPrimitive 
    className={cn(
      "rounded-xl border border-gray-200 bg-white shadow-sm",
      className
    )} 
    {...props} 
  />
);

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof SelectTriggerPrimitive>
>(({ className, ...props }, ref) => (
  <SelectTriggerPrimitive
    ref={ref}
    className={cn(
      "w-full transition-colors duration-200 hover:border-fiscal-green-500/50 focus:border-fiscal-green-500 bg-white",
      className
    )}
    {...props}
  />
));
SelectTrigger.displayName = SelectTriggerPrimitive.displayName;

const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof InputPrimitive>
>(({ className, ...props }, ref) => (
  <InputPrimitive
    ref={ref}
    className={cn(
      "transition-colors duration-200 hover:border-fiscal-green-500/50 focus:border-fiscal-green-500",
      className
    )}
    {...props}
  />
));
Input.displayName = InputPrimitive.displayName;

const Switch = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof SwitchPrimitive>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive
    ref={ref}
    className={cn(
      "data-[state=checked]:bg-fiscal-green-500 transition-colors duration-200",
      className
    )}
    {...props}
  />
));
Switch.displayName = SwitchPrimitive.displayName;

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof ButtonPrimitive>
>(({ className, ...props }, ref) => (
  <ButtonPrimitive
    ref={ref}
    className={cn(
      "transition-all duration-200 active:scale-95",
      className
    )}
    {...props}
  />
));
Button.displayName = ButtonPrimitive.displayName;

const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof SelectItemPrimitive>
>(({ className, ...props }, ref) => (
  <SelectItemPrimitive 
    ref={ref}
    className={cn(
      "cursor-pointer transition-colors duration-150 rounded px-2 py-1.5 mx-1 my-0.5 text-sm",
      "data-[highlighted]:bg-fiscal-green-50 data-[highlighted]:text-fiscal-green-700",
      "data-[selected]:bg-fiscal-green-100 data-[selected]:text-fiscal-green-800 data-[selected]:font-medium",
      className
    )}
    {...props}
  />
));
SelectItem.displayName = SelectItemPrimitive.displayName;

const EcommerceSettingsPage: React.FC = () => {
  const { toast } = useToast();
  const {
    settings: themeSettings,
    cardStyles: themeCardStyles,
    loading: themeLoading,
    error: themeError,
    saveSettings,
    saveCardStyles,
    setThemeSettings,
  } = useStoreTheme();

  const [localSettings, setLocalSettings] = useState<Partial<EcommerceSettings>>(initialSettingsState);
  const [localCardStyles, setLocalCardStyles] = useState<Partial<ProductCardStyles>>(initialCardStylesState);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [bucketsInitialized, setBucketsInitialized] = useState(false);

  useEffect(() => {
    // Inicializar buckets ao carregar o componente
    const initBuckets = async () => {
      try {
        console.log('Inicializando buckets de armazenamento...');
        const result = await createRequiredBuckets();
        setBucketsInitialized(result.success);
        
        if (!result.success) {
          const isJwtExpired = result.error?.message?.includes('jwt expired');
          const isAuthError = result.error?.message?.includes('auth');
          
          console.error('Erro na inicialização dos buckets:', result.error);
          
          if (isJwtExpired || isAuthError) {
            toast({
              title: 'Configuração necessária',
              description: (
                <div className="space-y-2">
                  <p>Para permitir upload de imagens, é necessário configurar a chave de serviço do Supabase.</p>
                  <p className="text-xs">
                    Consulte o guia <a href="/docs/guides/configurar-supabase-storage.md" target="_blank" className="underline text-blue-500">configurar-supabase-storage.md</a> para instruções.
                  </p>
                </div>
              ),
              variant: 'destructive',
              duration: 10000,
            });
          } else {
            toast({
              title: 'Aviso sobre armazenamento',
              description: 'Houve um problema ao configurar o armazenamento. O upload de imagens pode não funcionar corretamente.',
              variant: 'destructive',
              duration: 6000,
            });
          }
        } else {
          console.log('Buckets inicializados com sucesso');
        }
      } catch (error: any) {
        console.error('Exceção ao inicializar buckets:', error);
        setBucketsInitialized(false);
        
        const errorMessage = error?.message || 'Erro desconhecido';
        
        toast({
          title: 'Erro de armazenamento',
          description: (
            <div className="space-y-2">
              <p>Não foi possível configurar o armazenamento: {errorMessage}</p>
              <p className="text-xs">
                Verifique o guia <a href="/docs/guides/configurar-supabase-storage.md" target="_blank" className="underline text-blue-500">configurar-supabase-storage.md</a> para resolver o problema.
              </p>
            </div>
          ),
          variant: 'destructive',
          duration: 10000,
        });
      }
    };
    
    initBuckets();
  }, [toast]);

  useEffect(() => {
    if (themeSettings) {
      setLocalSettings(themeSettings);
    }
    if (themeCardStyles) {
      setLocalCardStyles(themeCardStyles);
    }
  }, [themeSettings, themeCardStyles]);

  const handleSettingsChange = (field: keyof EcommerceSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleCardStylesChange = (field: keyof ProductCardStyles, value: any) => {
    setLocalCardStyles(prev => ({ ...prev, [field]: value }));
  };

  const handleVerificarDados = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('ecommerce_settings')
        .select('*')
        .limit(1)
        .single();
        
      if (error) {
        console.error('Erro ao consultar dados:', error);
        toast({
          title: 'Erro ao verificar dados',
          description: error.message,
          variant: 'destructive'
        });
        return;
      }
      
      console.log('Dados atuais na tabela:', data);
      
      toast({
        title: 'Estado atual dos dados',
        description: (
          <div className="space-y-2 mt-2 text-xs">
            <div><strong>ID:</strong> {data.id}</div>
            <div className="truncate"><strong>Logo:</strong> {data.logo_url || 'Não definido'}</div>
            <div className="truncate"><strong>Favicon:</strong> {data.favicon_url || 'Não definido'}</div>
            <div className="truncate"><strong>Banner:</strong> {data.banner_image_url || 'Não definido'}</div>
          </div>
        ),
        duration: 10000,
      });
      
    } catch (err) {
      console.error('Erro ao verificar dados:', err);
      toast({
        title: 'Erro ao verificar dados',
        description: 'Ocorreu um erro ao verificar o estado atual dos dados',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSalvarApenasImagens = async () => {
    try {
      setIsSaving(true);
      
      if (!themeSettings?.id) {
        toast({
          title: 'Erro',
          description: 'ID das configurações não encontrado',
          variant: 'destructive'
        });
        return;
      }
      
      // Coletamos apenas os campos de imagens que estão definidos
      const imageData: any = {
        id: themeSettings.id,
        updated_at: new Date().toISOString()
      };
      
      // Adicionamos apenas os campos que tiveram imagens carregadas
      if (logoUrl) {
        imageData.logo_url = logoUrl;
        console.log('Incluindo logo_url:', logoUrl);
      }
      
      if (faviconUrl) {
        imageData.favicon_url = faviconUrl;
        console.log('Incluindo favicon_url:', faviconUrl);
      }
      
      if (bannerUrl) {
        imageData.banner_image_url = bannerUrl;
        console.log('Incluindo banner_image_url:', bannerUrl);
      }
      
      console.log('Dados a serem salvos:', imageData);
      
      // Atualiza diretamente na tabela
      const { data, error } = await supabase
        .from('ecommerce_settings')
        .update(imageData)
        .eq('id', themeSettings.id)
        .select();
      
      if (error) {
        console.error('Erro ao salvar imagens:', error);
        toast({
          title: 'Erro ao salvar imagens',
          description: error.message,
          variant: 'destructive'
        });
        return;
      }
      
      console.log('Imagens salvas com sucesso:', data);
      
      toast({
        title: 'Imagens salvas',
        description: 'As URLs das imagens foram salvas diretamente na tabela'
      });
      
      // Atualiza os dados locais
      if (data && data.length > 0) {
        const updatedData = data[0];
        setThemeSettings({
          ...themeSettings,
          logo_url: updatedData.logo_url,
          favicon_url: updatedData.favicon_url,
          banner_image_url: updatedData.banner_image_url
        });
      }
    } catch (err: any) {
      console.error('Erro ao salvar imagens:', err);
      toast({
        title: 'Erro ao salvar imagens',
        description: err.message || 'Ocorreu um erro ao salvar as imagens',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      
      // Vamos primeiro salvar APENAS as imagens diretamente na tabela para garantir que sejam persistidas
      if (themeSettings?.id && (logoUrl || faviconUrl || bannerUrl)) {
        console.log('Primeira etapa: Salvando apenas imagens diretamente no banco');
        
        const imageData: any = {
          id: themeSettings.id,
          updated_at: new Date().toISOString()
        };
        
        // Adicionamos apenas os campos que tiveram imagens carregadas
        if (logoUrl) {
          imageData.logo_url = logoUrl;
          console.log('URL do logo a ser salva:', logoUrl);
        }
        
        if (faviconUrl) {
          imageData.favicon_url = faviconUrl;
          console.log('URL do favicon a ser salva:', faviconUrl);
        }
        
        if (bannerUrl) {
          imageData.banner_image_url = bannerUrl;
          console.log('URL do banner a ser salva:', bannerUrl);
        }
        
        // Salvamos diretamente no banco de dados
        const { data, error } = await supabase
          .from('ecommerce_settings')
          .update(imageData)
          .eq('id', themeSettings.id)
          .select();
        
        if (error) {
          console.error('Erro ao salvar imagens:', error);
          throw new Error(`Erro ao salvar imagens: ${error.message}`);
        }
        
        console.log('Imagens salvas com sucesso:', data);
        toast({
          title: 'Imagens salvas',
          description: 'As URLs das imagens foram salvas diretamente na tabela'
        });
      }
      
      // Agora salvamos as outras configurações
      console.log('Segunda etapa: Salvando restante das configurações');
      const updatedSettings: Partial<EcommerceSettings> = {
        ...localSettings,
      };
      
      // Não precisamos incluir as URLs novamente, pois já foram salvas
      // mas garantimos que os estados locais tem as URLs atualizadas
      if (logoUrl) {
        updatedSettings.logo_url = logoUrl;
      }
      
      if (faviconUrl) {
        updatedSettings.favicon_url = faviconUrl;
      }
      
      if (bannerUrl) {
        updatedSettings.banner_image_url = bannerUrl;
      }
      
      // Salvamos através do hook
      await saveSettings(updatedSettings);
      
      // Verificamos se as imagens foram realmente salvas
      if (themeSettings?.id) {
        console.log('Terceira etapa: Verificando se as imagens foram salvas corretamente');
        const { data, error } = await supabase
          .from('ecommerce_settings')
          .select('logo_url, favicon_url, banner_image_url')
          .eq('id', themeSettings.id)
          .single();
          
        if (!error && data) {
          console.log('Estado final das imagens no banco:', data);
          
          // Se alguma URL não foi salva, tentamos mais uma vez
          if ((logoUrl && data.logo_url !== logoUrl) || 
              (faviconUrl && data.favicon_url !== faviconUrl) || 
              (bannerUrl && data.banner_image_url !== bannerUrl)) {
            
            console.log('Algumas URLs não foram salvas. Tentando novamente...');
            
            const finalImageData: any = {
              id: themeSettings.id,
              updated_at: new Date().toISOString()
            };
            
            if (logoUrl && data.logo_url !== logoUrl) {
              finalImageData.logo_url = logoUrl;
            }
            
            if (faviconUrl && data.favicon_url !== faviconUrl) {
              finalImageData.favicon_url = faviconUrl;
            }
            
            if (bannerUrl && data.banner_image_url !== bannerUrl) {
              finalImageData.banner_image_url = bannerUrl;
            }
            
            // Última tentativa de salvar
            const { error: finalError } = await supabase
              .from('ecommerce_settings')
              .update(finalImageData)
              .eq('id', themeSettings.id);
              
            if (finalError) {
              console.error('Erro na tentativa final de salvar imagens:', finalError);
            } else {
              console.log('URLs das imagens salvas com sucesso na tentativa final');
            }
          }
        }
      }
      
      toast({
        title: 'Configurações salvas',
        description: 'As configurações foram salvas com sucesso'
      });
      
      // Atualiza os dados locais para refletir o que foi salvo
      if (themeSettings) {
        setThemeSettings({
          ...themeSettings,
          ...updatedSettings,
          logo_url: logoUrl || themeSettings.logo_url,
          favicon_url: faviconUrl || themeSettings.favicon_url,
          banner_image_url: bannerUrl || themeSettings.banner_image_url,
        });
      }
      
    } catch (err: any) {
      console.error('Erro ao salvar configurações:', err);
      toast({
        title: 'Erro ao salvar',
        description: err.message || 'Ocorreu um erro ao salvar as configurações',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleThemeSelect = (theme: any) => {
    setLocalSettings({
      ...localSettings,
      primary_color: theme.colors.primary,
      secondary_color: theme.colors.secondary,
      accent_color: theme.colors.accent,
      font_family: theme.font,
    });
  };

  const fontFamilies = ['Inter', 'Roboto', 'Montserrat', 'Poppins', 'Lato', 'Open Sans'];
  const buttonStyles = ['filled', 'outline', 'ghost', 'link'];
  const hoverEffects = ['none', 'scale', 'elevate', 'border'];
  const imageAspectRatios = ['1:1', '4:3', '3:4', '16:9', '9:16'];
  const imageFits = ['cover', 'contain'];
  const buttonsDisplayStyles = ['always', 'hover', 'bottom'];

  if (themeLoading) {
    return (
      <EcommerceDashboardLayout>
        <div className="flex justify-center items-center h-[80vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-fiscal-green-500"></div>
            <p className="text-lg text-muted-foreground">Carregando configurações...</p>
          </div>
        </div>
      </EcommerceDashboardLayout>
    );
  }
  
  // Helper para renderizar um campo de formulário
  const FormField: React.FC<any> = ({ id, label, children, description }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </Label>
      </div>
      {children}
      {description && (
        <p className="text-[0.8rem] text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );

  return (
    <EcommerceDashboardLayout>
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-fiscal-green-500/10 rounded-lg">
                  <Store className="w-8 h-8 text-fiscal-green-500" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-fiscal-green-500 to-fiscal-green-600 bg-clip-text text-transparent">
                    Configurações da Loja
                  </h1>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <span>Ecommerce</span>
                    <ChevronRight className="w-4 h-4" />
                    <span>Configurações</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <Button 
                  variant="outline" 
                  onClick={() => window.open('/ecommerce?preview=true', '_blank')} 
                  className="flex-1 md:flex-none items-center gap-2 hover:bg-fiscal-green-500/10 hover:text-fiscal-green-500 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Visualizar Loja
                </Button>
                <Button 
                  onClick={() => {
                    console.log('Configurações atuais:', localSettings);
                    localStorage.setItem('debug_settings', JSON.stringify(localSettings));
                    toast({
                      title: 'Debug',
                      description: 'Configurações atuais foram registradas no console e localStorage',
                    });
                  }}
                  variant="outline"
                  className="flex-none items-center gap-2 px-2 border-yellow-600 hover:bg-yellow-50 text-yellow-600"
                >
                  <Bug className="w-4 h-4" />
                </Button>
                <Button 
                  onClick={handleSaveSettings} 
                  disabled={isSaving || themeLoading} 
                  className="flex-1 md:flex-none items-center gap-2 bg-fiscal-green-500 hover:bg-fiscal-green-600 text-white font-medium transition-colors"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="aparenciaGeral" className="w-full space-y-6">
            <div className="sticky top-0 z-10 bg-transparent pb-4">
              <ScrollArea className="w-full">
                <TabsList className="inline-flex h-auto p-2 bg-gray-100/80 backdrop-blur-sm rounded-xl shadow-sm">
                  <TabsTrigger 
                    value="aparenciaGeral"
                    className="data-[state=active]:bg-white data-[state=active]:text-fiscal-green-500 data-[state=active]:shadow-sm rounded-lg transition-all px-4 py-2"
                  >
                    <Palette className="w-4 h-4 mr-2" />
                    Geral
                  </TabsTrigger>
                  <TabsTrigger 
                    value="temas"
                    className="data-[state=active]:bg-white data-[state=active]:text-fiscal-green-500 data-[state=active]:shadow-sm rounded-lg transition-all px-4 py-2"
                  >
                    <Brush className="w-4 h-4 mr-2" />
                    Temas
                  </TabsTrigger>
                  <TabsTrigger 
                    value="logoImagem"
                    className="data-[state=active]:bg-white data-[state=active]:text-fiscal-green-500 data-[state=active]:shadow-sm rounded-lg transition-all px-4 py-2"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Logo/Imagens
                  </TabsTrigger>
                  <TabsTrigger 
                    value="layoutLoja"
                    className="data-[state=active]:bg-white data-[state=active]:text-fiscal-green-500 data-[state=active]:shadow-sm rounded-lg transition-all px-4 py-2"
                  >
                    <LayoutGrid className="w-4 h-4 mr-2" />
                    Layout
                  </TabsTrigger>
                  <TabsTrigger 
                    value="estiloCartoes"
                    className="data-[state=active]:bg-white data-[state=active]:text-fiscal-green-500 data-[state=active]:shadow-sm rounded-lg transition-all px-4 py-2"
                  >
                    <SettingsIcon className="w-4 h-4 mr-2" />
                    Cartões
                  </TabsTrigger>
                  <TabsTrigger 
                    value="seo"
                    className="data-[state=active]:bg-white data-[state=active]:text-fiscal-green-500 data-[state=active]:shadow-sm rounded-lg transition-all px-4 py-2"
                  >
                    <Type className="w-4 h-4 mr-2" />
                    SEO
                  </TabsTrigger>
                  <TabsTrigger 
                    value="rodapeConfig"
                    className="data-[state=active]:bg-white data-[state=active]:text-fiscal-green-500 data-[state=active]:shadow-sm rounded-lg transition-all px-4 py-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>
                    Rodapé
                  </TabsTrigger>
                </TabsList>
              </ScrollArea>
            </div>

            <TabsContent value="aparenciaGeral">
              <Card>
                <CardHeader className="space-y-1 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                  <CardTitle className="text-2xl bg-gradient-to-r from-fiscal-green-500 to-fiscal-green-600 bg-clip-text text-transparent">Aparência Geral</CardTitle>
                  <CardDescription>
                    Personalize as cores principais, fontes e estilos de botões da sua loja.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4 p-6 rounded-lg bg-gray-50 backdrop-blur-sm border border-gray-200 shadow-sm">
                      <h3 className="font-medium text-fiscal-green-700 flex items-center gap-2 pb-2 border-b border-gray-100">
                        <div className="w-1 h-5 bg-fiscal-green-500 rounded-full"></div>
                        Cores Principais
                      </h3>
                      <div className="space-y-4">
                        <FormField id="primaryColor" label="Cor Primária">
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <Input 
                                type="text" 
                                value={localSettings.primary_color || ''} 
                                onChange={(e) => handleSettingsChange('primary_color', e.target.value)}
                                className="font-mono"
                              />
                            </div>
                            <Input 
                              type="color" 
                              value={localSettings.primary_color || ''} 
                              onChange={(e) => handleSettingsChange('primary_color', e.target.value)}
                              className="w-12 h-9 p-1 rounded-md cursor-pointer"
                            />
                          </div>
                        </FormField>
                        
                        <FormField id="secondaryColor" label="Cor Secundária">
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <Input 
                                type="text" 
                                value={localSettings.secondary_color || ''} 
                                onChange={(e) => handleSettingsChange('secondary_color', e.target.value)}
                                className="font-mono"
                              />
                            </div>
                            <Input 
                              type="color" 
                              value={localSettings.secondary_color || ''} 
                              onChange={(e) => handleSettingsChange('secondary_color', e.target.value)}
                              className="w-12 h-9 p-1 rounded-md cursor-pointer"
                            />
                          </div>
                        </FormField>

                        <FormField id="accentColor" label="Cor de Destaque">
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <Input 
                                type="text" 
                                value={localSettings.accent_color || ''} 
                                onChange={(e) => handleSettingsChange('accent_color', e.target.value)}
                                className="font-mono"
                              />
                            </div>
                            <Input 
                              type="color" 
                              value={localSettings.accent_color || ''} 
                              onChange={(e) => handleSettingsChange('accent_color', e.target.value)}
                              className="w-12 h-9 p-1 rounded-md cursor-pointer"
                            />
                          </div>
                        </FormField>
                      </div>
                    </div>

                    <div className="space-y-4 p-6 rounded-lg bg-gray-50 backdrop-blur-sm border border-gray-200 shadow-sm">
                      <h3 className="font-medium text-fiscal-green-700 flex items-center gap-2 pb-2 border-b border-gray-100">
                        <div className="w-1 h-5 bg-fiscal-green-500 rounded-full"></div>
                        Cores de Fundo
                      </h3>
                      <div className="space-y-4">
                        <FormField id="backgroundColor" label="Fundo Principal">
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <Input 
                                type="text" 
                                value={localSettings.background_color || ''} 
                                onChange={(e) => handleSettingsChange('background_color', e.target.value)}
                                className="font-mono"
                              />
                            </div>
                            <Input 
                              type="color" 
                              value={localSettings.background_color || ''} 
                              onChange={(e) => handleSettingsChange('background_color', e.target.value)}
                              className="w-12 h-9 p-1 rounded-md cursor-pointer"
                            />
                          </div>
                        </FormField>
                      </div>
                    </div>

                    <div className="space-y-4 p-6 rounded-lg bg-gray-50 backdrop-blur-sm border border-gray-200 shadow-sm">
                      <h3 className="font-medium text-fiscal-green-700 flex items-center gap-2 pb-2 border-b border-gray-100">
                        <div className="w-1 h-5 bg-fiscal-green-500 rounded-full"></div>
                        Tipografia
                      </h3>
                      <FormField id="fontFamily" label="Família da Fonte Principal">
                        <Select 
                          value={localSettings.font_family || 'Inter'} 
                          onValueChange={(value) => handleSettingsChange('font_family', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 shadow-md rounded-lg">
                            {fontFamilies.map(font => (
                              <SelectItem key={font} value={font} className="font-medium">
                                {font}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormField>
                    </div>

                    <div className="space-y-4 p-6 rounded-lg bg-gray-50 backdrop-blur-sm border border-gray-200 shadow-sm">
                      <h3 className="font-medium text-fiscal-green-700 flex items-center gap-2 pb-2 border-b border-gray-100">
                        <div className="w-1 h-5 bg-fiscal-green-500 rounded-full"></div>
                        Estilos
                      </h3>
                      <div className="space-y-4">
                        <FormField id="buttonStyle" label="Estilo dos Botões">
                          <Select 
                            value={localSettings.button_style || 'filled'} 
                            onValueChange={(value) => handleSettingsChange('button_style', value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 shadow-md rounded-lg">
                              {buttonStyles.map(style => (
                                <SelectItem key={style} value={style} className="font-medium">
                                  {style.charAt(0).toUpperCase() + style.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormField>

                        <FormField 
                          id="borderRadius" 
                          label="Arredondamento de Bordas" 
                          description={`${localSettings.border_radius || 0}px`}
                        >
                          <Slider 
                            id="borderRadius" 
                            defaultValue={[localSettings.border_radius || 0]} 
                            max={24} 
                            step={1} 
                            onValueChange={([value]) => handleSettingsChange('border_radius', value)}
                            className="py-4"
                          />
                        </FormField>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="temas" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">Temas da Loja</h2>
                  <p className="text-sm text-muted-foreground">
                    Escolha entre temas predefinidos ou personalize seu próprio tema
                  </p>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Temas Predefinidos</CardTitle>
                    <CardDescription>
                      Selecione um tema predefinido para sua loja. Você pode personalizar as cores e fontes depois.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ThemeSelector
                      selectedTheme={localSettings.theme_id || ''}
                      onThemeSelect={handleThemeSelect}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Personalização</CardTitle>
                    <CardDescription>
                      Ajuste as cores e fontes do tema selecionado
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6">
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <FormField
                          id="primary_color"
                          label="Cor Primária"
                          description="Cor principal da sua loja"
                        >
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              id="primary_color"
                              value={localSettings.primary_color}
                              onChange={(e) => handleSettingsChange('primary_color', e.target.value)}
                              className="w-12 h-12 p-1 rounded-lg"
                            />
                            <Input
                              type="text"
                              value={localSettings.primary_color}
                              onChange={(e) => handleSettingsChange('primary_color', e.target.value)}
                              className="flex-1"
                            />
                          </div>
                        </FormField>

                        <FormField
                          id="secondary_color"
                          label="Cor Secundária"
                          description="Cor complementar da sua loja"
                        >
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              id="secondary_color"
                              value={localSettings.secondary_color}
                              onChange={(e) => handleSettingsChange('secondary_color', e.target.value)}
                              className="w-12 h-12 p-1 rounded-lg"
                            />
                            <Input
                              type="text"
                              value={localSettings.secondary_color}
                              onChange={(e) => handleSettingsChange('secondary_color', e.target.value)}
                              className="flex-1"
                            />
                          </div>
                        </FormField>

                        <FormField
                          id="accent_color"
                          label="Cor de Destaque"
                          description="Cor para elementos de destaque"
                        >
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              id="accent_color"
                              value={localSettings.accent_color}
                              onChange={(e) => handleSettingsChange('accent_color', e.target.value)}
                              className="w-12 h-12 p-1 rounded-lg"
                            />
                            <Input
                              type="text"
                              value={localSettings.accent_color}
                              onChange={(e) => handleSettingsChange('accent_color', e.target.value)}
                              className="flex-1"
                            />
                          </div>
                        </FormField>

                        <FormField
                          id="font_family"
                          label="Fonte Principal"
                          description="Fonte utilizada nos textos"
                        >
                          <Select
                            value={localSettings.font_family}
                            onValueChange={(value) => handleSettingsChange('font_family', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma fonte" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Inter">Inter</SelectItem>
                              <SelectItem value="DM Sans">DM Sans</SelectItem>
                              <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                              <SelectItem value="Poppins">Poppins</SelectItem>
                              <SelectItem value="Source Sans Pro">Source Sans Pro</SelectItem>
                              <SelectItem value="Nunito">Nunito</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormField>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="logoImagem">
              <Card>
                <CardHeader className="space-y-1 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                  <CardTitle className="text-2xl bg-gradient-to-r from-fiscal-green-500 to-fiscal-green-600 bg-clip-text text-transparent">Logotipo e Imagens</CardTitle>
                  <CardDescription>
                    Configure o logo, favicon e banner principal da sua loja.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4 p-6 rounded-lg bg-gray-50 backdrop-blur-sm border border-gray-200 shadow-sm">
                      <h3 className="font-medium text-fiscal-green-700 flex items-center gap-2 pb-2 border-b border-gray-100">
                        <div className="w-1 h-5 bg-fiscal-green-500 rounded-full"></div>
                        Logotipo
                      </h3>
                      <div className="space-y-4">
                        <FormField id="logoUrl" label="Logo da Loja">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <FileUploader 
                                bucketName="store-logos"
                                onUploadComplete={(url) => {
                                  console.log('Logo URL recebida:', url);
                                  handleSettingsChange('logo_url', url);
                                  setLogoUrl(url);
                                  toast({
                                    title: 'Logo salvo',
                                    description: 'A URL foi atualizada. Clique em "Salvar Alterações" para confirmar.',
                                    variant: 'default',
                                  });
                                }}
                                defaultPreview={localSettings.logo_url || ''}
                                label="Arraste e solte o logotipo ou clique para selecionar"
                              />
                              {localSettings.logo_url && (
                                <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                  <span>URL atual:</span>
                                  <span className="font-mono text-xs truncate max-w-[200px]">{localSettings.logo_url}</span>
                                </div>
                              )}
                            </div>
                            {localSettings.logo_url && (
                              <div className="flex flex-col justify-center items-center border border-dashed border-gray-200 rounded-md p-4 bg-white">
                                <div className="text-xs text-gray-500 mb-2">Logo atual:</div>
                                <img 
                                  src={localSettings.logo_url} 
                                  alt="Logo da loja" 
                                  className="max-h-20 object-contain"
                                />
                                <div className="mt-2 text-xs text-gray-400">
                                  Largura: {localSettings.logo_width || 120}px
                                </div>
                              </div>
                            )}
                          </div>
                        </FormField>
                        <FormField 
                          id="logoWidth" 
                          label="Largura do Logotipo" 
                          description={`${localSettings.logo_width || 120}px`}
                        >
                          <Slider 
                            id="logoWidth" 
                            defaultValue={[localSettings.logo_width || 120]} 
                            max={500} 
                            step={10} 
                            onValueChange={([value]) => handleSettingsChange('logo_width', value)}
                            className="py-4"
                          />
                        </FormField>
                      </div>
                    </div>

                    <div className="space-y-4 p-6 rounded-lg bg-gray-50 backdrop-blur-sm border border-gray-200 shadow-sm">
                      <h3 className="font-medium text-fiscal-green-700 flex items-center gap-2 pb-2 border-b border-gray-100">
                        <div className="w-1 h-5 bg-fiscal-green-500 rounded-full"></div>
                        Favicon
                      </h3>
                      <FormField id="faviconUrl" label="Favicon do Site">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <FileUploader 
                              bucketName="store-favicons"
                              onUploadComplete={(url) => {
                                console.log('Favicon URL recebida:', url);
                                handleSettingsChange('favicon_url', url);
                                setFaviconUrl(url);
                                toast({
                                  title: 'Favicon salvo',
                                  description: 'A URL foi atualizada. Clique em "Salvar Alterações" para confirmar.',
                                  variant: 'default',
                                });
                              }}
                              defaultPreview={localSettings.favicon_url || ''}
                              label="Arraste e solte o favicon ou clique para selecionar"
                              maxSize={512000} // 500KB para favicon
                            />
                            {localSettings.favicon_url && (
                              <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                <span>URL atual:</span>
                                <span className="font-mono text-xs truncate max-w-[200px]">{localSettings.favicon_url}</span>
                              </div>
                            )}
                          </div>
                          {localSettings.favicon_url && (
                            <div className="flex flex-col justify-center items-center border border-dashed border-gray-200 rounded-md p-4 bg-white">
                              <div className="text-xs text-gray-500 mb-2">Favicon atual:</div>
                              <div className="bg-gray-100 p-4 rounded-md">
                                <img 
                                  src={localSettings.favicon_url} 
                                  alt="Favicon do site" 
                                  className="w-16 h-16 object-contain"
                                />
                              </div>
                              <div className="mt-2 text-xs text-gray-400">
                                Exibido na aba do navegador
                              </div>
                            </div>
                          )}
                        </div>
                      </FormField>
                    </div>

                    <div className="md:col-span-2 space-y-4 p-6 rounded-lg bg-gray-50 backdrop-blur-sm border border-gray-200 shadow-sm">
                      <h3 className="font-medium text-fiscal-green-700 flex items-center gap-2 pb-2 border-b border-gray-100">
                        <div className="w-1 h-5 bg-fiscal-green-500 rounded-full"></div>
                        Banner Principal
                      </h3>
                      <div className="space-y-4">
                        <FormField id="bannerUrl" label="Banner Principal da Loja">
                          <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                              <FileUploader 
                                bucketName="store-banners"
                                onUploadComplete={(url) => {
                                  console.log('Banner URL recebida:', url);
                                  handleSettingsChange('banner_image_url', url);
                                  setBannerUrl(url);
                                  toast({
                                    title: 'Banner salvo',
                                    description: 'A URL foi atualizada. Clique em "Salvar Alterações" para confirmar.',
                                    variant: 'default',
                                  });
                                }}
                                defaultPreview={localSettings.banner_image_url || ''}
                                label="Arraste e solte o banner ou clique para selecionar"
                                maxSize={5242880} // 5MB para banner
                              />
                              <div className="text-xs font-medium px-2 py-1.5 bg-fiscal-green-50 text-fiscal-green-700 rounded-md border border-fiscal-green-100 mt-2">
                                <p className="flex items-center gap-1">
                                  <ImageIcon className="w-3.5 h-3.5" /> 
                                  Dimensões recomendadas: <span className="font-semibold">1920 x 580 pixels</span>
                                </p>
                                <p className="mt-1 text-[10px] text-fiscal-green-600">
                                  Use imagens na proporção correta para melhor visualização sem distorções no site.
                                </p>
                              </div>
                              {localSettings.banner_image_url && (
                                <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                  <span>URL atual:</span>
                                  <span className="font-mono text-xs truncate max-w-[200px]">{localSettings.banner_image_url}</span>
                                </div>
                              )}
                            </div>
                            {localSettings.banner_image_url && (
                              <div className="flex flex-col border border-dashed border-gray-200 rounded-md p-4 bg-white">
                                <div className="text-xs text-gray-500 mb-2 flex items-center justify-between">
                                  <span>Banner atual:</span>
                                  <span className="text-fiscal-green-600 font-medium flex items-center gap-1">
                                    <Check className="w-3.5 h-3.5" /> Salvo no Supabase
                                  </span>
                                </div>
                                <div className="relative bg-gray-50 rounded overflow-hidden">
                                  <img 
                                    src={localSettings.banner_image_url} 
                                    alt="Banner principal" 
                                    className="w-full object-cover h-[160px]"
                                  />
                                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1.5">
                                    <div className="flex justify-between items-center">
                                      <span>1920 x 580 px (recomendado)</span>
                                      <a 
                                        href={localSettings.banner_image_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-300 hover:text-blue-200 underline flex items-center gap-1"
                                      >
                                        <Eye className="w-3 h-3" /> Ver tamanho real
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </FormField>
                        <FormField id="useOverlayText" label="Usar Texto Sobreposto no Banner">
                          <div className="flex items-center space-x-3">
                            <Switch 
                              id="useOverlayText" 
                              checked={localSettings.use_overlay_text || false} 
                              onCheckedChange={(value) => handleSettingsChange('use_overlay_text', value)}
                            />
                            <Label htmlFor="useOverlayText" className="text-sm text-muted-foreground">
                              {localSettings.use_overlay_text ? 'Texto sobreposto ativado' : 'Texto sobreposto desativado'}
                            </Label>
                          </div>
                          <div className="text-xs text-gray-500 mt-2 space-y-1 bg-gray-50 p-2 rounded-md">
                            <p>Quando ativado, exibe o nome e descrição da loja sobre o banner principal.</p>
                            <p>Recomendado para banners com fundo escuro ou com área livre para texto.</p>
                            <div className="mt-2 flex items-center gap-2 text-fiscal-green-600">
                              <div className="w-3 h-3 rounded-full bg-fiscal-green-500"></div>
                              <span className="font-medium">Dica:</span> 
                              <span>Use imagens de 1920 x 580 pixels com espaço à esquerda para o texto.</span>
                            </div>
                          </div>
                        </FormField>
                      </div>
                      <div className="text-xs px-3 py-2 bg-gray-100 border border-gray-200 rounded mt-2">
                        <p className="font-medium text-gray-700">Importante:</p>
                        <ul className="list-disc pl-4 mt-1 space-y-1 text-gray-600">
                          <li>O banner será exibido em tela cheia na página inicial da loja</li>
                          <li>Em dispositivos móveis, a altura será ajustada automaticamente</li>
                          <li>Posicione elementos importantes no centro da imagem</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="layoutLoja">
              <Card>
                <CardHeader className="space-y-1 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                  <CardTitle className="text-2xl bg-gradient-to-r from-fiscal-green-500 to-fiscal-green-600 bg-clip-text text-transparent">Layout da Loja</CardTitle>
                  <CardDescription>
                    Defina como os produtos são exibidos e quais recursos estarão disponíveis.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4 p-6 rounded-lg bg-gray-50 backdrop-blur-sm border border-gray-200 shadow-sm">
                      <h3 className="font-medium text-fiscal-green-700 flex items-center gap-2 pb-2 border-b border-gray-100">
                        <div className="w-1 h-5 bg-fiscal-green-500 rounded-full"></div>
                        Exibição de Produtos
                      </h3>
                      <div className="space-y-4">
                        <FormField 
                          id="productCardsPerRow" 
                          label="Produtos por Linha" 
                          description={`${localSettings.product_cards_per_row || 4} produtos`}
                        >
                          <Slider 
                            id="productCardsPerRow" 
                            defaultValue={[localSettings.product_cards_per_row || 4]} 
                            min={1} 
                            max={6} 
                            step={1} 
                            onValueChange={([value]) => handleSettingsChange('product_cards_per_row', value)}
                            className="py-4"
                          />
                        </FormField>
                        <FormField id="showProductRatings" label="Avaliações de Produtos">
                          <div className="flex items-center space-x-3">
                            <Switch 
                              id="showProductRatings" 
                              checked={localSettings.show_product_ratings || false} 
                              onCheckedChange={(value) => handleSettingsChange('show_product_ratings', value)}
                            />
                            <Label htmlFor="showProductRatings" className="text-sm text-muted-foreground">
                              {localSettings.show_product_ratings ? 'Exibindo avaliações' : 'Avaliações ocultas'}
                            </Label>
                          </div>
                        </FormField>
                      </div>
                    </div>

                    <div className="space-y-4 p-6 rounded-lg bg-gray-50 backdrop-blur-sm border border-gray-200 shadow-sm">
                      <h3 className="font-medium text-fiscal-green-700 flex items-center gap-2 pb-2 border-b border-gray-100">
                        <div className="w-1 h-5 bg-fiscal-green-500 rounded-full"></div>
                        Recursos de Produto
                      </h3>
                      <div className="space-y-4">
                        <FormField id="showDiscountBadge" label="Selo de Desconto">
                          <div className="flex items-center space-x-3">
                            <Switch 
                              id="showDiscountBadge" 
                              checked={localSettings.show_discount_badge || false} 
                              onCheckedChange={(value) => handleSettingsChange('show_discount_badge', value)}
                            />
                            <Label htmlFor="showDiscountBadge" className="text-sm text-muted-foreground">
                              {localSettings.show_discount_badge ? 'Exibindo selo' : 'Selo oculto'}
                            </Label>
                          </div>
                        </FormField>
                        <FormField id="displayProductQuickView" label="Visualização Rápida">
                          <div className="flex items-center space-x-3">
                            <Switch 
                              id="displayProductQuickView" 
                              checked={localSettings.display_product_quick_view || false} 
                              onCheckedChange={(value) => handleSettingsChange('display_product_quick_view', value)}
                            />
                            <Label htmlFor="displayProductQuickView" className="text-sm text-muted-foreground">
                              {localSettings.display_product_quick_view ? 'Visualização rápida ativada' : 'Visualização rápida desativada'}
                            </Label>
                          </div>
                        </FormField>
                      </div>
                    </div>

                    <div className="space-y-4 p-6 rounded-lg bg-gray-50 backdrop-blur-sm border border-gray-200 shadow-sm">
                      <h3 className="font-medium text-fiscal-green-700 flex items-center gap-2 pb-2 border-b border-gray-100">
                        <div className="w-1 h-5 bg-fiscal-green-500 rounded-full"></div>
                        Recursos Sociais
                      </h3>
                      <div className="space-y-4">
                        <FormField id="enableWishlist" label="Lista de Desejos">
                          <div className="flex items-center space-x-3">
                            <Switch 
                              id="enableWishlist" 
                              checked={localSettings.enable_wishlist || false} 
                              onCheckedChange={(value) => handleSettingsChange('enable_wishlist', value)}
                            />
                            <Label htmlFor="enableWishlist" className="text-sm text-muted-foreground">
                              {localSettings.enable_wishlist ? 'Lista de desejos ativada' : 'Lista de desejos desativada'}
                            </Label>
                          </div>
                        </FormField>
                        <FormField id="showSocialShareButtons" label="Compartilhamento Social">
                          <div className="flex items-center space-x-3">
                            <Switch 
                              id="showSocialShareButtons" 
                              checked={localSettings.show_social_share_buttons || false} 
                              onCheckedChange={(value) => handleSettingsChange('show_social_share_buttons', value)}
                            />
                            <Label htmlFor="showSocialShareButtons" className="text-sm text-muted-foreground">
                              {localSettings.show_social_share_buttons ? 'Botões de compartilhamento ativos' : 'Botões de compartilhamento desativados'}
                            </Label>
                          </div>
                        </FormField>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="estiloCartoes">
              <Card>
                <CardHeader className="space-y-1 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                  <CardTitle className="text-2xl bg-gradient-to-r from-fiscal-green-500 to-fiscal-green-600 bg-clip-text text-transparent">Estilo dos Cartões</CardTitle>
                  <CardDescription>
                    Personalize a aparência e o comportamento dos cartões de produto em sua loja.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4 p-6 rounded-lg bg-gray-50 backdrop-blur-sm border border-gray-200 shadow-sm">
                      <h3 className="font-medium text-fiscal-green-700 flex items-center gap-2 pb-2 border-b border-gray-100">
                        <div className="w-1 h-5 bg-fiscal-green-500 rounded-full"></div>
                        Aparência do Cartão
                      </h3>
                      <div className="space-y-4">
                        <FormField id="cardBorderEnabled" label="Borda do Cartão">
                          <div className="flex items-center space-x-3">
                            <Switch 
                              id="cardBorderEnabled" 
                              checked={localCardStyles.card_border_enabled || false} 
                              onCheckedChange={(value) => handleCardStylesChange('card_border_enabled', value)}
                            />
                            <Label htmlFor="cardBorderEnabled" className="text-sm text-muted-foreground">
                              {localCardStyles.card_border_enabled ? 'Borda ativada' : 'Borda desativada'}
                            </Label>
                          </div>
                        </FormField>
                        <FormField id="cardShadowEnabled" label="Sombra do Cartão">
                          <div className="flex items-center space-x-3">
                            <Switch 
                              id="cardShadowEnabled" 
                              checked={localCardStyles.card_shadow_enabled || false} 
                              onCheckedChange={(value) => handleCardStylesChange('card_shadow_enabled', value)}
                            />
                            <Label htmlFor="cardShadowEnabled" className="text-sm text-muted-foreground">
                              {localCardStyles.card_shadow_enabled ? 'Sombra ativada' : 'Sombra desativada'}
                            </Label>
                          </div>
                        </FormField>
                        <FormField 
                          id="cardShadowIntensity" 
                          label="Intensidade da Sombra"
                          description={`Nível ${localCardStyles.card_shadow_intensity || 1} de 5`}
                        >
                          <Slider 
                            id="cardShadowIntensity" 
                            defaultValue={[localCardStyles.card_shadow_intensity || 1]} 
                            min={0} 
                            max={5} 
                            step={1} 
                            onValueChange={([value]) => handleCardStylesChange('card_shadow_intensity', value)}
                            className="py-4"
                            disabled={!localCardStyles.card_shadow_enabled}
                          />
                        </FormField>
                        <FormField id="cardHoverEffect" label="Efeito ao Passar o Mouse">
                          <Select 
                            value={localCardStyles.card_hover_effect || 'none'} 
                            onValueChange={(value) => handleCardStylesChange('card_hover_effect', value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 shadow-md rounded-lg">
                              {hoverEffects.map(effect => (
                                <SelectItem key={effect} value={effect} className="font-medium">
                                  {effect.charAt(0).toUpperCase() + effect.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormField>

                        {/* Novas propriedades para estilo do card */}
                        <FormField id="cardBackgroundColor" label="Cor de Fundo do Cartão">
                          <div className="flex items-center space-x-3">
                            <Input 
                              id="cardBackgroundColor" 
                              type="color"
                              value={localCardStyles.card_background_color || '#ffffff'} 
                              onChange={(e) => handleCardStylesChange('card_background_color', e.target.value)}
                              className="h-10 w-24 p-1 cursor-pointer"
                            />
                            <span className="text-sm text-muted-foreground">
                              {localCardStyles.card_background_color || '#ffffff'}
                            </span>
                      </div>
                        </FormField>

                        <FormField id="cardBorderColor" label="Cor da Borda" description="Cor da borda quando a borda está ativada">
                          <div className="flex items-center space-x-3">
                            <Input 
                              id="cardBorderColor" 
                              type="color"
                              value={localCardStyles.card_border_color || '#e5e7eb'} 
                              onChange={(e) => handleCardStylesChange('card_border_color', e.target.value)}
                              className="h-10 w-24 p-1 cursor-pointer"
                              disabled={!localCardStyles.card_border_enabled}
                            />
                            <span className="text-sm text-muted-foreground">
                              {localCardStyles.card_border_color || '#e5e7eb'}
                            </span>
                          </div>
                        </FormField>

                        <FormField 
                          id="cardBorderWidth" 
                          label="Largura da Borda"
                          description={`${localCardStyles.card_border_width || 1}px`}
                        >
                          <Slider 
                            id="cardBorderWidth" 
                            defaultValue={[localCardStyles.card_border_width || 1]} 
                            min={1} 
                            max={5} 
                            step={1} 
                            onValueChange={([value]) => handleCardStylesChange('card_border_width', value)}
                            className="py-4"
                            disabled={!localCardStyles.card_border_enabled}
                          />
                        </FormField>

                        <FormField 
                          id="cardBorderRadius" 
                          label="Raio da Borda"
                          description={`${localCardStyles.card_border_radius || 5}px`}
                        >
                          <Slider 
                            id="cardBorderRadius" 
                            defaultValue={[localCardStyles.card_border_radius || 5]} 
                            min={0} 
                            max={20} 
                            step={1} 
                            onValueChange={([value]) => handleCardStylesChange('card_border_radius', value)}
                            className="py-4"
                          />
                        </FormField>
                      </div>
                    </div>

                    <div className="space-y-4 p-6 rounded-lg bg-gray-50 backdrop-blur-sm border border-gray-200 shadow-sm">
                      <h3 className="font-medium text-fiscal-green-700 flex items-center gap-2 pb-2 border-b border-gray-100">
                        <div className="w-1 h-5 bg-fiscal-green-500 rounded-full"></div>
                        Imagem do Produto
                      </h3>
                      <div className="space-y-4">
                        <FormField id="imageAspectRatio" label="Proporção da Imagem">
                          <Select 
                            value={localCardStyles.image_aspect_ratio || '1:1'} 
                            onValueChange={(value) => handleCardStylesChange('image_aspect_ratio', value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 shadow-md rounded-lg">
                              {imageAspectRatios.map(ratio => (
                                <SelectItem key={ratio} value={ratio} className="font-medium">
                                  {ratio}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormField>
                        <FormField id="imageFit" label="Ajuste da Imagem">
                          <Select 
                            value={localCardStyles.image_fit || 'cover'} 
                            onValueChange={(value) => handleCardStylesChange('image_fit', value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 shadow-md rounded-lg">
                              {imageFits.map(fit => (
                                <SelectItem key={fit} value={fit} className="font-medium">
                                  {fit.charAt(0).toUpperCase() + fit.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormField>
                      </div>
                    </div>

                    <div className="space-y-4 p-6 rounded-lg bg-gray-50 backdrop-blur-sm border border-gray-200 shadow-sm">
                      <h3 className="font-medium text-fiscal-green-700 flex items-center gap-2 pb-2 border-b border-gray-100">
                        <div className="w-1 h-5 bg-fiscal-green-500 rounded-full"></div>
                        Informações do Produto
                      </h3>
                      <div className="space-y-4">
                        <FormField id="displayProductName" label="Nome do Produto">
                          <div className="flex items-center space-x-3">
                            <Switch 
                              id="displayProductName" 
                              checked={localCardStyles.display_product_name || false} 
                              onCheckedChange={(value) => handleCardStylesChange('display_product_name', value)}
                            />
                            <Label htmlFor="displayProductName" className="text-sm text-muted-foreground">
                              {localCardStyles.display_product_name ? 'Nome visível' : 'Nome oculto'}
                            </Label>
                          </div>
                        </FormField>
                        <FormField id="displayPrice" label="Preço">
                          <div className="flex items-center space-x-3">
                            <Switch 
                              id="displayPrice" 
                              checked={localCardStyles.display_price || false} 
                              onCheckedChange={(value) => handleCardStylesChange('display_price', value)}
                            />
                            <Label htmlFor="displayPrice" className="text-sm text-muted-foreground">
                              {localCardStyles.display_price ? 'Preço visível' : 'Preço oculto'}
                            </Label>
                          </div>
                        </FormField>
                        <FormField id="displayOriginalPrice" label="Preço Original">
                          <div className="flex items-center space-x-3">
                            <Switch 
                              id="displayOriginalPrice" 
                              checked={localCardStyles.display_original_price || false} 
                              onCheckedChange={(value) => handleCardStylesChange('display_original_price', value)}
                            />
                            <Label htmlFor="displayOriginalPrice" className="text-sm text-muted-foreground">
                              {localCardStyles.display_original_price ? 'Preço original visível' : 'Preço original oculto'}
                            </Label>
                          </div>
                        </FormField>
                        <FormField id="displayDiscountPercentage" label="Percentual de Desconto">
                          <div className="flex items-center space-x-3">
                            <Switch 
                              id="displayDiscountPercentage" 
                              checked={localCardStyles.display_discount_percentage || false} 
                              onCheckedChange={(value) => handleCardStylesChange('display_discount_percentage', value)}
                            />
                            <Label htmlFor="displayDiscountPercentage" className="text-sm text-muted-foreground">
                              {localCardStyles.display_discount_percentage ? 'Desconto visível' : 'Desconto oculto'}
                            </Label>
                          </div>
                        </FormField>
                      </div>
                    </div>

                    <div className="space-y-4 p-6 rounded-lg bg-gray-50 backdrop-blur-sm border border-gray-200 shadow-sm">
                      <h3 className="font-medium text-fiscal-green-700 flex items-center gap-2 pb-2 border-b border-gray-100">
                        <div className="w-1 h-5 bg-fiscal-green-500 rounded-full"></div>
                        Botões
                      </h3>
                      <div className="space-y-4">
                        <FormField id="buttonText" label="Texto do Botão Principal">
                          <Input 
                            id="buttonText" 
                            value={localCardStyles.button_text || ''} 
                            onChange={(e) => handleCardStylesChange('button_text', e.target.value)}
                            placeholder="Ex: Adicionar ao Carrinho"
                          />
                        </FormField>
                        <FormField id="secondaryButtonEnabled" label="Botão Secundário">
                          <div className="flex items-center space-x-3">
                            <Switch 
                              id="secondaryButtonEnabled" 
                              checked={localCardStyles.secondary_button_enabled || false} 
                              onCheckedChange={(value) => handleCardStylesChange('secondary_button_enabled', value)}
                            />
                            <Label htmlFor="secondaryButtonEnabled" className="text-sm text-muted-foreground">
                              {localCardStyles.secondary_button_enabled ? 'Botão secundário ativo' : 'Botão secundário desativado'}
                            </Label>
                          </div>
                        </FormField>
                        <FormField id="secondaryButtonText" label="Texto do Botão Secundário">
                          <Input 
                            id="secondaryButtonText" 
                            value={localCardStyles.secondary_button_text || ''} 
                            onChange={(e) => handleCardStylesChange('secondary_button_text', e.target.value)}
                            placeholder="Ex: Ver Detalhes"
                            disabled={!localCardStyles.secondary_button_enabled}
                          />
                        </FormField>
                        <FormField id="buttonsDisplayStyle" label="Estilo de Exibição dos Botões">
                          <Select 
                            value={localCardStyles.buttons_display_style || 'always'} 
                            onValueChange={(value) => handleCardStylesChange('buttons_display_style', value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 shadow-md rounded-lg">
                              {buttonsDisplayStyles.map(style => (
                                <SelectItem key={style} value={style} className="font-medium">
                                  {style.charAt(0).toUpperCase() + style.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormField>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rodapeConfig">
              <Card>
                <CardHeader className="space-y-1 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                  <CardTitle className="text-2xl bg-gradient-to-r from-fiscal-green-500 to-fiscal-green-600 bg-clip-text text-transparent">Configurações do Rodapé</CardTitle>
                  <CardDescription>
                    Personalize as informações exibidas no rodapé da sua loja.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-x-6 gap-y-8">
                    <div className="space-y-4 p-6 rounded-lg bg-gray-50 backdrop-blur-sm border border-gray-200 shadow-sm md:col-span-2">
                      <h3 className="font-medium text-fiscal-green-700 flex items-center gap-2 pb-2 border-b border-gray-100">
                        <div className="w-1 h-5 bg-fiscal-green-500 rounded-full"></div>
                        Informações de Contato e Empresa
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <FormField id="store_cnpj" label="CNPJ da Loja">
                          <Input 
                            id="store_cnpj" 
                            value={localSettings.store_cnpj || ''} 
                            onChange={(e) => handleSettingsChange('store_cnpj', e.target.value)}
                            placeholder="00.000.000/0001-00"
                          />
                        </FormField>
                        <FormField id="store_phone" label="Telefone Principal">
                          <Input 
                            id="store_phone" 
                            value={localSettings.store_phone || ''} 
                            onChange={(e) => handleSettingsChange('store_phone', e.target.value)}
                            placeholder="(00) 00000-0000"
                          />
                        </FormField>
                        <FormField id="store_email" label="Email de Contato">
                          <Input 
                            id="store_email" 
                            type="email"
                            value={localSettings.store_email || ''} 
                            onChange={(e) => handleSettingsChange('store_email', e.target.value)}
                            placeholder="contato@sualoja.com"
                          />
                        </FormField>
                        <FormField id="store_address" label="Endereço Completo">
                          <Input 
                            id="store_address" 
                            value={localSettings.store_address || ''} 
                            onChange={(e) => handleSettingsChange('store_address', e.target.value)}
                            placeholder="Rua Exemplo, 123, Bairro, Cidade - UF, CEP 00000-000"
                          />
                        </FormField>
                      </div>
                    </div>

                    <div className="space-y-4 p-6 rounded-lg bg-gray-50 backdrop-blur-sm border border-gray-200 shadow-sm">
                      <h3 className="font-medium text-fiscal-green-700 flex items-center gap-2 pb-2 border-b border-gray-100">
                        <div className="w-1 h-5 bg-fiscal-green-500 rounded-full"></div>
                        Formas de Pagamento
                      </h3>
                      <FormField 
                        id="footer_payment_methods" 
                        label="Formas de Pagamento Aceitas"
                        description="Liste as formas de pagamento separadas por vírgula (ex: Boleto, Pix, Cartão de Crédito)."
                      >
                        <Textarea 
                          id="footer_payment_methods" 
                          value={localSettings.footer_payment_methods || ''} 
                          onChange={(e) => handleSettingsChange('footer_payment_methods', e.target.value)}
                          placeholder="Boleto, Pix, Visa, Mastercard"
                          className="min-h-[80px]"
                        />
                      </FormField>
                      <FormField 
                        id="footer_card_flags" 
                        label="Bandeiras de Cartão Aceitas"
                        description="Liste as bandeiras de cartão separadas por vírgula (ex: Visa, Mastercard, Elo)."
                      >
                        <Textarea 
                          id="footer_card_flags" 
                          value={localSettings.footer_card_flags || ''} 
                          onChange={(e) => handleSettingsChange('footer_card_flags', e.target.value)}
                          placeholder="Visa, Mastercard, Elo, Amex"
                          className="min-h-[80px]"
                        />
                      </FormField>
                    </div>
                    
                    <div className="space-y-4 p-6 rounded-lg bg-gray-50 backdrop-blur-sm border border-gray-200 shadow-sm">
                      <h3 className="font-medium text-fiscal-green-700 flex items-center gap-2 pb-2 border-b border-gray-100">
                        <div className="w-1 h-5 bg-fiscal-green-500 rounded-full"></div>
                        Redes Sociais
                      </h3>
                      <div className="space-y-4">
                        <FormField id="footer_social_facebook" label="Facebook URL">
                          <Input 
                            id="footer_social_facebook" 
                            value={localSettings.footer_social_facebook || ''} 
                            onChange={(e) => handleSettingsChange('footer_social_facebook', e.target.value)}
                            placeholder="https://facebook.com/sualoja"
                          />
                        </FormField>
                        <FormField id="footer_social_instagram" label="Instagram URL">
                          <Input 
                            id="footer_social_instagram" 
                            value={localSettings.footer_social_instagram || ''} 
                            onChange={(e) => handleSettingsChange('footer_social_instagram', e.target.value)}
                            placeholder="https://instagram.com/sualoja"
                          />
                        </FormField>
                        <FormField id="footer_social_twitter" label="Twitter (X) URL">
                          <Input 
                            id="footer_social_twitter" 
                            value={localSettings.footer_social_twitter || ''} 
                            onChange={(e) => handleSettingsChange('footer_social_twitter', e.target.value)}
                            placeholder="https://twitter.com/sualoja"
                          />
                        </FormField>
                        <FormField id="footer_social_linkedin" label="LinkedIn URL">
                          <Input 
                            id="footer_social_linkedin" 
                            value={localSettings.footer_social_linkedin || ''} 
                            onChange={(e) => handleSettingsChange('footer_social_linkedin', e.target.value)}
                            placeholder="https://linkedin.com/company/sualoja"
                          />
                        </FormField>
                        <FormField id="footer_social_youtube" label="YouTube URL">
                          <Input 
                            id="footer_social_youtube" 
                            value={localSettings.footer_social_youtube || ''} 
                            onChange={(e) => handleSettingsChange('footer_social_youtube', e.target.value)}
                            placeholder="https://youtube.com/sualoja"
                          />
                        </FormField>
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-4 p-6 rounded-lg bg-gray-50 backdrop-blur-sm border border-gray-200 shadow-sm">
                      <h3 className="font-medium text-fiscal-green-700 flex items-center gap-2 pb-2 border-b border-gray-100">
                        <div className="w-1 h-5 bg-fiscal-green-500 rounded-full"></div>
                        Textos Adicionais do Rodapé
                      </h3>
                      <FormField 
                        id="footer_custom_text" 
                        label="Texto Personalizado do Rodapé"
                        description="Um breve texto que aparece no rodapé, como um slogan ou informação adicional."
                      >
                        <Textarea 
                          id="footer_custom_text" 
                          value={localSettings.footer_custom_text || ''} 
                          onChange={(e) => handleSettingsChange('footer_custom_text', e.target.value)}
                          placeholder="Ex: Todos os direitos reservados."
                          className="min-h-[100px]"
                        />
                      </FormField>
                       <FormField 
                        id="footer_credits" 
                        label="Texto de Créditos"
                        description="Texto de créditos exibido no final do rodapé."
                      >
                        <Input 
                          id="footer_credits" 
                          value={localSettings.footer_credits || ''} 
                          onChange={(e) => handleSettingsChange('footer_credits', e.target.value)}
                          placeholder="Desenvolvido por Sua Agência"
                        />
                      </FormField>
                    </div>

                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seo">
              <Card>
                <CardHeader className="space-y-1 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                  <CardTitle className="text-2xl bg-gradient-to-r from-fiscal-green-500 to-fiscal-green-600 bg-clip-text text-transparent">SEO e Metadados</CardTitle>
                  <CardDescription>
                    Otimize sua loja para motores de busca.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-6">
                    <div className="space-y-4 p-6 rounded-lg bg-gray-50 backdrop-blur-sm border border-gray-200 shadow-sm">
                      <h3 className="font-medium text-fiscal-green-700 flex items-center gap-2 pb-2 border-b border-gray-100">
                        <div className="w-1 h-5 bg-fiscal-green-500 rounded-full"></div>
                        Informações Básicas
                      </h3>
                      <div className="space-y-4">
                        <FormField id="storeName" label="Nome da Loja">
                          <Input 
                            id="storeName" 
                            value={localSettings.store_name || ''} 
                            onChange={(e) => handleSettingsChange('store_name', e.target.value)}
                            placeholder="Ex: Minha Loja Online"
                          />
                        </FormField>
                        <FormField 
                          id="storeDescription" 
                          label="Descrição da Loja" 
                          description="Uma breve descrição da sua loja para SEO (150-160 caracteres recomendados)"
                        >
                          <Textarea 
                            id="storeDescription" 
                            value={localSettings.store_description || ''} 
                            onChange={(e) => handleSettingsChange('store_description', e.target.value)}
                            placeholder="Ex: Loja especializada em produtos de alta qualidade para..."
                            className="min-h-[100px]"
                          />
                        </FormField>
                        <FormField 
                          id="metaKeywords" 
                          label="Palavras-chave" 
                          description="Separe as palavras-chave com vírgulas"
                        >
                          <Textarea 
                            id="metaKeywords" 
                            value={localSettings.meta_keywords || ''} 
                            onChange={(e) => handleSettingsChange('meta_keywords', e.target.value)}
                            placeholder="Ex: loja online, produtos, categoria1, categoria2"
                            className="min-h-[100px]"
                          />
                        </FormField>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex items-center gap-2 mt-4 bg-yellow-50 p-3 rounded-md border border-yellow-200">
            <Bug className="h-5 w-5 text-yellow-600" />
            <div className="text-sm text-yellow-700">
              <span className="font-medium">Diagnóstico:</span> Os buckets já estão configurados no Supabase ({bucketsInitialized ? 'inicializado' : 'não inicializado'})
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto text-xs border-yellow-300 hover:bg-yellow-100"
              onClick={handleVerificarDados}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <FileSearch className="h-4 w-4 mr-2" />
              )}
              Verificar estado
            </Button>
          </div>

          <div className="flex gap-2 mt-4">
            <Button 
              onClick={handleSalvarApenasImagens}
              variant="outline"
              size="sm"
              disabled={isLoading || isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ImageIcon className="h-4 w-4 mr-2" />
              )}
              Salvar só imagens
            </Button>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-base font-medium text-blue-800 mb-2 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Instruções para upload de imagens
            </h3>
            
            <div className="text-sm text-blue-700 space-y-2">
              <p>Para que as imagens sejam salvas corretamente, siga estas etapas:</p>
              
              <ol className="list-decimal ml-5 space-y-1">
                <li>Faça upload da imagem desejada (logo, favicon ou banner)</li>
                <li>Aguarde até ver o indicador "<span className="font-medium">✓ Salvo</span>" na miniatura</li>
                <li>Clique no botão "<span className="font-medium">Salvar Alterações</span>" no topo da página</li>
                <li>Use o botão "Verificar estado" para confirmar se as imagens foram salvas</li>
              </ol>
              
              <p className="text-xs text-blue-600 mt-2">
                <span className="font-semibold">Obs:</span> Os buckets de armazenamento já estão configurados no Supabase, então a mensagem de erro "already exists" pode ser ignorada.
              </p>
            </div>
          </div>
        </div>
      </div>
    </EcommerceDashboardLayout>
  );
};

export default EcommerceSettingsPage; 