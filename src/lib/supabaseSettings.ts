import { supabase } from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { executeWithTokenRefresh, isJwtExpiredError, refreshAuthSession } from '@/utils/auth-helpers';

// Interfaces para as configurações de usuário
export interface UserSettings {
  id?: string;
  user_id: string;
  company_data: CompanyData;
  installment_fees: InstallmentFee[];
  delivery_settings: DeliverySettings;
  printer_settings: PrinterSettings;
  created_at?: string;
  updated_at?: string;
}

export interface CompanyData {
  name: string;
  cnpj: string;
  address: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone: string;
  email: string;
  logo_url?: string;
  logo_path?: string;
}

export interface InstallmentFee {
  installments: number;
  percentage: number;
}

export interface DeliverySettings {
  delivery_radii: DeliveryRadius[];
}

export interface DeliveryRadius {
  id: string;
  distance: number;
  fee: number;
}

export interface PrinterSettings {
  default_printer: string;
  auto_print: boolean;
}

// Nome da tabela no Supabase
const TABLE_NAME = 'user_settings';
// Nome do bucket para armazenar logos
const LOGO_BUCKET = 'company_logos';

/**
 * Carrega as configurações do usuário do Supabase
 * @param userId ID do usuário
 * @returns Configurações do usuário ou uma configuração padrão se não existir
 */
export async function loadSettings(userId: string): Promise<UserSettings> {
  try {
    const loadSettingsOperation = async () => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // Se for erro de JWT expirado, indicar para o executeWithTokenRefresh
        if (isJwtExpiredError(error)) {
          throw error;
        }
        console.error('Erro ao carregar configurações:', error);
        return getDefaultSettings(userId);
      }

      return data as UserSettings;
    };

    // Executa com renovação de token automática se necessário
    const result = await executeWithTokenRefresh(loadSettingsOperation);
    return result || getDefaultSettings(userId);
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
    return getDefaultSettings(userId);
  }
}

/**
 * Salva as configurações do usuário no Supabase
 * @param settings Configurações do usuário
 * @returns Status da operação
 */
export async function saveSettings(settings: UserSettings): Promise<{ success: boolean; error?: string }> {
  try {
    const saveSettingsOperation = async () => {
      // Verificar se as configurações já existem
      const { data: existingSettings } = await supabase
        .from(TABLE_NAME)
        .select('id')
        .eq('user_id', settings.user_id)
        .single();

      let result;
      
      if (existingSettings) {
        // Atualizar configurações existentes
        result = await supabase
          .from(TABLE_NAME)
          .update({
            ...settings,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSettings.id);
      } else {
        // Criar novas configurações
        result = await supabase
          .from(TABLE_NAME)
          .insert({
            ...settings,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }

      if (result.error) {
        // Se for erro de JWT expirado, indicar para o executeWithTokenRefresh
        if (isJwtExpiredError(result.error)) {
          throw result.error;
        }
        console.error('Erro ao salvar configurações:', result.error);
        return { success: false, error: result.error.message };
      }

      return { success: true };
    };

    // Executa com renovação de token automática se necessário
    const result = await executeWithTokenRefresh(saveSettingsOperation);
    return result || { success: false, error: 'Erro na operação após renovação da sessão' };
  } catch (error: any) {
    console.error('Erro ao salvar configurações:', error);
    return { success: false, error: error.message || 'Erro desconhecido' };
  }
}

/**
 * Faz upload do logo da empresa para o Supabase Storage
 * @param userId ID do usuário
 * @param file Arquivo do logo
 * @returns URL pública e caminho do arquivo
 */
export async function uploadCompanyLogo(userId: string, file: File): Promise<{ url: string; path: string } | null> {
  try {
    const uploadLogoOperation = async () => {
      // Verificar se é uma imagem válida
      if (!file.type.match(/image\/(jpeg|jpg|png|gif|webp)/i)) {
        throw new Error('Formato de arquivo inválido. Use JPEG, PNG, GIF ou WebP.');
      }

      // Limitar tamanho do arquivo (2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('O tamanho do arquivo não pode exceder 2MB.');
      }

      // Criar nome de arquivo único
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}_${uuidv4()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Fazer upload do arquivo
      const { error: uploadError } = await supabase.storage
        .from(LOGO_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        // Se for erro de JWT expirado, indicar para o executeWithTokenRefresh
        if (isJwtExpiredError(uploadError)) {
          throw uploadError;
        }
        console.error('Erro ao fazer upload do logo:', uploadError);
        return null;
      }

      // Obter URL pública do arquivo
      const { data: urlData } = await supabase.storage
        .from(LOGO_BUCKET)
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Não foi possível obter a URL pública do logo.');
      }

      return {
        url: urlData.publicUrl,
        path: filePath
      };
    };

    // Executa com renovação de token automática se necessário
    return await executeWithTokenRefresh(uploadLogoOperation);
  } catch (error: any) {
    console.error('Erro ao fazer upload do logo:', error);
    return null;
  }
}

/**
 * Remove o logo da empresa do Supabase Storage
 * @param filePath Caminho do arquivo no Storage
 * @returns Status da operação
 */
export async function removeCompanyLogo(filePath: string): Promise<boolean> {
  try {
    const removeLogoOperation = async () => {
      const { error } = await supabase.storage
        .from(LOGO_BUCKET)
        .remove([filePath]);

      if (error) {
        // Se for erro de JWT expirado, indicar para o executeWithTokenRefresh
        if (isJwtExpiredError(error)) {
          throw error;
        }
        console.error('Erro ao remover logo:', error);
        return false;
      }

      return true;
    };

    // Executa com renovação de token automática se necessário
    const result = await executeWithTokenRefresh(removeLogoOperation);
    return result === true;
  } catch (error) {
    console.error('Erro ao remover logo:', error);
    return false;
  }
}

/**
 * Obtém as configurações padrão para um usuário
 * @param userId ID do usuário
 * @returns Configurações padrão
 */
function getDefaultSettings(userId: string): UserSettings {
  return {
    user_id: userId,
    company_data: {
      name: '',
      cnpj: '',
      address: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
      phone: '',
      email: ''
    },
    installment_fees: [],
    delivery_settings: {
      delivery_radii: []
    },
    printer_settings: {
      default_printer: '',
      auto_print: false
    }
  };
} 