import { supabase } from '@/integrations/supabase/client';

// Tipos para as requisições de impressão
export interface PrintRequest {
  id?: string;
  note_id: string;
  note_data: any;
  created_at?: string;
  printed_at?: string;
  status: 'pending' | 'printed' | 'error';
  device_id: string;
  created_by: string;
}

/**
 * Serviço para gerenciar impressão remota
 */
export const PrintService = {
  /**
   * Envia uma solicitação para impressão em outro dispositivo
   */
  async sendPrintRequest(noteId: string, noteData: any, userId: string | null): Promise<PrintRequest | null> {
    try {
      // Verifica se o ID do usuário está definido
      const safeUserId = userId || localStorage.getItem('default_user_id') || 'guest_user';
      
      // Armazena o ID do usuário padrão se não estiver definido
      if (!userId) {
        localStorage.setItem('default_user_id', safeUserId);
      }
      
      // Gera um ID único para o dispositivo local se não existir
      let deviceId = localStorage.getItem('device_id');
      if (!deviceId) {
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem('device_id', deviceId);
      }

      // Cria a solicitação de impressão
      const printRequest: PrintRequest = {
        note_id: noteId,
        note_data: noteData,
        status: 'pending',
        device_id: deviceId,
        created_by: safeUserId,
      };

      // Insere na tabela de solicitações de impressão
      const { data, error } = await supabase
        .from('print_requests')
        .insert(printRequest)
        .select()
        .single();

      if (error) {
        console.error('Erro ao enviar solicitação de impressão:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao enviar solicitação de impressão:', error);
      return null;
    }
  },

  /**
   * Verifica as solicitações de impressão pendentes para o dispositivo atual
   */
  async getPendingPrintRequests(): Promise<PrintRequest[]> {
    // Obtém o ID do dispositivo local
    const deviceId = localStorage.getItem('device_id');
    if (!deviceId) return [];

    // Busca solicitações pendentes para este dispositivo
    const { data, error } = await supabase
      .from('print_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar solicitações de impressão:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Marca uma solicitação de impressão como impressa
   */
  async markAsPrinted(requestId: string): Promise<boolean> {
    const { error } = await supabase
      .from('print_requests')
      .update({
        status: 'printed',
        printed_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (error) {
      console.error('Erro ao atualizar status da impressão:', error);
      return false;
    }

    return true;
  },

  /**
   * Marca uma solicitação de impressão como com erro
   */
  async markAsError(requestId: string, errorMessage: string): Promise<boolean> {
    const { error } = await supabase
      .from('print_requests')
      .update({
        status: 'error',
        error_message: errorMessage,
      })
      .eq('id', requestId);

    if (error) {
      console.error('Erro ao atualizar status da impressão:', error);
      return false;
    }

    return true;
  },

  /**
   * Configura uma assinatura para ouvir novas solicitações de impressão
   */
  subscribeToNewPrintRequests(callback: (request: PrintRequest) => void) {
    return supabase
      .channel('public:print_requests')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'print_requests',
          filter: `status=eq.pending` 
        },
        (payload) => {
          callback(payload.new as PrintRequest);
        }
      )
      .subscribe();
  },
  
  /**
   * Define um ID de usuário padrão para ser usado quando não houver usuário autenticado
   */
  setDefaultUserId(userId: string): void {
    localStorage.setItem('default_user_id', userId);
  },
  
  /**
   * Obtém o ID do usuário atual (autenticado ou padrão)
   */
  getCurrentUserId(): string {
    return localStorage.getItem('default_user_id') || 'guest_user';
  }
}; 