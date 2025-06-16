import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  FileText,
  Printer,
  Search,
  Filter,
  FilePlus,
  Calendar,
  User,
  X,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Trash,
  CheckCircle,
  AlertTriangle,
  Ban,
  Clock,
  MoreHorizontal,
  Eye,
  Edit,
  DollarSign,
  Calendar as CalendarIcon,
  CreditCard,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { NotesService } from '@/services/notesService';
import { ThumbnailService } from '@/services/thumbnailService';
import { FiscalNote, NoteFilters, NoteStatus } from '@/types/FiscalNote';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

const NotesManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Estado para armazenar as notas
  const [notes, setNotes] = useState<FiscalNote[]>([]);
  const [totalNotes, setTotalNotes] = useState(0);
  
  // Estado para controlar se o usuário é o proprietário (owner) ou um vendedor
  const [isOwner, setIsOwner] = useState(false);
  const [sellers, setSellers] = useState<any[]>([]); // Lista de vendedores para filtro
  
  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12); // Aumentado para melhor layout de cards
  
  // Estados para os filtros
  const [filters, setFilters] = useState<NoteFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<NoteStatus | ''>('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('');
  const [sellerFilter, setSellerFilter] = useState<string>('');
  const [dateRangeFilter, setDateRangeFilter] = useState({
    startDate: '',
    endDate: ''
  });
  
  // Estados para controle de UI
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");
  
  // Estados para dados estatísticos
  const [stats, setStats] = useState({
    draft: 0,
    issued: 0,
    printed: 0,
    finalized: 0,
    canceled: 0
  });
  
  // Estado para armazenar miniaturas das notas
  const [noteThumbnails, setNoteThumbnails] = useState<Record<string, string>>({});
  
  // Verificar se o usuário é proprietário ou vendedor
  useEffect(() => {
    if (!user) return;
    
    const checkUserRole = async () => {
      try {
        // Verificar se o usuário tem um registro na tabela 'sellers'
        const { data: sellerData, error: sellerError } = await supabase
          .from('sellers')
          .select('id, owner_id')
          .eq('id', user.id)
          .single();
        
        // Se não encontrou como vendedor ou ocorreu um erro,
        // assume que é o proprietário da conta
        if (sellerError || !sellerData) {
          setIsOwner(true);
          
          // Se for proprietário, buscar lista de vendedores para o filtro
          const { data: sellersData } = await supabase
            .from('sellers')
            .select('id, name, email')
            .eq('owner_id', user.id)
            .eq('is_active', true);
          
          setSellers(sellersData || []);
        } else {
          // É um vendedor
          setIsOwner(false);
        }
      } catch (error) {
        console.error('Erro ao verificar função do usuário:', error);
        // Por padrão, tratamos como vendedor (acesso mais restrito)
        setIsOwner(false);
      }
    };
    
    checkUserRole();
  }, [user]);
  
  // Função para filtrar as notas pelo status de pagamento
  const filterNotesByPaymentStatus = (notes: FiscalNote[]): FiscalNote[] => {
    if (!paymentStatusFilter) {
      return notes;
    }
    
    return notes.filter(note => {
      if (paymentStatusFilter === 'paid') {
        return isPaid(note);
      } else if (paymentStatusFilter === 'pending') {
        return !isPaid(note) && note.status !== 'draft';
      } else if (paymentStatusFilter === 'installment') {
        return note.paymentData?.installments > 1;
      }
      return true;
    });
  };
  
  // Buscar notas fiscais do Supabase
  const fetchNotes = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Preparar filtros
      let notesFilters: NoteFilters = {
        ...filters,
        searchTerm: searchTerm || undefined,
        startDate: dateRangeFilter.startDate || undefined,
        endDate: dateRangeFilter.endDate || undefined,
        sellerId: sellerFilter || undefined
      };
      
      // Adicionar filtro de status baseado na tab ativa
      if (activeTab !== "all") {
        notesFilters.status = activeTab as NoteStatus;
      } else if (statusFilter) {
        notesFilters.status = statusFilter;
      }
      
      // Buscar as notas (passando isOwner para filtrar corretamente)
      const result = await NotesService.getNotes(
        user.id,
        notesFilters,
        currentPage,
        pageSize,
        isOwner
      );
      
      // Aplicar filtro de status de pagamento no front-end
      // já que esse filtro não existe no back-end
      const filteredData = paymentStatusFilter 
        ? filterNotesByPaymentStatus(result.data)
        : result.data;
      
      setNotes(filteredData);
      setTotalNotes(result.count);
      
      // Calcular estatísticas para exibir nos badges das tabs
      const allNotes = await NotesService.getNotes(
        user.id,
        { ...notesFilters, status: undefined },
        1,
        1000, // Pegar até 1000 notas para estatísticas
        isOwner
      );
      
      if (allNotes.data) {
        const statsCounts = {
          draft: 0,
          issued: 0,
          printed: 0,
          finalized: 0,
          canceled: 0
        };
        
        allNotes.data.forEach(note => {
          if (statsCounts.hasOwnProperty(note.status)) {
            statsCounts[note.status as keyof typeof statsCounts]++;
          }
        });
        
        setStats(statsCounts);
      }
    } catch (error) {
      console.error('Erro ao buscar notas fiscais:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as notas fiscais.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, filters, searchTerm, statusFilter, paymentStatusFilter, sellerFilter, dateRangeFilter, currentPage, pageSize, isOwner, toast, activeTab]);
  
  // Carregar notas quando o componente é montado ou filtros mudam
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);
  
  // Buscar miniaturas das notas carregadas
  useEffect(() => {
    const loadThumbnails = async () => {
      if (!notes.length) return;
      
      const thumbnails: Record<string, string> = {};
      
      for (const note of notes) {
        if (!note.id) continue;
        
        try {
          const thumbnail = await ThumbnailService.getThumbnail(note);
          thumbnails[note.id] = thumbnail;
        } catch (error) {
          console.error(`Erro ao carregar miniatura da nota ${note.id}:`, error);
        }
      }
      
      setNoteThumbnails(thumbnails);
    };
    
    loadThumbnails();
  }, [notes]);
  
  // Função para obter a miniatura de uma nota específica
  const getNoteThumbnail = (note: FiscalNote): string => {
    if (!note.id || !noteThumbnails[note.id]) {
      // Retornar um placeholder vazio se não houver miniatura
      return '';
    }
    
    return noteThumbnails[note.id];
  };
  
  // Função para excluir uma nota (apenas rascunhos)
  const handleDeleteNote = async () => {
    if (!selectedNoteId || !user) return;
    
    try {
      const deleted = await NotesService.deleteNote(selectedNoteId, user.id);
      
      if (deleted) {
        toast({
          title: 'Nota excluída',
          description: 'A nota foi excluída com sucesso.',
          variant: 'default',
        });
        
        // Atualizar a lista de notas
        fetchNotes();
      } else {
        throw new Error('Não foi possível excluir a nota');
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao excluir a nota.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedNoteId(null);
    }
  };
  
  // Função para confirmar exclusão de uma nota
  const confirmDeleteNote = (noteId: string) => {
    setSelectedNoteId(noteId);
    setIsDeleteDialogOpen(true);
  };
  
  // Função para marcar uma nota como impressa
  const handleMarkAsPrinted = async (noteId: string) => {
    if (!user) return;
    
    try {
      const marked = await NotesService.markAsPrinted(noteId, user.id);
      
      if (marked) {
        toast({
          title: 'Status atualizado',
          description: 'A nota foi marcada como impressa.',
          variant: 'default',
        });
        
        // Atualizar a lista de notas
        fetchNotes();
      }
    } catch (error) {
      console.error('Erro ao marcar como impressa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status da nota.',
        variant: 'destructive',
      });
    }
  };
  
  // Função para atualizar um filtro e reiniciar a paginação
  const updateFilter = (filterUpdate: Partial<NoteFilters>) => {
    setFilters(prev => ({ ...prev, ...filterUpdate }));
    setCurrentPage(1); // Voltar para a primeira página ao mudar filtros
  };
  
  // Função para limpar todos os filtros
  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setStatusFilter('');
    setPaymentStatusFilter('');
    setSellerFilter('');
    setDateRangeFilter({ startDate: '', endDate: '' });
    setCurrentPage(1);
  };
  
  // Função para mudar de página na paginação
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
    setCurrentPage(page);
    }
  };
  
  // Função para verificar se a nota foi paga
  const isPaid = (note: FiscalNote): boolean => {
    // Se a nota está marcada explicitamente como paga
    if (note.paymentData?.paid === true) {
      return true;
    }
    
    // Se a nota está finalizada, consideramos como paga
    if (note.status === 'finalized') {
      return true;
    }
    
    // Verificar se tem informação de pagamento preenchida
    if (note.paymentData) {
      // Especificando explicitamente o tipo para evitar erros
      const method = note.paymentData.method;
      
      // Para métodos como dinheiro, débito e PIX, consideramos como pagamento à vista
      if (['cash', 'debit', 'pix'].includes(method)) {
        return note.status !== 'draft'; // Se não é rascunho, foi pago
      }
      
      // Para cartão de crédito ou outros métodos, verificamos:
      // 1. Se tem data de vencimento e já passou (considerando que foi pago)
      if (note.paymentData.dueDate) {
        const dueDate = new Date(note.paymentData.dueDate);
        const today = new Date();
        return today >= dueDate;
      }
    }
    
    // Se chegou aqui, não temos informação suficiente, depende do status
    return note.status === 'finalized';
  };
  
  // Obter texto e cor para o badge de pagamento
  const getPaymentStatusBadge = (note: FiscalNote) => {
    const paid = isPaid(note);
    
    if (note.status === 'draft') {
      return { text: 'Rascunho', color: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
    else if (paid) {
      return { text: 'Pago', color: 'bg-green-100 text-green-700 border-green-200' };
    } 
    else {
      // Verificar se tem parcelas
      if (note.paymentData?.installments > 1) {
        return { text: 'Parcelado', color: 'bg-blue-100 text-blue-700 border-blue-200' };
      } else {
        return { text: 'Pendente', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
      }
    }
  };
  
  // Renderizar ícone do status
  const renderStatusIcon = (status: NoteStatus) => {
    switch (status) {
      case 'draft':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'issued':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'printed':
        return <Printer className="h-4 w-4 text-green-500" />;
      case 'finalized':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'canceled':
        return <Ban className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };
  
  // Obter texto do status
  const getStatusText = (status: NoteStatus) => {
    switch (status) {
      case 'draft':
        return 'Rascunho';
      case 'issued':
        return 'Emitida';
      case 'printed':
        return 'Impressa';
      case 'finalized':
        return 'Finalizada';
      case 'canceled':
        return 'Cancelada';
      default:
        return 'Desconhecido';
    }
  };
  
  // Obter cor do badge com base no status
  const getStatusColor = (status: NoteStatus): string => {
    switch (status) {
      case 'draft':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'issued':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'printed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'finalized':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'canceled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };
  
  // Renderizar filtro de vendedor (apenas para proprietários)
  const renderSellerFilter = () => {
    if (!isOwner || sellers.length === 0) {
      return null;
    }
    
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Vendedor
        </label>
        <Select
          value={sellerFilter}
          onValueChange={(value) => setSellerFilter(value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos os vendedores" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            {sellers.map((seller) => (
              <SelectItem key={seller.id} value={seller.id}>
                {seller.name || seller.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };
  
  // Calcular o número total de páginas
  const totalPages = Math.max(1, Math.ceil(totalNotes / pageSize));
  
  // Formatar a data para exibição
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return '';
      // Verificar se é uma data ISO ou uma string de data normal
      return dateString.includes('T') 
        ? format(parseISO(dateString), 'dd/MM/yyyy', { locale: ptBR })
        : dateString;
    } catch (error) {
      return dateString;
    }
  };
  
  // Função para marcar uma nota como paga
  const handleMarkAsPaid = async (noteId: string) => {
    if (!user) return;
    
    try {
      const marked = await NotesService.markAsPaid(noteId, user.id);
      
      if (marked) {
        toast({
          title: 'Status atualizado',
          description: 'A nota foi marcada como paga.',
          variant: 'default',
        });
        
        // Atualizar a lista de notas
        fetchNotes();
      }
    } catch (error) {
      console.error('Erro ao marcar como paga:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível marcar a nota como paga.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Layout>
      <div className="space-y-6 bg-slate-50 p-4 rounded-lg bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2UyZThmMCIgb3BhY2l0eT0iMC40IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]">
        <div className="container mx-auto py-6 px-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-1">
                {isOwner ? 'Notas Fiscais' : 'Minhas Notas Fiscais'}
              </h1>
              <p className="text-gray-500 text-sm">
                Gerencie seus orçamentos e notas fiscais
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/notes/new">
                <Button 
                  className="bg-fiscal-green-600 hover:bg-fiscal-green-700 text-white w-full sm:w-auto shadow-sm"
                >
                  <FilePlus className="mr-2 h-5 w-5" />
                  Nova Nota
                </Button>
              </Link>
              
              <Button
                variant="outline"
                onClick={fetchNotes}
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <RefreshCw size={18} />
                Atualizar
              </Button>
            </div>
          </div>
          
          <Card className="p-5 mb-6 border border-gray-200 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Search size={18} />
                </div>
                <Input
                  placeholder="Buscar por número ou cliente..."
                  className="pl-10 pr-4 py-2 bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchNotes()}
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={isFiltersOpen ? "default" : "outline"}
                  onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                  className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  <Filter size={18} />
                  Filtros {Object.keys(filters).length > 0 && `(${Object.keys(filters).length})`}
                </Button>
                
                <Button
                  variant={Object.keys(filters).length > 0 ? "destructive" : "ghost"}
                  onClick={clearFilters}
                  className="flex items-center gap-2"
                  disabled={Object.keys(filters).length === 0}
                >
                  <X size={18} />
                  Limpar
                </Button>
              </div>
            </div>
            
            {isFiltersOpen && (
              <div className="mt-4 p-4 border rounded-md bg-gray-50 animate-in slide-in-from-top">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Filter size={16} className="text-fiscal-green-500" />
                  Filtros Avançados
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <Select
                      value={statusFilter}
                      onValueChange={(value) => setStatusFilter(value as NoteStatus)}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Todos os status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos</SelectItem>
                        <SelectItem value="draft">Rascunho</SelectItem>
                        <SelectItem value="issued">Emitida</SelectItem>
                        <SelectItem value="printed">Impressa</SelectItem>
                        <SelectItem value="finalized">Finalizada</SelectItem>
                        <SelectItem value="canceled">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <div className="flex items-center gap-1">
                        <CreditCard size={14} />
                        Status Pagamento
                      </div>
                    </label>
                    <Select
                      value={paymentStatusFilter}
                      onValueChange={(value) => setPaymentStatusFilter(value)}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos</SelectItem>
                        <SelectItem value="paid">Pagos</SelectItem>
                        <SelectItem value="pending">Pendentes</SelectItem>
                        <SelectItem value="installment">Parcelados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {renderSellerFilter()}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <div className="flex items-center gap-1">
                        <CalendarIcon size={14} />
                        Data Inicial
                      </div>
                    </label>
                    <Input
                      type="date"
                      value={dateRangeFilter.startDate}
                      onChange={(e) => setDateRangeFilter({
                        ...dateRangeFilter,
                        startDate: e.target.value
                      })}
                      className="bg-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <div className="flex items-center gap-1">
                        <CalendarIcon size={14} />
                        Data Final
                      </div>
                    </label>
                    <Input
                      type="date"
                      value={dateRangeFilter.endDate}
                      onChange={(e) => setDateRangeFilter({
                        ...dateRangeFilter,
                        endDate: e.target.value
                      })}
                      className="bg-white"
                    />
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={() => {
                      updateFilter({
                        status: statusFilter || undefined,
                        startDate: dateRangeFilter.startDate || undefined,
                        endDate: dateRangeFilter.endDate || undefined,
                        sellerId: sellerFilter || undefined
                      });
                      fetchNotes();
                    }}
                    className="bg-fiscal-green-600 hover:bg-fiscal-green-700 text-white"
                  >
                    Aplicar Filtros
                  </Button>
                </div>
              </div>
            )}
          </Card>
          
          <Tabs value={activeTab} onValueChange={(value) => {setActiveTab(value); setCurrentPage(1);}}>
            <div className="overflow-x-auto pb-2">
              <TabsList className="mb-4 !bg-white p-[4px] rounded-[20px] border border-gray-300 w-full flex-nowrap">
                <TabsTrigger value="all" className="data-[state=active]:bg-fiscal-green-50 data-[state=active]:text-fiscal-green-700 data-[state=active]:font-medium data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-fiscal-green-300 bg-slate-50 transition-all duration-200 rounded-xl mx-0.5 border border-transparent hover:border-gray-200 text-sm whitespace-nowrap">
                  <span className="flex items-center gap-1">
                    Todas 
                    <Badge className="bg-gray-200 text-gray-700 ml-1">{totalNotes}</Badge>
                  </span>
                </TabsTrigger>
                <TabsTrigger value="draft" className="data-[state=active]:bg-fiscal-green-50 data-[state=active]:text-fiscal-green-700 data-[state=active]:font-medium data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-fiscal-green-300 bg-slate-50 transition-all duration-200 rounded-xl mx-0.5 border border-transparent hover:border-gray-200 text-sm whitespace-nowrap">
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    Rascunhos
                    <Badge className="bg-orange-100 text-orange-700 ml-1">{stats.draft}</Badge>
                  </span>
                </TabsTrigger>
                <TabsTrigger value="issued" className="data-[state=active]:bg-fiscal-green-50 data-[state=active]:text-fiscal-green-700 data-[state=active]:font-medium data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-fiscal-green-300 bg-slate-50 transition-all duration-200 rounded-xl mx-0.5 border border-transparent hover:border-gray-200 text-sm whitespace-nowrap">
                  <span className="flex items-center gap-1">
                    <FileText size={14} />
                    Emitidas
                    <Badge className="bg-blue-100 text-blue-700 ml-1">{stats.issued}</Badge>
                  </span>
                </TabsTrigger>
                <TabsTrigger value="printed" className="data-[state=active]:bg-fiscal-green-50 data-[state=active]:text-fiscal-green-700 data-[state=active]:font-medium data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-fiscal-green-300 bg-slate-50 transition-all duration-200 rounded-xl mx-0.5 border border-transparent hover:border-gray-200 text-sm whitespace-nowrap">
                  <span className="flex items-center gap-1">
                    <Printer size={14} />
                    Impressas
                    <Badge className="bg-green-100 text-green-700 ml-1">{stats.printed}</Badge>
                  </span>
                </TabsTrigger>
                <TabsTrigger value="finalized" className="data-[state=active]:bg-fiscal-green-50 data-[state=active]:text-fiscal-green-700 data-[state=active]:font-medium data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-fiscal-green-300 bg-slate-50 transition-all duration-200 rounded-xl mx-0.5 border border-transparent hover:border-gray-200 text-sm whitespace-nowrap">
                  <span className="flex items-center gap-1">
                    <CheckCircle size={14} />
                    Finalizadas
                    <Badge className="bg-green-100 text-green-700 ml-1">{stats.finalized}</Badge>
                  </span>
                </TabsTrigger>
              </TabsList>
            </div>
    
            <TabsContent value={activeTab} className="mt-0">
              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="h-8 w-8 animate-spin text-fiscal-green-600" />
                    <span className="text-gray-600">Carregando notas...</span>
                  </div>
                </div>
              ) : notes.length === 0 ? (
                <Card className="p-8 text-center bg-gray-50 border border-dashed border-gray-200">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Nenhuma nota encontrada</h2>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    {Object.keys(filters).length > 0 || searchTerm
                      ? 'Não foram encontradas notas com os filtros atuais.'
                      : 'Você ainda não possui notas fiscais cadastradas.'}
                  </p>
                  {Object.keys(filters).length > 0 || searchTerm ? (
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="mx-auto"
                    >
                      Limpar Filtros
                    </Button>
                  ) : (
                    <Link to="/notes/new">
                      <Button className="bg-fiscal-green-600 hover:bg-fiscal-green-700 text-white">
                        <FilePlus className="mr-2" size={16} />
                        Criar primeira nota
                      </Button>
                    </Link>
                  )}
                </Card>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {notes.map((note) => (
                      <Card key={note.id} 
                        className="overflow-hidden border border-gray-300 rounded-[20px] shadow-sm hover:border-fiscal-green-300 hover:shadow-lg transition-all duration-200 bg-white"
                      >
                        <div className="p-4 flex flex-col h-full">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-medium text-xl flex items-center gap-1">
                                <FileText size={18} className="text-fiscal-green-600 mr-1" />
                                #{note.noteNumber}
                              </h3>
                              <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                                <CalendarIcon size={14} />
                                {formatDate(note.date)}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge className={`px-2 py-1 text-xs flex items-center gap-1 ${getStatusColor(note.status)}`}>
                                {renderStatusIcon(note.status)}
                                {getStatusText(note.status)}
                              </Badge>
                              <Badge className={`px-2 py-1 text-xs flex items-center gap-1 ${getPaymentStatusBadge(note).color}`}>
                                <CreditCard className="h-3 w-3" />
                                {getPaymentStatusBadge(note).text}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="mb-3 pb-2 border-b border-gray-100">
                            <div className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                              <User size={14} />
                              Cliente
                            </div>
                            <p className="text-lg font-semibold text-gray-800">{note.customerData.name}</p>
                            <p className="text-xs text-gray-500 truncate">{note.customerData.phone}</p>
                          </div>
                          
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <p className="text-xs text-gray-500">Total:</p>
                              <p className="text-lg font-semibold text-fiscal-green-700 flex items-center gap-1">
                                <DollarSign size={16} />
                                {note.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                            
                            {note.sellerName && (
                              <div className="text-right">
                                <p className="text-xs text-gray-500">Vendedor:</p>
                                <p className="text-sm font-medium">{note.sellerName}</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/notes/view/${note.id}`)}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1 h-8"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Visualizar
                            </Button>
                            
                            <TooltipProvider>
                              <div className="flex items-center space-x-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => handleMarkAsPrinted(note.id!)}
                                      className="h-8 w-8 rounded-full"
                                      disabled={note.status === 'printed' || note.status === 'finalized'}
                                    >
                                      <Printer className="h-4 w-4 text-green-600" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Marcar como impressa
                                  </TooltipContent>
                                </Tooltip>
                                
                                {note.status === 'draft' && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => navigate(`/notes/edit/${note.id}`)}
                                        className="h-8 w-8 rounded-full"
                                      >
                                        <Edit className="h-4 w-4 text-blue-600" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Editar nota
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                                
                                {note.status === 'draft' && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => confirmDeleteNote(note.id!)}
                                        className="h-8 w-8 rounded-full"
                                      >
                                        <Trash className="h-4 w-4 text-red-600" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Excluir nota
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-full"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => navigate(`/notes/view/${note.id}`)}
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      Visualizar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => window.open(`/print/${note.id}`, '_blank')}
                                    >
                                      <Printer className="h-4 w-4 mr-2" />
                                      Abrir para Impressão
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        if (note.id) {
                                          NotesService.updateNoteStatus(note.id, 'finalized', user?.id || '');
                                          fetchNotes();
                                        }
                                      }}
                                      disabled={note.status === 'finalized' || note.status === 'canceled'}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Marcar como Finalizada
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        if (note.id) {
                                          handleMarkAsPaid(note.id);
                                        }
                                      }}
                                      disabled={isPaid(note) || note.status === 'canceled' || note.status === 'draft'}
                                    >
                                      <DollarSign className="h-4 w-4 mr-2" />
                                      Marcar como Paga
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        if (note.id) {
                                          NotesService.updateNoteStatus(note.id, 'canceled', user?.id || '');
                                          fetchNotes();
                                        }
                                      }}
                                      disabled={note.status === 'finalized' || note.status === 'canceled'}
                                      className="text-red-600"
                                    >
                                      <Ban className="h-4 w-4 mr-2" />
                                      Cancelar Nota
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TooltipProvider>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-gray-700">
                      Mostrando <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> a{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * pageSize, totalNotes)}
                      </span>{' '}
                      de <span className="font-medium">{totalNotes}</span> resultados
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="h-9 w-9 p-0 rounded-full"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          // Mostrar páginas em torno da página atual
                          let pageNum = currentPage - 2 + i;
                          if (pageNum < 1) pageNum = i + 1;
                          if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                          
                          // Garantir que a página esteja dentro dos limites
                          if (pageNum < 1 || pageNum > totalPages) return null;
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => goToPage(pageNum)}
                              className={`w-9 h-9 p-0 rounded-full ${
                                currentPage === pageNum ? "bg-fiscal-green-600 text-white" : ""
                              }`}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="h-9 w-9 p-0 rounded-full"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Diálogo de confirmação de exclusão */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir esta nota? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteNote}
              >
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default NotesManagement; 