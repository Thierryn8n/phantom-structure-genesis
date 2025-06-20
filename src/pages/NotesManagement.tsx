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
import { Edit, Copy, Trash2, Plus } from 'lucide-react';
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
import { Note } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
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
  data: Note[];
}

type NoteStatus = 'draft' | 'issued' | 'printed' | 'canceled';

const NotesManagement: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/notes`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setNotes(data);
    } catch (error) {
      console.error("Could not fetch the notes!", error);
      toast({
        title: "Error",
        description: "Failed to load notes. Please check the API.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirmation = (id: string) => {
    setNoteToDelete(id);
  };

  const handleCancelDelete = () => {
    setNoteToDelete(null);
  };

  const handleDeleteNote = async () => {
    if (!noteToDelete) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/notes/${noteToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setNotes(notes.filter(note => note.id !== noteToDelete));
      toast({
        title: "Success",
        description: "Note deleted successfully.",
      });
    } catch (error) {
      console.error("Could not delete the note!", error);
      toast({
        title: "Error",
        description: "Failed to delete the note.",
        variant: "destructive",
      });
    } finally {
      setNoteToDelete(null);
    }
  };

  const handleDuplicateNote = async (id: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/notes/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const originalNote = await response.json();

      // Remove the id from the original note so that the API creates a new one
      delete originalNote.id;

      // Set the title to "Copy of <original title>"
      originalNote.title = `Copy of ${originalNote.title}`;

      const createResponse = await fetch(`${import.meta.env.VITE_API_URL}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(originalNote),
      });

      if (!createResponse.ok) {
        throw new Error(`HTTP error! status: ${createResponse.status}`);
      }

      const newNote = await createResponse.json();
      setNotes([...notes, newNote]);
      toast({
        title: "Success",
        description: "Note duplicated successfully.",
      });
    } catch (error) {
      console.error("Could not duplicate the note!", error);
      toast({
        title: "Error",
        description: "Failed to duplicate the note.",
        variant: "destructive",
      });
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(search.toLowerCase()) ||
    note.content.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: NoteStatus): string => {
    switch (status) {
      case 'draft': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'issued': return 'text-green-600 bg-green-50 border-green-200';
      case 'printed': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'canceled': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusLabel = (status: NoteStatus): string => {
    switch (status) {
      case 'draft': return 'Rascunho';
      case 'issued': return 'Emitida';
      case 'printed': return 'Impressa';
      case 'canceled': return 'Cancelada';
      default: return 'Desconhecido';
    }
  };

  return (
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Título</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center">Carregando...</TableCell>
            </TableRow>
          ) : filteredNotes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center">Nenhuma nota encontrada.</TableCell>
            </TableRow>
          ) : (
            filteredNotes.map((note) => (
              <TableRow key={note.id}>
                <TableCell className="font-medium">{note.title}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(note.status)}>
                    {getStatusLabel(note.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => navigate(`/notes/${note.id}`)}>
                        <Edit className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicateNote(note.id)}>
                        <Copy className="mr-2 h-4 w-4" /> Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDeleteConfirmation(note.id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

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
  );
};

export default NotesManagement;
