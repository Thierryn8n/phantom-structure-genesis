import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Edit, Copy, Trash2, Plus, FileText, Printer } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FiscalNote } from '@/types/FiscalNote';
import { NotesService } from '@/services/notesService';
import { PrintService } from '@/services/printService';
import { useToast } from '@/hooks/use-toast';
import { useDeviceDetect } from '@/hooks/useDeviceDetect';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface DataTableProps {
  data: FiscalNote[];
}

const NotesManagement: React.FC = () => {
  const [notes, setNotes] = useState<FiscalNote[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [userId, setUserId] = useState<string>('');
  const [printingNoteId, setPrintingNoteId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isMobile } = useDeviceDetect();
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  useEffect(() => {
    const initializeUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setUserId(session.user.id);
        fetchNotes(session.user.id);
      }
    };
    initializeUser();
  }, []);

  const fetchNotes = async (currentUserId: string) => {
    setLoading(true);
    try {
      const result = await NotesService.getNotes(currentUserId, undefined, 1, 100, true);
      setNotes(result.data);
    } catch (error) {
      console.error("Could not fetch the notes!", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar as notas fiscais.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrintNote = async (note: FiscalNote) => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado.',
        variant: 'destructive',
      });
      return;
    }

    setPrintingNoteId(note.id!);
    try {
      const printRequest = await PrintService.sendPrintRequest(
        note.id!,
        {
          id: note.id,
          noteNumber: note.noteNumber,
          date: note.date,
          products: note.products,
          customerData: note.customerData,
          paymentData: note.paymentData,
          totalValue: note.totalValue,
          status: note.status,
          ownerId: note.ownerId
        },
        user.id
      );

      if (printRequest) {
        toast({
          title: 'Enviado para impressão',
          description: `Orçamento #${note.noteNumber} foi enviado para a fila de impressão.`,
        });
      } else {
        toast({
          title: 'Erro ao enviar',
          description: 'Não foi possível enviar o orçamento para impressão.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao enviar para impressão:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao enviar o orçamento para impressão.',
        variant: 'destructive',
      });
    } finally {
      setPrintingNoteId(null);
    }
  };

  const handleDeleteConfirmation = (noteId: string) => {
    setNoteToDelete(noteId);
  };

  const handleCancelDelete = () => {
    setNoteToDelete(null);
  };

  const handleDeleteNote = async () => {
    if (!noteToDelete || !userId) return;

    try {
      const success = await NotesService.deleteNote(noteToDelete, userId);
      if (success) {
        setNotes(notes.filter(note => note.id !== noteToDelete));
        toast({
          title: "Sucesso",
          description: "Nota fiscal excluída com sucesso.",
        });
      } else {
        throw new Error('Falha ao excluir nota');
      }
    } catch (error) {
      console.error("Could not delete the note!", error);
      toast({
        title: "Erro",
        description: "Falha ao excluir a nota fiscal.",
        variant: "destructive",
      });
    } finally {
      setNoteToDelete(null);
    }
  };

  const handleDuplicateNote = async (id: string) => {
    if (!userId) return;
    
    try {
      const originalNote = await NotesService.getNoteById(id, userId);
      if (!originalNote) {
        throw new Error('Nota não encontrada');
      }

      // Create a copy without the id
      const duplicatedNote: FiscalNote = {
        ...originalNote,
        id: undefined,
        noteNumber: `Cópia de ${originalNote.noteNumber}`,
        status: 'draft',
        createdAt: undefined,
        updatedAt: undefined,
        printedAt: undefined
      };

      const newNote = await NotesService.saveNote(duplicatedNote);
      if (newNote) {
        setNotes([...notes, newNote]);
        toast({
          title: "Sucesso",
          description: "Nota fiscal duplicada com sucesso.",
        });
      }
    } catch (error) {
      console.error("Could not duplicate the note!", error);
      toast({
        title: "Erro",
        description: "Falha ao duplicar a nota fiscal.",
        variant: "destructive",
      });
    }
  };

  const filteredNotes = notes.filter(note =>
    note.noteNumber.toLowerCase().includes(search.toLowerCase()) ||
    note.customerData.name.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'draft': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'issued': return 'text-green-600 bg-green-50 border-green-200';
      case 'printed': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'canceled': return 'text-red-600 bg-red-50 border-red-200';
      case 'finalized': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'draft': return 'Rascunho';
      case 'issued': return 'Emitida';
      case 'printed': return 'Impressa';
      case 'canceled': return 'Cancelada';
      case 'finalized': return 'Finalizada';
      default: return 'Desconhecido';
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Gerenciar Notas Fiscais</h1>
        <Button asChild>
          <Link to="/notes/new" className="flex items-center">
            <Plus className="mr-2 h-4 w-4" /> Criar Nota
          </Link>
        </Button>
      </div>
      <div className="mb-4">
        <Input
          type="search"
          placeholder="Buscar nota..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma nota encontrada</h3>
          <p className="text-gray-500 mb-4">Comece criando sua primeira nota fiscal.</p>
          <Button asChild>
            <Link to="/notes/new" className="flex items-center">
              <Plus className="mr-2 h-4 w-4" /> Criar Primeira Nota
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <div key={note.id} className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden">
              {/* Header do Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">#{note.noteNumber}</h3>
                    <p className="text-sm text-gray-600">{new Date(note.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <Badge className={getStatusColor(note.status)}>
                    {getStatusLabel(note.status)}
                  </Badge>
                </div>
              </div>
              
              {/* Conteúdo do Card */}
              <div className="px-6 py-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Cliente</p>
                    <p className="text-base font-semibold text-gray-900 truncate">{note.customerData.name}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Valor Total</p>
                      <p className="text-xl font-bold text-green-600">R$ {note.totalValue.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-500">Produtos</p>
                      <p className="text-base font-semibold text-gray-900">{note.products.length} {note.products.length === 1 ? 'item' : 'itens'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Footer com Ações */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate(`/notes/${note.id}`)}
                    className="flex items-center hover:bg-blue-50 hover:border-blue-300"
                  >
                    <FileText className="mr-2 h-4 w-4" /> Visualizar
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-200">
                        <span className="sr-only">Abrir menu</span>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => navigate(`/notes/edit/${note.id}`)} className="cursor-pointer">
                        <Edit className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicateNote(note.id!)} className="cursor-pointer">
                        <Copy className="mr-2 h-4 w-4" /> Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handlePrintNote(note)} 
                        disabled={printingNoteId === note.id}
                        className="cursor-pointer"
                      >
                        <Printer className="mr-2 h-4 w-4" /> 
                        {printingNoteId === note.id ? 'Enviando...' : (isMobile ? 'Enviar para Impressão' : 'Imprimir')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteConfirmation(note.id!)} 
                        className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={noteToDelete !== null} onOpenChange={(open) => !open && handleCancelDelete()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá excluir a nota permanentemente. Tem certeza que deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteNote}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </Layout>
  );
};

export default NotesManagement;
