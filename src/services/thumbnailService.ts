import { supabase } from '@/integrations/supabase/client';
import { FiscalNote } from '@/types/FiscalNote';
import { v4 as uuidv4 } from 'uuid';

interface ThumbnailData {
  noteId: string;
  dataUrl: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Serviço para gerenciar miniaturas de pré-visualização das notas fiscais
 */
export class ThumbnailService {
  private static readonly STORAGE_BUCKET = 'note-thumbnails';
  private static readonly TABLE_NAME = 'note_thumbnails';
  private static readonly LOCAL_STORAGE_PREFIX = 'fiscal_flow_thumbnail_';

  /**
   * Gera uma miniatura simplificada para uma nota fiscal
   * @param note Dados da nota fiscal
   * @returns URL de dados da miniatura em base64
   */
  static generateThumbnailDataUrl(note: FiscalNote): string {
    try {
      // Em um cenário real, poderíamos usar uma biblioteca de renderização HTML para canvas
      // como html2canvas para gerar uma imagem real da nota
      // Mas para este MVP, usaremos uma representação simplificada em SVG
      
      // Pegar algumas informações da nota para a miniatura
      const noteNumber = note.noteNumber;
      const customerName = note.customerData.name;
      const totalValue = note.totalValue.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });
      const productCount = note.products.length;
      
      // Criar um SVG simples representando a nota
      const svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
          <rect x="0" y="0" width="400" height="200" fill="#f9fafb" stroke="#e5e7eb" stroke-width="2"/>
          <text x="20" y="30" font-family="Arial" font-size="16" font-weight="bold">Nota #${noteNumber}</text>
          <text x="20" y="60" font-family="Arial" font-size="14">${customerName}</text>
          <line x1="20" y1="70" x2="380" y2="70" stroke="#e5e7eb" stroke-width="1"/>
          <text x="20" y="100" font-family="Arial" font-size="12">Itens: ${productCount}</text>
          <text x="20" y="130" font-family="Arial" font-size="12">Total: ${totalValue}</text>
          <rect x="20" y="150" width="360" height="30" fill="#22c55e" opacity="0.1" rx="4"/>
          <text x="200" y="170" font-family="Arial" font-size="14" text-anchor="middle" fill="#047857">FiscalFlow</text>
        </svg>
      `;
      
      // Converter o SVG para uma URL de dados
      const encodedSvg = encodeURIComponent(svgContent);
      return `data:image/svg+xml;charset=utf-8,${encodedSvg}`;
    } catch (error) {
      console.error('Erro ao gerar miniatura da nota:', error);
      // Retornar uma miniatura de fallback se houver erro
      return 'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22200%22%20viewBox%3D%220%200%20400%20200%22%3E%3Crect%20x%3D%220%22%20y%3D%220%22%20width%3D%22400%22%20height%3D%22200%22%20fill%3D%22%23f9fafb%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22100%22%20font-family%3D%22Arial%22%20font-size%3D%2216%22%20text-anchor%3D%22middle%22%3ENota%20Fiscal%3C%2Ftext%3E%3C%2Fsvg%3E';
    }
  }
  
  /**
   * Gera e salva uma miniatura para uma nota fiscal
   * @param note Dados da nota fiscal
   * @returns ID da miniatura gerada
   */
  static async saveThumbnail(note: FiscalNote): Promise<string | null> {
    if (!note.id) return null;
    
    try {
      // Gerar a miniatura da nota
      const thumbnailData = this.generateThumbnailDataUrl(note);
      
      // Salvar no localStorage para acesso rápido
      localStorage.setItem(
        `${this.LOCAL_STORAGE_PREFIX}${note.id}`, 
        thumbnailData
      );
      
      // Para uma implementação completa, aqui também salvaríamos no Supabase Storage
      // e registraríamos na tabela note_thumbnails 
      
      return note.id;
    } catch (error) {
      console.error('Erro ao salvar miniatura:', error);
      return null;
    }
  }
  
  /**
   * Busca a miniatura de uma nota fiscal
   * @param noteId ID da nota fiscal
   * @returns URL de dados da miniatura
   */
  static async getThumbnail(note: FiscalNote): Promise<string> {
    if (!note.id) return this.generateThumbnailDataUrl(note);
    
    try {
      // Tentar buscar do localStorage primeiro (mais rápido)
      const localData = localStorage.getItem(`${this.LOCAL_STORAGE_PREFIX}${note.id}`);
      
      if (localData) {
        return localData;
      }
      
      // Se não encontrar no localStorage, gerar na hora
      const thumbnailData = this.generateThumbnailDataUrl(note);
      
      // Salvar para uso futuro
      localStorage.setItem(
        `${this.LOCAL_STORAGE_PREFIX}${note.id}`, 
        thumbnailData
      );
      
      return thumbnailData;
    } catch (error) {
      console.error('Erro ao buscar miniatura:', error);
      return this.generateThumbnailDataUrl(note);
    }
  }
  
  /**
   * Remove a miniatura de uma nota fiscal
   * @param noteId ID da nota fiscal
   */
  static async deleteThumbnail(noteId: string): Promise<boolean> {
    try {
      localStorage.removeItem(`${this.LOCAL_STORAGE_PREFIX}${noteId}`);
      // Para uma implementação completa, também removeríamos do Supabase Storage
      return true;
    } catch (error) {
      console.error('Erro ao excluir miniatura:', error);
      return false;
    }
  }
} 