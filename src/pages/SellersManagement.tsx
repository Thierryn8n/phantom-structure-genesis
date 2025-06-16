import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Save,
  X,
  BarChart2,
  DollarSign,
  FileText,
  Upload,
  Phone,
  Search,
  CheckCircle,
  Loader2,
  Mail,
  Info,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { JwtExpiredAlert } from '@/components/ui/ErrorAlert';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { v4 as uuidv4 } from 'uuid';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogOverlay,
} from "@/components/ui/dialog";

// Interface para os dados do vendedor que vem do Supabase
interface Seller {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  imageUrl?: string;
  image_path?: string;
  auth_user_id?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  active: boolean;
}

// Interface para cadastrar/editar vendedor
interface SellerInput {
  full_name: string;
  phone: string;
  email?: string;
  imageUrl?: string;
  image_path?: string;
  active?: boolean;
}

// Interface para estatísticas do vendedor
interface SellerStats {
  totalNotes: number;
  paidNotes: number;
  totalAmount: number;
  paidAmount: number;
  recentNotes: NoteItem[];
}

// Interface para notas geradas
interface NoteItem {
  id: string;
  date: Date;
  customer: string;
  amount: number;
  status: 'paid' | 'pending' | 'cancelled';
}

// Interface para usuários do Auth
interface AuthUser {
  id: string;
  email?: string;
  app_metadata?: any;
  user_metadata?: any;
  // Outros campos podem ser adicionados conforme necessário
}

const SellersManagement: React.FC = () => {
  // Estado para controlar o diálogo de erro JWT expirado
  const [jwtExpiredError, setJwtExpiredError] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Função para lidar com erro de JWT expirado
  const handleJwtExpiredError = useCallback(() => {
    setJwtExpiredError(true);
    toast({
      title: 'Sessão expirada',
      description: 'Sua sessão expirou. Por favor, faça login novamente.',
      variant: 'error',
    });
  }, [toast]);
  
  // Função para tentar novamente após erro de JWT
  const handleRetryAfterJwtError = () => {
    setJwtExpiredError(false);
    window.location.reload();
  };
  
  // Função para fazer logout após erro de JWT
  const handleLogoutAfterJwtError = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      window.location.reload();
    }
  };
  const { user, session, signOut } = useAuth();

  // Estado para cadastro/edição de vendedor
  const [newSeller, setNewSeller] = useState<SellerInput>({
    full_name: '',
    phone: '',
    email: '',
    imageUrl: '',
    image_path: '',
    active: true,
  });

  // Estado para lista de vendedores
  const [sellers, setSellers] = useState<Seller[]>([]);

  // Estado para carregamento
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Estado para edição de vendedor
  const [editingSellerId, setEditingSellerId] = useState<string | null>(null);

  // Estado para pesquisa de vendedores
  const [searchTerm, setSearchTerm] = useState('');

  // Estado para seleção de vendedor para visualizar estatísticas
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);

  // Estado para dados de upload de imagem
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Estado para dados de estatísticas do vendedor selecionado
  const [sellerStats, setSellerStats] = useState<SellerStats | null>(null);

  // Estado para a aba atual
  const [currentTab, setCurrentTab] = useState('lista');

  // Estado para controle do modal
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Estado para indicar se houve erro na busca de vendedores
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Estado para controle de erro de autenticação
  const [authError, setAuthError] = useState(false);

  // Estado para controlar o envio de emails por vendedor
  const [sendingEmails, setSendingEmails] = useState<Record<string, boolean>>({});

  // Verificação adicional de autenticação ao carregar a página
  useEffect(() => {
    console.log("=== COMPONENTE MONTADO - Estado de autenticação inicial ===");
    console.log("User autenticado:", user ? "Sim" : "Não");
    console.log("User ID:", user?.id);
    console.log("User email:", user?.email);
    
    // Se o usuário está autenticado, limpar a flag de tentativa de recuperação
    if (user) {
      console.log("Usuário autenticado encontrado no contexto, prosseguindo normalmente");
      sessionStorage.removeItem('session_recovery_attempted');
      return;
    }
    
    // Verifica se já tentamos recuperar a sessão para evitar loops
    const sessionRecoveryAttempted = sessionStorage.getItem('session_recovery_attempted');
    
    if (!sessionRecoveryAttempted) {
      console.log("Tentando recuperar sessão do usuário...");
      
      // Marca que tentamos recuperar a sessão para evitar loops
      sessionStorage.setItem('session_recovery_attempted', 'true');
      
      // Tenta buscar a sessão atual do usuário diretamente
      supabase.auth.getSession().then(({ data, error }) => {
        console.log("Resultado da verificação de sessão:");
        console.log("- Sessão existe:", data.session ? "Sim" : "Não");
        console.log("- Erro:", error ? error.message : "Nenhum erro");
        
        if (data.session) {
          console.log('Detalhes da sessão recuperada:');
          console.log('- User ID:', session.user?.id);
          console.log('- Email:', session.user?.email);
          console.log('- Token expira em:', new Date(session.expires_at * 1000).toLocaleString());
          
          // Não faz reload, apenas mostra mensagem apropriada
          setFetchError('Sessão encontrada, mas não foi possível carregar o usuário corretamente. Por favor, faça login novamente.');
        } else if (error) {
          console.error('Erro detalhado ao recuperar sessão:', error);
        }
      });
    }
  }, [user]);

  // Função para buscar vendedores do Supabase com useCallback para evitar recriações
  const fetchSellers = useCallback(async () => {
    console.log("=== INICIANDO BUSCA DE VENDEDORES ===");
    
    if (!user) {
      console.warn('Erro: Usuário não autenticado ao tentar buscar vendedores');
      
      // Verifica se há token no localStorage antes de desistir, mas NÃO faz reload
      const localSession = localStorage.getItem('supabase.auth.token');
      console.log('LocalStorage contém token:', localSession ? "Sim" : "Não");
      
      if (localSession) {
        console.log('Token encontrado no localStorage, analisando sessão...');
        
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          console.log('Resultado da recuperação de sessão:', session ? "Sucesso" : "Falha");
          console.log('Erro na recuperação:', error ? error.message : "Nenhum erro");
          
          if (session) {
            console.log('Detalhes da sessão recuperada:');
            console.log('- User ID:', session.user?.id);
            console.log('- Email:', session.user?.email);
            console.log('- Token expira em:', new Date(session.expires_at * 1000).toLocaleString());
            
            // Não faz reload, apenas mostra mensagem apropriada
            setFetchError('Sessão encontrada, mas não foi possível carregar o usuário corretamente. Por favor, faça login novamente.');
          } else if (error) {
            console.error('Erro detalhado ao recuperar sessão:', error);
          }
        } catch (e) {
          console.error('Exceção ao tentar recuperar sessão:', e);
        }
      }
      
      setFetchError('Você precisa estar autenticado para ver os vendedores');
      setAuthError(true);
      return;
    }

    setIsLoading(true);
    setFetchError(null);
    setAuthError(false);
    
    try {
      console.log('Buscando vendedores para o usuário:', user.id);
      
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .eq('owner_id', user.id)
        .order('full_name', { ascending: true });

      console.log('Resposta da API:', data ? `${data.length} vendedores encontrados` : "Sem dados");
      console.log('Erro da API:', error ? error.message : "Nenhum erro");

      if (error) {
        console.error('Erro detalhado do Supabase:', JSON.stringify(error, null, 2));
        
        // Verificar se é um erro de autenticação
        if (error.code === 'PGRST301' || error.message.includes('JWT') || error.code === '403') {
          console.log('Detectado erro de autenticação (403/JWT)');
          setAuthError(true);
          
          // Não vamos tentar renovar automaticamente para evitar loops
          throw new Error('Erro de autenticação. Sua sessão expirou. Use o botão "Renovar Sessão" para tentar novamente.');
        }
        
        throw error;
      }

      console.log('Vendedores recuperados com sucesso:', data?.length || 0);
      setSellers(data || []);
    } catch (error: any) {
      console.error('Exceção ao carregar vendedores:', error);
      setFetchError(error.message || 'Não foi possível carregar os vendedores. Verifique sua conexão.');
      
      // Verificar se a mensagem de erro indica um problema de autenticação
      if (error.message?.includes('autenticação') || 
          error.message?.includes('auth') || 
          error.message?.includes('token') || 
          error.message?.includes('JWT') ||
          error.message?.includes('403')) {
        console.log('Erro classificado como problema de autenticação');
        setAuthError(true);
      }
      
      toast({
        title: 'Erro ao carregar vendedores',
        description: error.message || 'Ocorreu um erro ao buscar vendedores.',
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  // Carregar vendedores do Supabase quando o componente é montado
  useEffect(() => {
    if (user) {
      fetchSellers();
    }
  }, [user, fetchSellers]);

  // Função para tentar renovar o token e buscar vendedores novamente
  const handleRefreshAuth = async () => {
    console.log("=== TENTANDO RENOVAR AUTENTICAÇÃO ===");
    try {
      setIsLoading(true);
      setAuthError(false);
      
      console.log("Estado atual da sessão antes da renovação:");
      const sessionCheck = await supabase.auth.getSession();
      console.log("- Sessão existe:", sessionCheck.data.session ? "Sim" : "Não");
      if (sessionCheck.data.session) {
        console.log("- Expira em:", new Date(sessionCheck.data.session.expires_at * 1000).toLocaleString());
      }
      
      // Tentar renovar o token de autenticação
      console.log("Iniciando refresh de sessão...");
      const { data, error } = await supabase.auth.refreshSession();
      
      console.log("Resultado do refresh:", data.session ? "Sucesso" : "Falha");
      console.log("Erro no refresh:", error ? error.message : "Nenhum erro");
      
      if (error) {
        console.error('Erro detalhado ao renovar sessão:', JSON.stringify(error, null, 2));
        setAuthError(true);
        toast({
          title: 'Erro de autenticação',
          description: 'Não foi possível renovar sua sessão. Por favor, faça login novamente.',
          variant: 'error',
        });
        return;
      }
      
      if (data.session) {
        console.log('Detalhes da sessão renovada:');
        console.log('- User ID:', data.session.user?.id);
        console.log('- Access Token (últimos 10 caracteres):', 
          data.session.access_token.substring(data.session.access_token.length - 10));
        console.log('- Token expira em:', new Date(data.session.expires_at * 1000).toLocaleString());
        
        toast({
          title: 'Sessão renovada',
          description: 'Sua sessão foi renovada com sucesso.',
          variant: 'success',
        });
        
        // Se a renovação foi bem-sucedida, buscar vendedores novamente, mas sem loops
        if (user) {
          console.log("Usuário disponível no contexto, buscando vendedores...");
          fetchSellers();
        } else {
          // Se ainda não temos usuário no contexto, sugerimos login
          console.log("ATENÇÃO: Sessão renovada, mas usuário ainda ausente no contexto");
          setFetchError('Sessão renovada, mas o usuário não está disponível no contexto.');
          setAuthError(true);
        }
      }
    } catch (error: any) {
      console.error('Exceção ao tentar reautenticar:', error);
      setAuthError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Simular carregamento de estatísticas quando um vendedor é selecionado
  useEffect(() => {
    if (selectedSellerId) {
      // Em um app real, isso seria uma chamada API
      setTimeout(() => {
        setSellerStats({
          totalNotes: Math.floor(Math.random() * 100) + 20,
          paidNotes: Math.floor(Math.random() * 80) + 10,
          totalAmount: Math.floor(Math.random() * 20000) + 5000,
          paidAmount: Math.floor(Math.random() * 15000) + 3000,
          recentNotes: Array(5).fill(0).map((_, index) => ({
            id: `note-${index}`,
            date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
            customer: `Cliente ${Math.floor(Math.random() * 100)}`,
            amount: Math.floor(Math.random() * 1000) + 100,
            status: ['paid', 'pending', 'cancelled'][Math.floor(Math.random() * 3)] as 'paid' | 'pending' | 'cancelled',
          })),
        });
      }, 500);
    } else {
      setSellerStats(null);
    }
  }, [selectedSellerId]);

  // Filtrar vendedores baseado no termo de pesquisa
  const filteredSellers = sellers.filter((seller) =>
    seller.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seller.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seller.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para adicionar novo vendedor no Supabase
  const handleCreateSeller = async () => {
    if (!newSeller.full_name || !newSeller.phone || !newSeller.email) {
      toast({
        title: "Preencha todos os campos",
        description: "Nome, telefone e email são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setFetchError(null);
    setAuthError(false);

    try {
      // Verificar se o email já está registrado
      const { data: existingSeller, error: sellerCheckError } = await supabase
        .from('sellers')
        .select('id, email')
        .eq('email', newSeller.email)
        .eq('owner_id', user.id);

      console.log("Resultado da verificação de email existente:", 
        existingSeller ? `${existingSeller.length} resultados encontrados` : "Sem resultados");
      console.log("Erro na verificação:", sellerCheckError ? sellerCheckError.message : "Nenhum erro");

      if (sellerCheckError) {
        console.error("Erro detalhado na verificação de seller:", JSON.stringify(sellerCheckError, null, 2));
        throw sellerCheckError;
      }
      if (existingSeller && existingSeller.length > 0) {
        console.log("Email já registrado para outro vendedor");
        toast({
          title: 'Erro',
          description: 'Este e-mail já está registrado para um vendedor. Use um e-mail diferente ou edite o vendedor existente.',
          variant: 'error',
        });
        return;
      }

      console.log("Verificando se email já existe no Supabase Auth");
      // Verificar se o e-mail já está registrado no Supabase Auth
      const { data: authUsers, error: authCheckError } = await supabaseAdmin.auth.admin.listUsers();
      console.log("Resposta do listUsers:", authUsers ? `${authUsers.users?.length} usuários encontrados` : "Sem dados");
      console.log("Erro na listagem de usuários:", authCheckError ? authCheckError.message : "Nenhum erro");
      
      if (authCheckError) {
        console.error('Erro detalhado ao verificar usuários no Auth:', JSON.stringify(authCheckError, null, 2));
        toast({
          title: 'Erro',
          description: 'Erro ao verificar usuários existentes. Tente novamente mais tarde.',
          variant: 'error',
        });
        return;
      }
      
      console.log("Verificando se email já existe entre os usuários auth");
      // Verificar se o usuário já existe no Supabase Auth
      // @ts-ignore - Ignorando a verificação de tipos aqui, sabemos que os usuários têm email
      const existingAuthUser = authUsers.users.find(u => u.email === newSeller.email);
      console.log("Usuário com o email já existe:", existingAuthUser ? "Sim" : "Não");
      
      if (existingAuthUser) {
        console.log("ID do usuário existente:", existingAuthUser.id);
      }

      let userId;
      
      // Se o usuário já existe, use o ID existente
      if (existingAuthUser) {
        userId = existingAuthUser.id;
        console.log('Usuário já existe, usando ID existente:', userId);
        
        // Informar ao usuário que estamos associando a uma conta existente
        toast({
          title: 'Conta existente',
          description: 'Este e-mail já possui uma conta. Associando-a como vendedor.',
          variant: 'info',
        });
      } else {
        // Criar novo usuário no Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: newSeller.email,
          password: generateTempPassword(),
          email_confirm: true,
          user_metadata: {
            name: newSeller.full_name,
            role: 'seller',
            owner_id: user.id
          }
        });

        if (authError) {
          console.error('Erro ao criar usuário:', authError);
          throw new Error(`Erro ao criar usuário: ${authError.message}`);
        }

        if (!authData.user) {
          throw new Error('Usuário não criado.');
        }
        
        userId = authData.user.id;
      }

      // Verificar primeiro se este vendedor (com este auth_user_id) já existe
      const { data: existingSellerById, error: existingSellerError } = await supabase
        .from('sellers')
        .select('id')
        .eq('auth_user_id', userId);
        
      if (existingSellerError) {
        console.error('Erro ao verificar vendedor existente:', existingSellerError);
      }
      
      // Se o vendedor já existe com esse auth_user_id, notificar o usuário
      if (existingSellerById && existingSellerById.length > 0) {
        toast({
          title: 'Vendedor já existe',
          description: 'Este usuário já está cadastrado como vendedor.',
          variant: 'warning',
        });
        setIsSubmitting(false);
        return;
      }
      
      // Inserir vendedor no banco de dados
      const { data: sellerData, error: sellerError } = await supabase
        .from('sellers')
        .insert([
          {
            full_name: newSeller.full_name,
            phone: newSeller.phone,
            email: newSeller.email,
            auth_user_id: userId,
            owner_id: user.id,
            active: newSeller.active || true,
          },
        ])
        .select();

      if (sellerError) {
        console.error('Erro ao inserir vendedor:', sellerError);
        // Excluir o usuário criado se a inserção falhar e se for um usuário novo
        if (!existingAuthUser && userId) {
          try {
            await supabaseAdmin.auth.admin.deleteUser(userId);
          } catch (deleteError) {
            console.error('Erro ao excluir usuário após falha na inserção:', deleteError);
          }
        }
        throw new Error(`Erro ao inserir vendedor: ${sellerError.message}`);
      }

      setSellers((prev) => [...prev, sellerData[0]]);
      toast({
        title: 'Vendedor criado',
        description: 'O vendedor foi criado com sucesso e um convite foi enviado por e-mail.',
        variant: 'success',
      });

      setNewSeller({
        full_name: '',
        phone: '',
        email: '',
        imageUrl: '',
        image_path: '',
        active: true,
      });
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Erro ao criar vendedor:', error);
      
      // Verificar se é um erro de JWT expirado
      if (
        error.message?.includes('JWT expired') ||
        error.code === 'PGRST301' ||
        (error.error?.message && error.error.message.includes('JWT expired'))
      ) {
        handleJwtExpiredError();
        return;
      }
      
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao criar o vendedor.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para atualizar vendedor existente
  const handleUpdateSeller = async () => {
    if (!editingSellerId || !user) {
      toast({
        title: 'Erro',
        description: 'Nenhum vendedor selecionado para edição ou usuário não autenticado.',
        variant: 'error',
      });
      return;
    }

    if (!newSeller.full_name || !newSeller.phone) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'error',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Atualizar vendedor no Supabase
      const { data, error } = await supabase
        .from('sellers')
        .update({
          full_name: newSeller.full_name,
          phone: newSeller.phone,
          email: newSeller.email || null,
          active: newSeller.active || true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingSellerId)
        .eq('owner_id', user.id)
        .select();

      if (error) {
        throw error;
      }

      // Se tiver arquivo selecionado, fazer upload da imagem
      if (selectedFile) {
        await handleImageUpload(editingSellerId);
      }

      // Atualizar a lista de vendedores
      const updatedSeller = data[0];
      const updatedSellers = sellers.map((seller) =>
        seller.id === editingSellerId ? updatedSeller : seller
      );
      setSellers(updatedSellers);
      setIsDialogOpen(false);
      resetForm();

      toast({
        title: 'Vendedor atualizado',
        description: 'Dados do vendedor atualizados com sucesso!',
        variant: 'success',
      });
    } catch (error: any) {
      console.error('Erro ao atualizar vendedor:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar os dados do vendedor.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para fazer upload de imagem do vendedor
  const handleImageUpload = async (sellerId: string) => {
    if (!selectedFile) return;

    try {
      setUploadProgress(10); // Inicia o progresso
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
      const filePath = `${sellerId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('sellers_images')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      setUploadProgress(70);

      // Obter URL pública da imagem
      const { data: publicUrlData } = supabase.storage
        .from('sellers_images')
        .getPublicUrl(filePath);

      setUploadProgress(90);

      // Usar a função do banco de dados para atualizar a imagem
      const { data: rpcData, error: rpcError } = await supabase.rpc('update_seller_image', {
        p_seller_id: sellerId,
        p_image_path: filePath,
        p_owner_id: user?.id
      });

      if (rpcError) {
        console.error('Erro ao atualizar imagem do vendedor:', rpcError);
        throw new Error(`Erro ao atualizar imagem do vendedor: ${rpcError.message}`);
      }

      if (!rpcData) {
        throw new Error('Falha ao atualizar imagem do vendedor.');
      }

      // Atualizar lista de vendedores
      setSellers((prev) =>
        prev.map((seller) =>
          seller.id === sellerId
            ? { ...seller, imageUrl: publicUrlData.publicUrl, image_path: filePath }
            : seller
        )
      );

      setUploadProgress(100);
      toast({
        title: 'Imagem enviada',
        description: 'A imagem do vendedor foi atualizada com sucesso.',
        variant: 'success',
      });
    } catch (error: any) {
      console.error('Erro no upload de imagem:', error);
      toast({
        title: "Erro no upload",
        description: error.message || "Ocorreu um erro ao fazer upload da imagem",
        variant: "error",
      });
    }
  };

  // Função para excluir vendedor do Supabase
  const handleDeleteSeller = async (id: string) => {
    try {
      // Usar a função do banco de dados para desativar o vendedor
      const { data: rpcData, error: rpcError } = await supabase.rpc('deactivate_seller', {
        p_seller_id: id,
        p_owner_id: user?.id
      });

      if (rpcError) {
        console.error('Erro ao desativar vendedor:', rpcError);
        throw new Error(`Erro ao desativar vendedor: ${rpcError.message}`);
      }

      if (!rpcData) {
        throw new Error('Falha ao desativar vendedor.');
      }

      setSellers((prev) => prev.filter((seller) => seller.id !== id));
      toast({
        title: "Vendedor removido",
        description: "O vendedor foi desativado com sucesso",
        variant: "success",
      });

      if (selectedSellerId === id) {
        setSelectedSellerId(null);
      }
    } catch (error: any) {
      console.error('Erro ao remover vendedor:', error);
      toast({
        title: "Erro ao remover",
        description: error.message || "Ocorreu um erro ao remover o vendedor",
        variant: "error",
      });
    }
  };

  const handleEditSeller = (seller: Seller) => {
    setNewSeller({
      full_name: seller.full_name,
      phone: seller.phone,
      email: seller.email,
      imageUrl: seller.imageUrl,
      image_path: seller.image_path,
      active: seller.active,
    });
    setEditingSellerId(seller.id);
    setPreviewUrl(seller.imageUrl || '');
    setIsDialogOpen(true);
  };

  const handleViewStats = (sellerId: string) => {
    setSelectedSellerId(sellerId);
    setCurrentTab('estatisticas');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    setSelectedFile(file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl('');
    }
  };

  const resetForm = () => {
    setNewSeller({
      full_name: '',
      phone: '',
      email: '',
      imageUrl: '',
      image_path: '',
      active: true,
    });
    setEditingSellerId(null);
    setSelectedFile(null);
    setPreviewUrl('');
    setUploadProgress(0);
  };

  const handleOpenNewSellerDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleCancelEdit = () => {
    resetForm();
    setIsDialogOpen(false);
  };

  const renderSellerProfile = (seller: Seller) => {
    // Gerar iniciais para avatar
    const initials = seller.full_name
      .split(' ')
      .map(name => name[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const isOnline = seller.active;
    
    return (
      <Card 
        className="overflow-hidden border border-gray-300 rounded-[20px] shadow-sm hover:shadow-lg transition-shadow duration-300 bg-white"
      >
        <div className="p-5 flex justify-between items-start border-b border-gray-100">
          <div className="flex items-center space-x-3">
            {/* Avatar do vendedor */}
            <div className="relative h-12 w-12 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
          {seller.imageUrl ? (
            <img
              src={seller.imageUrl}
                  alt={`${seller.full_name}`}
                  className="h-full w-full object-cover"
            />
          ) : (
                <div className="flex items-center justify-center h-full w-full bg-green-100 text-green-600 font-semibold text-lg">
                  {initials}
            </div>
          )}
              <span 
                className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ${
                  isOnline ? 'bg-green-500' : 'bg-gray-400'
                } border-2 border-white`}
              />
        </div>
            
            {/* Nome e data */}
            <div>
              <h3 className="font-semibold text-gray-800">{seller.full_name}</h3>
              <p className="text-xs text-gray-500">
                {format(new Date(seller.created_at), "dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </p>
        </div>
        </div>
          
          {/* Botões de ação */}
          <div className="flex space-x-1">
          <Button
            onClick={() => handleEditSeller(seller)}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full"
          >
              <Edit size={16} />
          </Button>
            
          <Button
              onClick={() => handleDeleteSeller(seller.id)}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
        
        {/* Informações de contato */}
        <div className="p-5 space-y-3">
          <div className="flex items-start space-x-2">
            <Phone className="text-gray-400 mt-0.5" size={16} />
            <div>
              <p className="text-sm text-gray-800">{seller.phone}</p>
              <p className="text-xs text-gray-500">Telefone de contato</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-2">
            <Mail className="text-gray-400 mt-0.5" size={16} />
            <div>
              <p className="text-sm text-gray-800">{seller.email || "Não informado"}</p>
              <p className="text-xs text-gray-500">E-mail</p>
            </div>
          </div>
        </div>
        
        {/* Botões de ação secundários */}
        <div className="p-3 bg-gray-50 border-t border-gray-100 flex flex-col gap-2">
          <Button
            onClick={() => handleViewStats(seller.id)}
            variant="outline"
            className="w-full h-9 text-green-700 border-green-200 hover:bg-green-50 flex items-center justify-center gap-2 rounded-xl"
          >
            <BarChart2 size={16} />
            <span>Ver Estatísticas</span>
          </Button>
          
          <Button
            onClick={() => handleResendPasswordReset(seller.id, seller.email)}
            disabled={!seller.email || !seller.auth_user_id || !!sendingEmails[seller.id]}
            variant="outline"
            className="w-full h-9 text-blue-700 border-blue-200 hover:bg-blue-50 flex items-center justify-center gap-2 rounded-xl"
          >
            {sendingEmails[seller.id] ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <Mail size={16} />
                <span>Reenviar Recuperação</span>
              </>
            )}
          </Button>
          
          <Button
            onClick={() => handleCheckUserStatus(seller.id, seller.auth_user_id)}
            disabled={!seller.auth_user_id}
            variant="outline"
            className="w-full h-9 text-yellow-700 border-yellow-200 hover:bg-yellow-50 flex items-center justify-center gap-2 rounded-xl"
          >
            <Info size={16} />
            <span>Verificar Status</span>
          </Button>
        </div>
      </Card>
    );
  };

  // Componente do Modal para Adicionar/Editar Vendedor
  const SellerFormDialog = () => {
    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="mb-4" onClick={handleOpenNewSellerDialog}>
            <UserPlus size={16} className="mr-2" />
            Novo Vendedor
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] bg-white shadow-xl rounded-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800">
              {editingSellerId ? 'Editar Vendedor' : 'Novo Vendedor'}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              {editingSellerId ? 'Atualize os dados do vendedor.' : 'Insira os dados do novo vendedor.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editingSellerId ? handleUpdateSeller : handleCreateSeller}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="full_name" className="text-right text-gray-700 font-medium">
                  Nome
                </Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={newSeller.full_name}
                  onChange={(e) => setNewSeller({ ...newSeller, full_name: e.target.value })}
                  className="col-span-3 border-gray-300 focus:ring-2 focus:ring-fiscal-green-500 rounded-md"
                  placeholder="Digite o nome completo"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right text-gray-700 font-medium">
                  Telefone
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={newSeller.phone}
                  onChange={(e) => setNewSeller({ ...newSeller, phone: e.target.value })}
                  className="col-span-3 border-gray-300 focus:ring-2 focus:ring-fiscal-green-500 rounded-md"
                  placeholder="(XX) XXXXX-XXXX"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right text-gray-700 font-medium">
                  E-mail
                </Label>
                <Input
                  id="email"
                  name="email"
                  value={newSeller.email || ''}
                  onChange={(e) => setNewSeller({ ...newSeller, email: e.target.value })}
                  className="col-span-3 border-gray-300 focus:ring-2 focus:ring-fiscal-green-500 rounded-md"
                  placeholder="exemplo@dominio.com"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="image" className="text-right text-gray-700 font-medium">
                  Foto
                </Label>
                <div className="col-span-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="image"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="image"
                      className="cursor-pointer inline-flex items-center px-4 py-2 bg-fiscal-green-100 text-fiscal-green-700 rounded-md hover:bg-fiscal-green-200 transition-colors"
                    >
                      <Upload size={16} className="mr-2" />
                      Escolher Imagem
                    </label>
                    {selectedFile && (
                      <span className="text-sm text-gray-500 truncate flex-1">{selectedFile.name}</span>
                    )}
                  </div>
                  {previewUrl && (
                    <div className="mt-3 w-20 h-20 rounded-full overflow-hidden border-2 border-fiscal-green-200">
                      <img src={previewUrl} alt="Prévia" className="w-full h-full object-cover" />
                    </div>
                  )}
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                      <div
                        className="bg-fiscal-green-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="active" className="text-right text-gray-700 font-medium">
                  Ativo
                </Label>
                <div className="col-span-3 flex items-center">
                  <Switch
                    id="active"
                    name="active"
                    checked={newSeller.active}
                    onCheckedChange={(checked) => setNewSeller({ ...newSeller, active: checked === true })}
                    className="data-[state=checked]:bg-fiscal-green-500"
                  />
                  <span className={`ml-2 text-sm ${newSeller.active ? 'text-fiscal-green-600' : 'text-gray-500'}`}>
                    {newSeller.active ? 'Vendedor ativo' : 'Vendedor inativo'}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter className="flex justify-between mt-6">
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={handleCancelEdit} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                  Cancelar
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-fiscal-green-500 hover:bg-fiscal-green-600 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    {editingSellerId ? 'Atualizar' : 'Cadastrar'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  // Função para gerar uma senha temporária
  const generateTempPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Função para redirecionar para a página de login
  const redirectToLogin = () => {
    // Limpar qualquer estado local ou sessão para evitar loops
    localStorage.removeItem('supabase.auth.token');
    sessionStorage.removeItem('session_recovery_attempted');
    
    // Redirecionar para a página de login
    window.location.href = '/login?redirect=/sellers';
  };

  // Atualizar a função para incluir indicador de carregamento
  const handleResendPasswordReset = async (sellerId: string, email: string | undefined) => {
    if (!email) {
      toast({
        title: "Email não encontrado",
        description: "Este vendedor não possui um email associado.",
        variant: "destructive",
      });
      return;
    }

    // Atualizar o estado para mostrar carregamento para este vendedor específico
    setSendingEmails(prev => ({ ...prev, [sellerId]: true }));

    try {
      // URL para onde o usuário será redirecionado
      const redirectTo = `${window.location.origin}/recover-password`;
      
      // Enviar email de recuperação de senha via Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo
      });

      if (error) throw error;

      toast({
        title: "Email enviado",
        description: "Um link de redefinição de senha foi enviado para o vendedor.",
        variant: "success",
      });
    } catch (error: any) {
      console.error("Erro ao enviar email:", error);
      toast({
        title: "Erro ao enviar",
        description: error.message || "Não foi possível enviar o email de redefinição.",
        variant: "destructive",
      });
    } finally {
      // Remover status de carregamento após completar
      setSendingEmails(prev => ({ ...prev, [sellerId]: false }));
    }
  };

  // Função para verificar o status do vendedor
  const handleCheckUserStatus = async (sellerId: string, authUserId: string | undefined) => {
    if (!authUserId) {
      toast({
        title: "Usuário não encontrado",
        description: "Este vendedor não possui um ID de usuário válido.",
        variant: "destructive",
      });
      return;
    }

    // Atualizar o estado para mostrar carregamento
    setSendingEmails(prev => ({ ...prev, [sellerId]: true }));

    try {
      // Buscar detalhes do usuário via API admin
      const { data, error } = await supabaseAdmin.auth.admin.getUserById(authUserId);

      if (error) throw error;

      if (!data?.user) {
        throw new Error("Usuário não encontrado no sistema de autenticação");
      }

      // Informar sobre o status do usuário
      toast({
        title: "Status do Usuário",
        description: `Email: ${data.user.email || 'Não definido'} - Email confirmado: ${data.user.email_confirmed_at ? 'Sim' : 'Não'}`,
        variant: "default",
        duration: 5000,
      });

      // Se o email não estiver confirmado, oferecer opção de enviar convite
      if (!data.user.email_confirmed_at && data.user.email) {
        // Mostrar toast com opção de ação
        toast({
          title: "Email não confirmado",
          description: "O vendedor ainda não confirmou o email. Deseja reenviar o link?",
          variant: "warning",
          duration: 10000,
          action: (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleResendPasswordReset(sellerId, data.user.email)}
              className="bg-white"
            >
              Reenviar
            </Button>
          ),
        });
      }
    } catch (error: any) {
      console.error("Erro ao verificar status:", error);
      toast({
        title: "Erro ao verificar status",
        description: error.message || "Não foi possível verificar o status do usuário.",
        variant: "destructive",
      });
    } finally {
      // Remover status de carregamento após completar
      setSendingEmails(prev => ({ ...prev, [sellerId]: false }));
    }
  };

  return (
    <Layout>
      <div className="space-y-6 bg-slate-50 p-4 rounded-lg bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2UyZThmMCIgb3BhY2l0eT0iMC40IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]">
      {/* Modal de erro JWT expirado */}
      {jwtExpiredError && (
      <Dialog open={jwtExpiredError} onOpenChange={setJwtExpiredError}>
        <DialogOverlay className="bg-black/50" />
        <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-lg">
            <JwtExpiredAlert />
            <div className="flex justify-center gap-4 p-4 bg-white rounded-b-lg">
              <Button 
                onClick={handleRetryAfterJwtError}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Tentar Novamente
              </Button>
              <Button 
                variant="outline"
                onClick={handleLogoutAfterJwtError}
                className="border-gray-300 text-gray-700"
              >
                Fazer Login Novamente
              </Button>
            </div>
        </DialogContent>
      </Dialog>
      )}
      
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Gerenciamento de Vendedores</h1>
            <p className="text-gray-500">Gerencie os vendedores que têm acesso ao sistema</p>
        </div>

          {/* Abas */}
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
            <TabsList className="mb-6 !bg-white p-[5px] rounded-[20px] border border-gray-300">
              <TabsTrigger
                value="lista"
                className="data-[state=active]:bg-fiscal-green-50 data-[state=active]:text-fiscal-green-700 data-[state=active]:font-medium data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-fiscal-green-300 bg-slate-50 transition-all duration-200 rounded-xl mx-0.5 border border-transparent hover:border-gray-200 text-sm whitespace-nowrap"
              >
                <Users size={16} className="mr-2" />
                Lista de Vendedores
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lista">
              <div className="flex justify-between flex-wrap gap-4 mb-6">
                <div className="relative w-full md:w-1/2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Buscar vendedor por nome, email ou telefone..."
                    className="pl-10 py-2 border border-gray-300 rounded-[20px] shadow-sm focus:ring-fiscal-green-500 focus:border-fiscal-green-500 text-sm w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>

                {/* Botão de adicionar */}
                        <Button 
                          onClick={handleOpenNewSellerDialog} 
                  className="bg-fiscal-green-600 hover:bg-fiscal-green-700 text-white rounded-xl"
                        >
                  <UserPlus size={16} className="mr-2" />
                  Novo Vendedor
                        </Button>
                    </div>
              
              {/* Grid de vendedores */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredSellers.map((seller) => (
                  renderSellerProfile(seller))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal para adicionar/editar vendedor */}
        {SellerFormDialog()}
        </div>
      </div>
    </Layout>
  );
};

export default SellersManagement;