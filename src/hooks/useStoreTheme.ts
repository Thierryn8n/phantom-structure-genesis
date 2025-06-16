import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

// Tipos para as configurações da loja
export interface EcommerceSettings {
  id?: number;
  theme_id?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  header_background_color: string;
  footer_background_color: string;
  font_family: string;
  button_style: string;
  border_radius: number;
  logo_url: string;
  logo_width: number;
  favicon_url: string;
  banner_image_url: string;
  use_overlay_text: boolean;
  product_cards_per_row: number;
  show_product_ratings: boolean;
  show_discount_badge: boolean;
  display_product_quick_view: boolean;
  enable_wishlist: boolean;
  show_social_share_buttons: boolean;
  store_name: string;
  store_description: string;
  meta_keywords: string;
  owner_id?: string;
  created_at?: string;
  updated_at?: string;

  // Novas configurações da loja e rodapé
  store_cnpj?: string;
  store_phone?: string;
  store_email?: string;
  store_address?: string;
  footer_payment_methods?: string;
  footer_card_flags?: string;
  footer_social_facebook?: string;
  footer_social_instagram?: string;
  footer_social_twitter?: string;
  footer_social_linkedin?: string;
  footer_social_youtube?: string;
  footer_custom_text?: string;
  footer_credits?: string;
}

export interface ProductCardStyles {
  id?: number;
  settings_id?: number;
  card_border_enabled: boolean;
  card_shadow_enabled: boolean;
  card_shadow_intensity: number;
  card_hover_effect: string;
  image_aspect_ratio: string;
  image_fit: string;
  display_product_name: boolean;
  display_price: boolean;
  display_original_price: boolean;
  display_discount_percentage: boolean;
  button_text: string;
  secondary_button_enabled: boolean;
  secondary_button_text: string;
  buttons_display_style: string;
  card_background_color: string;
  card_border_color: string;
  card_border_width: number;
  card_border_radius: number;
  created_at?: string;
  updated_at?: string;
}

export interface EcommerceTheme {
  id: number;
  name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  is_default: boolean;
  created_at: string;
}

interface UseStoreThemeReturn {
  settings: EcommerceSettings | null;
  cardStyles: ProductCardStyles | null;
  themes: EcommerceTheme[];
  loading: boolean;
  error: string | null;
  applyTheme: (themeId: number) => Promise<void>;
  saveSettings: (newSettings: Partial<EcommerceSettings>) => Promise<void>;
  saveCardStyles: (newStyles: Partial<ProductCardStyles>) => Promise<void>;
  saveImageUrls: (settings: {
    id?: number;
    logo_url?: string;
    favicon_url?: string;
    banner_image_url?: string;
  }) => Promise<{ success: boolean; data?: any; error?: any }>;
  debugStoreTheme: () => Promise<{ success: boolean; data?: any; error?: any }>;
  setThemeSettings: React.Dispatch<React.SetStateAction<EcommerceSettings | null>>;
}

// Valores padrão para configurações da loja
const defaultSettings: EcommerceSettings = {
  id: 1,
  theme_id: 'moderno',
  primary_color: '#2563eb',
  secondary_color: '#4338ca',
  accent_color: '#f59e0b',
  background_color: '#ffffff',
  header_background_color: '#ffffff',
  footer_background_color: '#000000',
  font_family: 'Inter',
  button_style: 'filled',
  border_radius: 5,
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
  store_name: 'Loja Online',
  store_description: 'Bem-vindo à nossa loja online',
  meta_keywords: '',
  owner_id: '',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),

  // Novas configurações da loja e rodapé
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
  footer_credits: ''
};

// Valores padrão para estilos de cartões de produto
const defaultCardStyles: ProductCardStyles = {
  card_border_enabled: true,
  card_shadow_enabled: true,
  card_shadow_intensity: 1,
  card_hover_effect: 'scale',
  image_aspect_ratio: '3/4',
  image_fit: 'cover',
  display_product_name: true,
  display_price: true,
  display_original_price: true,
  display_discount_percentage: true,
  button_text: 'Adicionar ao Carrinho',
  secondary_button_enabled: true,
  secondary_button_text: 'Ver Detalhes',
  buttons_display_style: 'stacked',
  card_background_color: '#ffffff',
  card_border_color: '#e5e7eb',
  card_border_width: 1,
  card_border_radius: 5
};

// Constantes para cache
const CACHE_KEY_SETTINGS = 'fiscal_flow_theme_settings';
const CACHE_KEY_CARD_STYLES = 'fiscal_flow_card_styles';
const CACHE_KEY_THEMES = 'fiscal_flow_themes';
const CACHE_DURATION = 1000 * 60 * 10; // 10 minutos

// Cria um client Supabase com as variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Hook para gerenciar as configurações de tema da loja
 * @returns {UseStoreThemeReturn} Objeto com configurações, estilos e funções para manipulação
 */
export function useStoreTheme(): UseStoreThemeReturn {
  const [settings, setSettings] = useState<EcommerceSettings | null>(null);
  const [cardStyles, setCardStyles] = useState<ProductCardStyles | null>(null);
  const [themes, setThemes] = useState<EcommerceTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para verificar se o cache está válido
  const isCacheValid = useCallback((cacheTime: number) => {
    return (new Date().getTime() - cacheTime) < CACHE_DURATION;
  }, []);

  // Função para carregar dados do cache local
  const loadFromCache = useCallback(() => {
    try {
      // Tentar carregar configurações do cache
      const cachedSettingsStr = localStorage.getItem(CACHE_KEY_SETTINGS);
      if (cachedSettingsStr) {
        const { data: cachedSettings, timestamp } = JSON.parse(cachedSettingsStr);
        if (isCacheValid(timestamp)) {
          setSettings(cachedSettings);
        }
      }

      // Tentar carregar estilos de cartão do cache
      const cachedCardStylesStr = localStorage.getItem(CACHE_KEY_CARD_STYLES);
      if (cachedCardStylesStr) {
        const { data: cachedCardStyles, timestamp } = JSON.parse(cachedCardStylesStr);
        if (isCacheValid(timestamp)) {
          setCardStyles(cachedCardStyles);
        }
      }

      // Tentar carregar temas do cache
      const cachedThemesStr = localStorage.getItem(CACHE_KEY_THEMES);
      if (cachedThemesStr) {
        const { data: cachedThemes, timestamp } = JSON.parse(cachedThemesStr);
        if (isCacheValid(timestamp)) {
          setThemes(cachedThemes);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar do cache:', err);
    }
  }, [isCacheValid]);

  // Função para salvar dados no cache local
  const saveToCache = useCallback((key: string, data: any) => {
    try {
      const cacheData = {
        data,
        timestamp: new Date().getTime()
      };
      localStorage.setItem(key, JSON.stringify(cacheData));
    } catch (err) {
      console.error('Erro ao salvar no cache:', err);
    }
  }, []);

  // Carrega as configurações iniciais
  useEffect(() => {
    async function loadAll() {
      try {
        setLoading(true);
        // Primeiro tenta carregar do cache
        loadFromCache();
        
        // Carrega as configurações da loja
        const { data: settingsData, error: settingsError } = await supabase
          .from('ecommerce_settings')
          .select('*')
          .limit(1)
          .single();
          
        if (settingsError) {
          // Se não existir configuração, usa os valores padrão
          if (settingsError.code === 'PGRST116') { // Código para "nenhum resultado encontrado"
            setSettings(defaultSettings);
            saveToCache(CACHE_KEY_SETTINGS, defaultSettings);
          } else {
            throw new Error(`Erro ao carregar configurações: ${settingsError.message}`);
          }
        } else {
          setSettings(settingsData);
          saveToCache(CACHE_KEY_SETTINGS, settingsData);
        }
        
        // Carrega os estilos de cartão de produto se as configurações existirem
        if (settingsData) {
          const { data: cardStylesData, error: cardStylesError } = await supabase
            .from('ecommerce_product_card_styles')
            .select('*')
            .eq('settings_id', settingsData.id)
            .limit(1)
            .single();
            
          if (cardStylesError && cardStylesError.code !== 'PGRST116') {
            throw new Error(`Erro ao carregar estilos: ${cardStylesError.message}`);
          }
          
          if (cardStylesData) {
            setCardStyles(cardStylesData);
            saveToCache(CACHE_KEY_CARD_STYLES, cardStylesData);
          } else {
            // Se não houver estilos de cartão, usar padrão
            setCardStyles(defaultCardStyles);
            saveToCache(CACHE_KEY_CARD_STYLES, defaultCardStyles);
          }
        }
        
        // Carrega os temas disponíveis, apenas se necessário (não forem carregados do cache)
        if (themes.length === 0) {
        const { data: themesData, error: themesError } = await supabase
          .from('ecommerce_themes')
          .select('*')
          .order('name', { ascending: true });
          
        if (themesError) {
          throw new Error(`Erro ao carregar temas: ${themesError.message}`);
        }
        
          if (themesData) {
            setThemes(themesData);
            saveToCache(CACHE_KEY_THEMES, themesData);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar configurações de tema:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        
        // Usa valores padrão se não conseguir carregar do servidor
        if (!settings) {
          setSettings(defaultSettings);
        }
        if (!cardStyles) {
          setCardStyles(defaultCardStyles);
        }
      } finally {
        setLoading(false);
      }
    }
    
    loadAll();
  }, [loadFromCache, saveToCache, themes.length]);

  /**
   * Aplica um tema predefinido às configurações atuais
   * @param {number} themeId - ID do tema a ser aplicado
   */
  const applyTheme = useCallback(async (themeId: number): Promise<void> => {
    try {
      // Primeiro verifica se o tema já está no state
      let theme = themes.find(t => t.id === themeId);
      
      // Se não estiver, busca do servidor
      if (!theme) {
        const { data: themeData, error: themeError } = await supabase
        .from('ecommerce_themes')
        .select('*')
        .eq('id', themeId)
        .single();
        
      if (themeError) {
        throw new Error(`Erro ao carregar tema: ${themeError.message}`);
      }
      
        theme = themeData;
      }
      
      if (!settings || !theme) return;
      
      // Aplica as cores do tema
      const updatedSettings: EcommerceSettings = {
        ...settings,
        primary_color: theme.primary_color,
        secondary_color: theme.secondary_color,
        accent_color: theme.accent_color,
        background_color: theme.background_color,
        theme_id: theme.name
      };
      
      // Atualiza no state e no servidor
      setSettings(updatedSettings);
      saveToCache(CACHE_KEY_SETTINGS, updatedSettings);
      
      await saveSettings(updatedSettings);
    } catch (err) {
      console.error('Erro ao aplicar tema:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    }
  }, [settings, themes, saveToCache]);

  /**
   * Função de debug para verificar estado atual
   */
  const debugStoreTheme = async () => {
    try {
      const { data, error } = await supabase
        .from('ecommerce_settings')
        .select('*')
        .limit(1)
        .single();
        
      if (error) {
        console.error('Erro ao verificar estado:', error);
        return { success: false, error };
      }
      
      console.log('Estado atual na tabela ecommerce_settings:', data);
      return { success: true, data };
    } catch (err) {
      console.error('Erro ao depurar state:', err);
      return { success: false, error: err };
    }
  };

  /**
   * Função para salvar diretamente as URLs das imagens
   */
  const saveImageUrls = async (settings: {
    id?: number;
    logo_url?: string;
    favicon_url?: string;
    banner_image_url?: string;
  }) => {
    try {
      if (!settings.id) {
        console.error('ID não fornecido para salvar imagens');
        return { success: false, error: 'ID não fornecido' };
      }
      
      console.log('Salvando URLs das imagens diretamente:', settings);
      
      // Construir objeto apenas com campos de imagem não vazios
      const updateData: any = {};
      
      if (settings.logo_url !== undefined) {
        updateData.logo_url = settings.logo_url;
      }
      
      if (settings.favicon_url !== undefined) {
        updateData.favicon_url = settings.favicon_url;
      }
      
      if (settings.banner_image_url !== undefined) {
        updateData.banner_image_url = settings.banner_image_url;
      }
      
      // Adiciona timestamp de atualização
      updateData.updated_at = new Date().toISOString();
      
      console.log('Dados de atualização:', updateData);
      
      // Atualiza diretamente os campos de imagem
      const { data, error } = await supabase
        .from('ecommerce_settings')
        .update(updateData)
        .eq('id', settings.id)
        .select();
      
      if (error) {
        console.error('Erro ao salvar URLs das imagens:', error);
        return { success: false, error };
      }
      
      console.log('URLs das imagens salvas com sucesso:', data);
      return { success: true, data };
    } catch (err) {
      console.error('Erro ao salvar URLs das imagens:', err);
      return { success: false, error: err };
    }
  };

  /**
   * Salva as configurações da loja
   * @param {Partial<EcommerceSettings>} newSettings - Configurações parciais a serem salvas
   */
  const saveSettings = async (newSettings: Partial<EcommerceSettings>): Promise<void> => {
    try {
      if (!settings) return;
      
      console.log('Salvando configurações:', newSettings);
      
      // VERIFICAÇÃO EXTRA: Verificamos se tem campos de imagem antes de continuar
      const temCamposImagem = newSettings.logo_url !== undefined || 
                             newSettings.favicon_url !== undefined || 
                             newSettings.banner_image_url !== undefined;
      
      console.log('Tem campos de imagem para salvar?', temCamposImagem);
      
      // Cria uma cópia explícita para garantir que dados sensíveis sejam salvos corretamente
      let camposImagem = {};
      
      // Verifica especificamente os campos de imagem e garante que eles sejam incluídos
      if (newSettings.logo_url !== undefined) {
        console.log('Salvando logo_url:', newSettings.logo_url);
        camposImagem = { ...camposImagem, logo_url: newSettings.logo_url };
      } else if (settings.logo_url) {
        camposImagem = { ...camposImagem, logo_url: settings.logo_url };
      }
      
      if (newSettings.favicon_url !== undefined) {
        console.log('Salvando favicon_url:', newSettings.favicon_url);
        camposImagem = { ...camposImagem, favicon_url: newSettings.favicon_url };
      } else if (settings.favicon_url) {
        camposImagem = { ...camposImagem, favicon_url: settings.favicon_url };
      }
      
      if (newSettings.banner_image_url !== undefined) {
        console.log('Salvando banner_image_url:', newSettings.banner_image_url);
        camposImagem = { ...camposImagem, banner_image_url: newSettings.banner_image_url };
      } else if (settings.banner_image_url) {
        camposImagem = { ...camposImagem, banner_image_url: settings.banner_image_url };
      }
      
      console.log('Campos de imagem a serem salvos:', camposImagem);
      
      // Mescla as configurações atuais com as novas, garantindo que os campos de imagem estejam presentes
      const updatedSettings = {
        ...settings,
        ...newSettings,
        ...camposImagem, // Garante que os campos de imagem sejam incluídos
        updated_at: new Date().toISOString()
      };
      
      console.log('Configurações finais a serem salvas:', {
        id: updatedSettings.id,
        logo_url: updatedSettings.logo_url,
        favicon_url: updatedSettings.favicon_url,
        banner_image_url: updatedSettings.banner_image_url,
      });
      
      // MODIFICAÇÃO: Salvamos os campos de imagem diretamente primeiro
      if (temCamposImagem && updatedSettings.id) {
        console.log('Salvando campos de imagem separadamente primeiro');
        const { success, error } = await saveImageUrls({
          id: updatedSettings.id,
          logo_url: updatedSettings.logo_url,
          favicon_url: updatedSettings.favicon_url,
          banner_image_url: updatedSettings.banner_image_url,
        });
        
        if (!success) {
          console.error('Erro ao salvar campos de imagem separadamente:', error);
        } else {
          console.log('Campos de imagem salvos separadamente com sucesso!');
        }
      }
      
      // Verifica se existem novas configurações e se existir registro
      if (updatedSettings.id) {
        // Atualiza no banco de dados
        const { data, error: updateError } = await supabase
          .from('ecommerce_settings')
          .update(updatedSettings)
          .eq('id', updatedSettings.id)
          .select();
        
        if (updateError) {
          console.error('Erro ao atualizar configurações:', updateError);
          throw new Error(`Erro ao salvar configurações: ${updateError.message}`);
        }
        
        console.log('Resposta da atualização:', data);
        
        if (data && data.length > 0) {
          // Verifica se os campos de imagem foram realmente salvos
          const savedData = data[0];
          console.log('Campos salvos no banco:', {
            logo_url: savedData.logo_url, 
            favicon_url: savedData.favicon_url,
            banner_image_url: savedData.banner_image_url
          });
          
          if (
            (newSettings.logo_url && savedData.logo_url !== newSettings.logo_url) ||
            (newSettings.favicon_url && savedData.favicon_url !== newSettings.favicon_url) ||
            (newSettings.banner_image_url && savedData.banner_image_url !== newSettings.banner_image_url)
          ) {
            console.warn('ATENÇÃO: Alguns campos de imagem podem não ter sido salvos corretamente!');
            
            // Tentar salvar novamente apenas os campos de imagem que não foram salvos corretamente
            if (updatedSettings.id) {
              const camposNaoSalvos: any = {};
              
              if (newSettings.logo_url && savedData.logo_url !== newSettings.logo_url) {
                camposNaoSalvos.logo_url = newSettings.logo_url;
              }
              
              if (newSettings.favicon_url && savedData.favicon_url !== newSettings.favicon_url) {
                camposNaoSalvos.favicon_url = newSettings.favicon_url;
              }
              
              if (newSettings.banner_image_url && savedData.banner_image_url !== newSettings.banner_image_url) {
                camposNaoSalvos.banner_image_url = newSettings.banner_image_url;
              }
              
              if (Object.keys(camposNaoSalvos).length > 0) {
                console.log('Tentando salvar novamente apenas os campos de imagem que falharam:', camposNaoSalvos);
                
                const { success } = await saveImageUrls({
                  id: updatedSettings.id,
                  ...camposNaoSalvos
                });
                
                if (success) {
                  console.log('Campos de imagem salvos com sucesso na segunda tentativa!');
                } else {
                  console.error('Falha ao salvar campos de imagem na segunda tentativa');
                }
              }
            }
          } else {
            console.log('Todos os campos de imagem foram salvos com sucesso');
          }
        }
        
        console.log('Configurações salvas com sucesso');
      } else {
        // Cria novo registro
        const { data, error: insertError } = await supabase
          .from('ecommerce_settings')
          .insert(updatedSettings)
          .select();
        
        if (insertError) {
          console.error('Erro ao inserir configurações:', insertError);
          throw new Error(`Erro ao criar configurações: ${insertError.message}`);
        }
        
        console.log('Novas configurações criadas:', data);
        
        if (data && data.length > 0) {
          updatedSettings.id = data[0].id;
        }
      }
      
      // Atualiza o estado local
      setSettings(updatedSettings);
    } catch (err) {
      console.error('Erro ao salvar configurações:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      throw err;
    }
  };

  /**
   * Salva os estilos de cartão de produto
   * @param {Partial<ProductCardStyles>} newStyles - Estilos parciais a serem salvos
   */
  const saveCardStyles = async (newStyles: Partial<ProductCardStyles>): Promise<void> => {
    try {
      if (!settings || !cardStyles) return;
      
      // Mescla os estilos atuais com os novos
      const updatedStyles = {
        ...cardStyles,
        ...newStyles,
        updated_at: new Date().toISOString()
      };
      
      // Salva as alterações no banco de dados
      const { error: updateError } = await supabase
        .from('ecommerce_product_card_styles')
        .update(updatedStyles)
        .eq('id', cardStyles.id);
        
      if (updateError) {
        throw new Error(`Erro ao salvar estilos: ${updateError.message}`);
      }
      
      // Atualiza o estado local
      setCardStyles(updatedStyles);
    } catch (err) {
      console.error('Erro ao salvar estilos de cartão:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      throw err;
    }
  };

  return {
    settings,
    cardStyles,
    themes,
    loading,
    error,
    applyTheme,
    saveSettings,
    saveCardStyles,
    saveImageUrls,
    debugStoreTheme,
    setThemeSettings: setSettings
  };
}

export default useStoreTheme; 