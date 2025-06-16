import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { FiscalNote, NoteFilters, NoteStatus } from '@/types/FiscalNote';
import { ThumbnailService } from './thumbnailService';

export class NotesService {
  // Tabela no Supabase
  private static readonly TABLE_NAME = 'fiscal_notes';

  /**
   * Converte uma FiscalNote de camelCase para snake_case
   */
  private static toSnakeCase(note: FiscalNote): any {
    // Cria um objeto básico com as propriedades comuns
    const result: any = {
      id: note.id,
      note_number: note.noteNumber,
      date: note.date,
      products: note.products,
      customer_data: note.customerData,
      payment_data: note.paymentData,
      total_value: note.totalValue,
      status: note.status,
      owner_id: note.ownerId
    };
    
    // Apenas adiciona seller_id e seller_name se eles existirem
    if (note.sellerId) {
      result.seller_id = note.sellerId;
    }
    
    if (note.sellerName) {
      result.seller_name = note.sellerName;
    }
    
    return result;
  }

  /**
   * Converte um objeto do banco de dados para FiscalNote (snake_case para camelCase)
   */
  private static toCamelCase(data: any): FiscalNote {
    return {
      id: data.id,
      noteNumber: data.note_number,
      date: data.date,
      products: data.products,
      customerData: data.customer_data,
      paymentData: data.payment_data,
      totalValue: data.total_value,
      status: data.status as NoteStatus,
      sellerId: data.seller_id,
      sellerName: data.seller_name,
      ownerId: data.owner_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      printedAt: data.printed_at
    };
  }

  /**
   * Salva uma nova nota fiscal ou atualiza uma existente
   */
  static async saveNote(note: FiscalNote): Promise<FiscalNote | null> {
    try {
      // Verificar se a nota já existe (tem ID)
      if (note.id) {
        // Atualizar nota existente
        const noteData = this.toSnakeCase(note);
        console.log('Atualizando nota existente:', noteData);
        
        const { data, error } = await supabase
          .from(this.TABLE_NAME)
          .update({
            ...noteData,
            updated_at: new Date().toISOString()
          })
          .eq('id', note.id)
          .eq('owner_id', note.ownerId)
          .select('*')
          .single();

        if (error) {
          console.error('Erro na atualização:', error);
          throw error;
        }
        
        const updatedNote = data ? this.toCamelCase(data) : null;
        
        // Gerar miniatura da nota atualizada
        if (updatedNote) {
          await ThumbnailService.saveThumbnail(updatedNote);
        }
        
        return updatedNote;
      } else {
        // Inserir nova nota
        const noteData = this.toSnakeCase(note);
        console.log('Inserindo nova nota:', noteData);
        
        // Se for nova nota, não enviar ID
        delete noteData.id;
        
        const { data, error } = await supabase
          .from(this.TABLE_NAME)
          .insert({
            ...noteData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('*')
          .single();

        if (error) {
          console.error('Erro na inserção:', error.message, error.details, error);
          throw error;
        }
        
        const newNote = data ? this.toCamelCase(data) : null;
        
        // Gerar miniatura da nova nota
        if (newNote) {
          await ThumbnailService.saveThumbnail(newNote);
        }
        
        return newNote;
      }
    } catch (error) {
      console.error('Erro ao salvar nota fiscal:', error);
      throw error; // Propagar o erro para obter mais detalhes
    }
  }

  /**
   * Busca todas as notas fiscais com base nos filtros
   */
  static async getNotes(
    userId: string,
    filters?: NoteFilters,
    page: number = 1,
    pageSize: number = 20,
    isOwner: boolean = false
  ): Promise<{ data: FiscalNote[], count: number }> {
    try {
      // Iniciar a consulta
      let query = supabase
        .from(this.TABLE_NAME)
        .select('*', { count: 'exact' });
      
      // Se for o proprietário, buscar por owner_id, senão buscar por seller_id
      if (isOwner) {
        query = query.eq('owner_id', userId);
      } else {
        // Se for vendedor, buscar apenas suas notas
        query = query.eq('seller_id', userId);
      }

      // Aplicar filtros se existirem
      if (filters) {
        // Filtro por período
        if (filters.startDate) {
          query = query.gte('date', filters.startDate);
        }
        if (filters.endDate) {
          query = query.lte('date', filters.endDate);
        }

        // Filtro por status
        if (filters.status) {
          if (Array.isArray(filters.status)) {
            query = query.in('status', filters.status);
          } else {
            query = query.eq('status', filters.status);
          }
        }

        // Filtro por vendedor (apenas para owner)
        if (filters.sellerId && isOwner) {
          query = query.eq('seller_id', filters.sellerId);
        }

        // Filtro por valor
        if (filters.minValue !== undefined) {
          query = query.gte('total_value', filters.minValue);
        }
        if (filters.maxValue !== undefined) {
          query = query.lte('total_value', filters.maxValue);
        }

        // Filtro por termo de busca (em vários campos)
        if (filters.searchTerm) {
          query = query.or(
            `note_number.ilike.%${filters.searchTerm}%,customer_data->name.ilike.%${filters.searchTerm}%`
          );
        }
      }

      // Aplicar paginação
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      query = query
        .order('created_at', { ascending: false })
        .range(from, to);

      // Executar a consulta
      const { data, error, count } = await query;

      if (error) throw error;
      
      return {
        data: data ? data.map(item => this.toCamelCase(item)) : [],
        count: count || 0
      };
    } catch (error) {
      console.error('Erro ao buscar notas fiscais:', error);
      return { data: [], count: 0 };
    }
  }

  /**
   * Busca uma nota fiscal específica pelo ID
   */
  static async getNoteById(id: string, ownerId: string): Promise<FiscalNote | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('id', id)
        .eq('owner_id', ownerId)
        .single();

      if (error) throw error;
      return data ? this.toCamelCase(data) : null;
    } catch (error) {
      console.error('Erro ao buscar nota fiscal por ID:', error);
      return null;
    }
  }

  /**
   * Atualiza o status de uma nota fiscal
   */
  static async updateNoteStatus(
    id: string,
    status: NoteStatus,
    ownerId: string
  ): Promise<boolean> {
    try {
      const updates: any = {
        status,
        updated_at: new Date().toISOString()
      };

      // Se for marcado como impresso, atualizar também a data de impressão
      if (status === 'printed') {
        updates.printed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from(this.TABLE_NAME)
        .update(updates)
        .eq('id', id)
        .eq('owner_id', ownerId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao atualizar status da nota fiscal:', error);
      return false;
    }
  }

  /**
   * Exclui uma nota fiscal (apenas se for rascunho)
   */
  static async deleteNote(id: string, ownerId: string): Promise<boolean> {
    try {
      // Primeiro verificamos se a nota é um rascunho
      const { data: note, error: fetchError } = await supabase
        .from(this.TABLE_NAME)
        .select('status')
        .eq('id', id)
        .eq('owner_id', ownerId)
        .single();

      if (fetchError) throw fetchError;

      // Se não for rascunho, não permitimos a exclusão
      if (note.status !== 'draft') {
        throw new Error('Apenas notas em rascunho podem ser excluídas');
      }

      // Excluir a nota
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .delete()
        .eq('id', id)
        .eq('owner_id', ownerId);

      if (error) throw error;
      
      // Excluir a miniatura associada
      await ThumbnailService.deleteThumbnail(id);
      
      return true;
    } catch (error) {
      console.error('Erro ao excluir nota fiscal:', error);
      return false;
    }
  }
  
  /**
   * Marca uma nota como impressa
   */
  static async markAsPrinted(id: string, ownerId: string): Promise<boolean> {
    return this.updateNoteStatus(id, 'printed', ownerId);
  }

  /**
   * Marca uma nota fiscal como paga
   */
  static async markAsPaid(
    id: string,
    userId: string
  ): Promise<boolean> {
    try {
      // Primeiro buscar a nota atual para obter os dados de pagamento
      const { data: currentNote, error: fetchError } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('id', id)
        .eq('owner_id', userId)
        .single();

      if (fetchError || !currentNote) {
        throw new Error('Nota não encontrada');
      }

      // Atualizar os dados de pagamento para incluir informação de pagamento
      const paymentData = currentNote.payment_data || {};
      paymentData.paid = true;
      paymentData.paidAt = new Date().toISOString();

      const updates = {
        payment_data: paymentData,
        updated_at: new Date().toISOString()
      };

      // Se a nota não estiver finalizada, finalizá-la
      if (currentNote.status !== 'finalized') {
        updates.status = 'finalized';
      }

      const { error } = await supabase
        .from(this.TABLE_NAME)
        .update(updates)
        .eq('id', id)
        .eq('owner_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao marcar nota como paga:', error);
      return false;
    }
  }
}