import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Package, Plus, Trash2, Tag, Search, Image, Edit, Save, X, Check, Info, Upload, FileText, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { validateAndProcessCsv } from '@/utils/csvImport';
import CsvHelpDialog from '@/components/CsvHelpDialog';
import { ProductsService, Product as ProductType } from '@/services/productsService';
import { checkAuthAndRLS } from '@/lib/supabaseClient';
import { useSessionRefresh } from '@/hooks/useSessionRefresh';

// Interface local para uso no componente
interface Product {
  id: string;
  name: string;
  code: string;
  price: number;
  description?: string;
  imageUrl?: string;
  ncm?: string;
  unit?: string;
  quantity?: number;
  total?: number;
}

const generateUniqueId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};

const EditProductDialog = DialogPrimitive.Root;
const EditProductDialogTrigger = DialogPrimitive.Trigger;
const EditProductDialogPortal = DialogPrimitive.Portal;
const EditProductDialogClose = DialogPrimitive.Close;

const EditProductDialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));

const EditProductDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <EditProductDialogPortal>
    <EditProductDialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-[95%] max-h-[90vh] overflow-y-auto max-w-3xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-4 sm:p-6 shadow-xl duration-300 rounded-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-3 top-3 rounded-full p-2 bg-gray-100 opacity-70 hover:opacity-100 hover:bg-gray-200 transition-all">
        <X className="h-4 w-4" />
        <span className="sr-only">Fechar</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </EditProductDialogPortal>
));

const EditProductDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
);

const EditProductDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end gap-2",
      className
    )}
    {...props}
  />
);

const EditProductDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-xl font-semibold text-gray-900", className)}
    {...props}
  />
));

// Renomear para ProductDialog para ter um componente mais genérico
const ProductDialog = EditProductDialog;
const ProductDialogTrigger = EditProductDialogTrigger;
const ProductDialogPortal = EditProductDialogPortal;
const ProductDialogClose = EditProductDialogClose;
const ProductDialogOverlay = EditProductDialogOverlay;
const ProductDialogContent = EditProductDialogContent;
const ProductDialogHeader = EditProductDialogHeader;
const ProductDialogFooter = EditProductDialogFooter;
const ProductDialogTitle = EditProductDialogTitle;

// Definição do estilo padrão para inputs
const inputStyles = "w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-fiscal-green-500 focus:border-fiscal-green-500 transition-colors shadow-sm";

const ProductManagement: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { checkActiveSession, refreshSession } = useSessionRefresh();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState<{current: number, total: number, status: string} | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [productsPerPage] = useState<number>(50);

  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    name: '',
    code: '',
    price: 0,
    description: '',
    imageUrl: '',
    ncm: '',
    unit: '',
    quantity: 0
  });

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user) {
        console.log('Usuário não autenticado.');
        toast({
          title: 'Aviso',
          description: 'Usuário não autenticado. Faça login para ver os produtos.',
          variant: 'warning'
        });
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      
      try {
        // Verificar e renovar a sessão se necessário usando o hook
        const sessionStatus = await checkActiveSession();
        console.log('Status da sessão:', sessionStatus);
        
        if (!sessionStatus.active) {
          console.error('Sessão inválida. Redirecionando para login...');
          
          // Tentar renovar uma última vez
          const forceRenewed = await refreshSession();
          if (!forceRenewed) {
            setTimeout(() => {
              window.location.href = '/login';
            }, 2000);
            return;
          }
        }
        
        // Usar o ID da sessão atualizada
        const userId = sessionStatus.userId || user.id;
        console.log('Buscando produtos para o usuário:', userId);
        
        // Executar diagnóstico para verificar autenticação e RLS
        try {
          const resultado = await checkAuthAndRLS();
          console.log('Diagnóstico de autenticação e RLS:', resultado);
          
          if (!resultado.autenticado) {
            toast({
              title: 'Erro de autenticação',
              description: 'Não foi possível autenticar. Tente fazer login novamente.',
              variant: 'error'
            });
            setIsLoading(false);
            return;
          }
          
          if (resultado.tokenExpirado) {
            console.warn('Token expirado detectado pelo diagnóstico. Tentando renovar...');
            const renewed = await refreshSession();
            if (!renewed) {
              toast({
                title: 'Token expirado',
                description: 'Seu token de acesso expirou e não foi possível renovar. Faça login novamente.',
                variant: 'error'
              });
              setTimeout(() => {
                window.location.href = '/login';
              }, 2000);
              return;
            }
          }
          
          if (!resultado.acessoRLS) {
            console.error('Erro de acesso RLS:', resultado.erro);
            toast({
              title: 'Erro de permissão',
              description: 'Não foi possível acessar seus produtos. Verifique as permissões RLS.',
              variant: 'error'
            });
            setIsLoading(false);
            return;
          }
        } catch (diagError) {
          console.error('Erro durante diagnóstico:', diagError);
          // Continuar mesmo com erro no diagnóstico
        }

        // Buscar os produtos usando o serviço
        const { products: fetchedProducts, count } = await ProductsService.getUserProducts(userId);
        
        if (fetchedProducts && fetchedProducts.length > 0) {
          console.log(`Carregados ${fetchedProducts.length} produtos de um total de ${count}`);
          
            // Transformar os dados para garantir compatibilidade
          const processedProducts = fetchedProducts.map(p => ({
              id: p.id,
              name: p.name,
              code: p.code,
              price: p.price,
              description: p.description || '',
              imageUrl: p.image_path || p.imageUrl || '',
              ncm: p.ncm || '',
              unit: p.unit || 'UN',
              quantity: typeof p.quantity === 'number' ? p.quantity : 0,
              total: p.total || 0
          }));
          
          setProducts(processedProducts);
          } else {
          console.log('Nenhum produto encontrado.');
          setProducts([]);
          
          // Se o usuário não tem produtos, oferecer adicionar um novo
          toast({
            title: 'Sem produtos',
            description: 'Você ainda não tem produtos cadastrados. Clique em "Novo Produto" para adicionar.',
            variant: 'info'
          });
        }
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os produtos. Verifique o console para mais detalhes.',
          variant: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProducts();
    
    // Configurar verificação periódica da sessão
    const sessionCheckInterval = setInterval(async () => {
      if (document.visibilityState === 'visible') {
        console.log('Verificação periódica da sessão...');
        const status = await checkActiveSession();
        if (status.renewed) {
          console.log('Sessão renovada durante verificação periódica');
        }
      }
    }, 60000); // Verificar a cada minuto quando a página estiver visível
    
    return () => clearInterval(sessionCheckInterval);
  }, [user, toast, checkActiveSession, refreshSession]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado.',
        variant: 'error'
      });
      return;
    }
    
    // Verificar sessão ativa antes de prosseguir
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      toast({
        title: 'Sessão expirada',
        description: 'Sua sessão expirou. Por favor, faça login novamente.',
        variant: 'error'
      });
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      return;
    }
    
    // Garantir que estamos usando o ID da sessão atual
    const userId = sessionData.session.user.id;
    
    if (!formData.name || !formData.code || formData.price <= 0) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha nome, código e preço.',
        variant: 'error'
      });
      return;
    }
    
    // Verificar comprimento do código
    if (formData.code.length > 9) {
      toast({
        title: 'Código muito longo',
        description: 'O código deve ter no máximo 9 caracteres.',
        variant: 'error'
      });
      return;
    }
    
    try {
      console.log('Adicionando novo produto...');
      
      // Limitar tamanho dos campos para evitar erros de BD
      const safeCode = formData.code.slice(0, 9);
      const safeNcm = formData.ncm?.slice(0, 9) || '';
      const safeUnit = formData.unit?.slice(0, 9) || '';
      
      // Preparar objeto do produto com campos básicos
      const newProduct: Partial<ProductType> = {
        name: formData.name,
        code: safeCode,
        price: formData.price,
        description: formData.description || formData.name,
        ncm: safeNcm,
        unit: safeUnit,
        quantity: formData.quantity,
        owner_id: userId, // Usar o ID da sessão atual
        category_id: null
      };
      
      // Tratar upload de imagem se houver
      if (imageFile) {
        const filePath = await ProductsService.uploadProductImage(userId, imageFile);
        newProduct.image_path = filePath;
      }

      // Adicionar produto usando o serviço
      const addedProduct = await ProductsService.addProduct(newProduct as Omit<ProductType, 'id'>);
      
      toast({
        title: 'Produto adicionado',
        description: 'Produto adicionado com sucesso.',
        variant: 'success'
      });
      
      // Atualizar a lista de produtos
      setProducts(prevProducts => [
        {
          id: addedProduct.id,
          name: addedProduct.name,
          code: addedProduct.code,
          price: addedProduct.price,
          description: addedProduct.description || '',
          imageUrl: addedProduct.image_path || '',
          ncm: addedProduct.ncm || '',
          unit: addedProduct.unit || 'UN',
          quantity: addedProduct.quantity || 0,
          total: 0
        },
        ...prevProducts
      ]);
      
      // Limpar formulário
      setFormData({
        name: '',
        code: '',
        price: 0,
        description: '',
        imageUrl: '',
        ncm: '',
        unit: '',
        quantity: 0
      });
      setImageFile(null);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o produto.',
        variant: 'error'
      });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    // Verificar sessão ativa
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      toast({
        title: 'Sessão expirada',
        description: 'Sua sessão expirou. Por favor, faça login novamente.',
        variant: 'error'
      });
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      return;
    }
    
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await ProductsService.deleteProduct(id);
        
      setProducts(products.filter(product => product.id !== id));
      toast({
          title: 'Produto excluído',
          description: 'Produto excluído com sucesso.',
        variant: 'success'
      });
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
      toast({
        title: 'Erro',
          description: 'Não foi possível excluir o produto.',
        variant: 'error'
      });
      }
    }
  };

  const handleDeleteSelectedProducts = async () => {
    if (selectedProducts.length === 0) {
      toast({
        title: 'Aviso',
        description: 'Nenhum produto selecionado.',
        variant: 'warning'
      });
      return;
    }

    // Verificar sessão ativa
    const { data: sessionCheck } = await supabase.auth.getSession();
    if (!sessionCheck.session) {
      toast({
        title: 'Sessão expirada',
        description: 'Sua sessão expirou. Por favor, faça login novamente.',
        variant: 'error'
      });
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir ${selectedProducts.length} produtos?`)) {
      try {
        // Excluir produtos em sequência
        for (const id of selectedProducts) {
          await ProductsService.deleteProduct(id);
        }
        
        // Atualizar lista local
      setProducts(products.filter(product => !selectedProducts.includes(product.id)));
      setSelectedProducts([]);
        
      toast({
          title: 'Produtos excluídos',
          description: `${selectedProducts.length} produtos excluídos com sucesso.`,
        variant: 'success'
      });
    } catch (error) {
        console.error('Erro ao excluir produtos:', error);
      toast({
        title: 'Erro',
          description: 'Ocorreu um erro ao excluir os produtos selecionados.',
        variant: 'error'
      });
      }
    }
  };

  const handleSaveEditedProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    // Verificar sessão ativa
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      toast({
        title: 'Sessão expirada',
        description: 'Sua sessão expirou. Por favor, faça login novamente.',
        variant: 'error'
      });
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      return;
    }
    
    // Usar ID do usuário da sessão atual
    const userId = sessionData.session.user.id;
    
    try {
      console.log('Atualizando produto...');
      const productToUpdate: Partial<ProductType> = {
        name: formData.name,
        code: formData.code,
        price: formData.price,
        description: formData.description || formData.name,
        ncm: formData.ncm || '',
        unit: formData.unit || '',
        quantity: formData.quantity
        // Não incluir owner_id na atualização
      };
      
      // Tratar upload de imagem se houver
      if (imageFile) {
        const filePath = await ProductsService.uploadProductImage(userId, imageFile);
        productToUpdate.image_path = filePath;
      }
      
      // Atualizar produto usando o serviço
      await ProductsService.updateProduct(editingProduct.id, productToUpdate);
      
      // Atualizar a lista local
      setProducts(products.map(product => 
        product.id === editingProduct.id 
          ? {
              ...product,
              name: formData.name,
              code: formData.code,
              price: formData.price,
              description: formData.description || '',
              imageUrl: imageFile ? URL.createObjectURL(imageFile) : formData.imageUrl || '',
              ncm: formData.ncm || '',
              unit: formData.unit || '',
              quantity: formData.quantity
            } 
          : product
      ));
      
      toast({
        title: 'Produto atualizado',
        description: 'Produto atualizado com sucesso.',
        variant: 'success'
      });
      
      setIsEditModalOpen(false);
      setEditingProduct(null);
      setImageFile(null);
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o produto.',
        variant: 'error'
      });
    }
  };

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Reset input field to allow reimporting the same file
    e.target.value = '';
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) {
        toast({
          title: 'Erro',
          description: 'Arquivo vazio ou inválido.',
          variant: 'error'
        });
        return;
      }
      
      // Usar o utilitário para validar e processar o CSV
      const result = validateAndProcessCsv(text);
      
      // Verificar se houve erros de validação
      if (!result.valid) {
        toast({
          title: 'Erro na validação do CSV',
          description: result.errors[0] || 'Arquivo CSV inválido.',
          variant: 'error'
        });
        return;
      }
      
      // Se não houver produtos para importar, retornar
      if (result.products.length === 0) {
        toast({
          title: 'Erro',
          description: 'Nenhum produto válido encontrado no arquivo CSV.',
          variant: 'error'
        });
        return;
      }
      
      // Preparar produtos para inserção no Supabase
      try {
        setIsLoading(true);
        
        // Mostrar mensagem de início da importação
        toast({
          title: 'Importação iniciada',
          description: `Preparando para importar ${result.products.length} produtos...`,
          variant: 'info'
        });
        
        // Calcular estimativa de tempo
        const tempoEstimadoSegundos = Math.ceil(result.products.length / 20) * 3;
        const minutos = Math.floor(tempoEstimadoSegundos / 60);
        const segundos = tempoEstimadoSegundos % 60;
        const estimativaTempo = minutos > 0 
          ? `${minutos} minuto(s) e ${segundos} segundo(s)` 
          : `${segundos} segundo(s)`;
        
        toast({
          title: 'Estimativa de tempo',
          description: `A importação levará aproximadamente ${estimativaTempo}`,
          variant: 'info'
        });
        
        // Inicializar o progresso
        setImportProgress({current: 0, total: result.products.length, status: 'Preparando...'});
        
        // Mapear os produtos do resultado para o formato esperado pelo Supabase
        // Com validação para limitar tamanho dos campos
        const productsToInsert = result.products.map(p => {
          // Garantir que código tenha no máximo 9 caracteres
          const code = (p.code || `IMP-${Date.now().toString(36).slice(-5)}`).slice(0, 9);
          // Limitar outros campos que podem causar o erro
          const ncm = p.ncm ? p.ncm.slice(0, 9) : '';
          const unit = p.unit ? p.unit.slice(0, 9) : '';
        
        return {
            name: p.name,
            code: code,
            price: p.price,
            description: p.name,
            ncm: ncm,
            unit: unit,
            quantity: p.quantity,
            total: p.total,
            owner_id: user?.id 
        };
      });
        
        // Função para dividir o array em lotes
        const chunkArray = <T,>(array: T[], chunkSize: number): T[][] => {
          const chunks: T[][] = [];
          for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
          }
          return chunks;
        };
        
        // Dividir em lotes menores de 10 produtos (reduzido para melhorar a confiabilidade)
        const productBatches = chunkArray(productsToInsert, 10);
        const importedProducts: any[] = [];
        let totalImported = 0;
        const startTime = Date.now();
        
        // Importar lotes sequencialmente
        for (const [index, batch] of productBatches.entries()) {
          try {
            // Atualizar o progresso
            setImportProgress({
              current: totalImported, 
              total: result.products.length, 
              status: `Importando lote ${index + 1} de ${productBatches.length}...`
            });
            
            // Calcular tempo restante
            const elapsedTime = (Date.now() - startTime) / 1000;
            const itemsProcessed = totalImported;
            const itemsRemaining = result.products.length - itemsProcessed;
            const timePerItem = itemsProcessed > 0 ? elapsedTime / itemsProcessed : 0;
            const timeRemainingSeconds = Math.ceil(timePerItem * itemsRemaining);
            const timeRemaining = timeRemainingSeconds > 60 
              ? `${Math.floor(timeRemainingSeconds / 60)}m ${timeRemainingSeconds % 60}s` 
              : `${timeRemainingSeconds}s`;
            
            // Mostrar progresso ao usuário
        toast({
              title: 'Importando produtos',
              description: `Processando lote ${index + 1} de ${productBatches.length}... Tempo restante: ${timeRemaining}`,
              variant: 'info'
            });
            
            // Aguardar 5 segundos antes de continuar (exceto para o primeiro lote)
            if (index > 0) {
              await new Promise(resolve => setTimeout(resolve, 5000));
            }
            
            // Inserir lote no Supabase
            const { data, error } = await supabase
              .from('products')
              .insert(batch)
              .select();
              
            if (error) {
              console.error(`Erro ao importar lote ${index + 1}:`, error);
              throw error;
            }
            
            if (data) {
              importedProducts.push(...data);
              totalImported += data.length;
              
              console.log(`Lote ${index + 1} importado com sucesso: ${data.length} produtos`);
              
              // Atualizar progressivamente para manter a interface responsiva
              if (index % 2 === 0 || index === productBatches.length - 1) {
                setProducts(prev => [...prev, ...data]);
                
                // Atualizar o progresso
                setImportProgress({
                  current: totalImported, 
                  total: result.products.length, 
                  status: `${totalImported} de ${result.products.length} produtos importados`
                });
              }
            }
          } catch (batchError) {
            console.error(`Erro ao importar lote ${index + 1}:`, batchError);
            
            // Tentar importar produtos um por um
          toast({
            title: 'Aviso',
              description: `Encontrados produtos problemáticos no lote ${index + 1}. Tentando importar individualmente...`,
            variant: 'warning'
          });
            
            // Aguardar mais tempo em caso de erro
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Tentar importar individualmente cada produto do lote
            for (const product of batch) {
              try {
                // Garantir que os campos críticos tenham tamanho adequado
                const fixedProduct = {
                  ...product,
                  code: product.code.slice(0, 9),
                  ncm: product.ncm ? product.ncm.slice(0, 9) : '',
                  unit: product.unit ? product.unit.slice(0, 9) : ''
                };
                
        const { data, error } = await supabase
          .from('products')
                  .insert([fixedProduct])
          .select();
                  
                if (error) {
                  console.error(`Não foi possível importar o produto: ${product.name}`, error);
                  continue;
                }
                
                if (data && data.length > 0) {
                  importedProducts.push(data[0]);
                  totalImported += 1;
                  
                  // Adicionar imediatamente ao estado para feedback visual
                  setProducts(prev => [...prev, data[0]]);
                }
                
                // Pequena pausa entre produtos individuais
                await new Promise(resolve => setTimeout(resolve, 300));
                
              } catch (productError) {
                console.error(`Erro ao tentar importar produto individual: ${product.name}`, productError);
              }
            }
          }
        }
        
        // Resultado final da importação
        if (totalImported > 0) {
          setImportProgress({
            current: totalImported, 
            total: result.products.length, 
            status: 'Importação concluída'
          });
          
        toast({
          title: 'Produtos importados',
            description: `${totalImported} de ${result.products.length} produtos foram importados com sucesso!`,
          variant: 'success'
        });
        } else {
          setImportProgress({
            current: totalImported, 
            total: result.products.length, 
            status: 'Importação falhou'
          });
          
          toast({
            title: 'Erro',
            description: 'Não foi possível importar os produtos para o banco de dados.',
            variant: 'error'
          });
        }
      } catch (error) {
        console.error('Erro ao importar produtos:', error);
        setImportProgress(null);
        toast({
          title: 'Erro',
          description: 'Não foi possível importar os produtos para o banco de dados.',
          variant: 'error'
        });
      } finally {
        // Limpar o progresso após 5 segundos
        setTimeout(() => {
          setImportProgress(null);
        }, 5000);
        setIsLoading(false);
      }
    };
    
    reader.onerror = (error) => {
      console.error('Erro ao ler arquivo:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível ler o arquivo CSV.',
        variant: 'error'
      });
    };
    
    reader.readAsText(file);
  };

  const handleDiagnoseAuth = async () => {
    console.log('Iniciando diagnóstico de autenticação e RLS...');
    setIsLoading(true);
    try {
      const resultado = await checkAuthAndRLS();
      console.log('Resultado do diagnóstico:', resultado);
      
      // Preparar mensagem amigável sobre o resultado
      let mensagem = `Status da autenticação: ${resultado.autenticado ? 'OK' : 'Falha'}\n`;
      
      if (resultado.autenticado) {
        mensagem += `ID do usuário: ${resultado.userId}\n`;
        mensagem += `Status do token: ${resultado.tokenExpirado ? 'Expirado' : 'Válido'}\n`;
        
        if (resultado.acessoRLS) {
          mensagem += 'Acesso RLS: Funcionando corretamente\n';
        } else {
          mensagem += `Acesso RLS: Problemas detectados - ${resultado.erro?.message || 'Erro desconhecido'}\n`;
        }
      } else {
        mensagem += `Erro: ${resultado.erro?.message || resultado.erro || 'Falha na autenticação'}\n`;
      }
      
      // Mostrar o resultado para o usuário
      toast({
        title: 'Diagnóstico Concluído',
        description: mensagem,
        variant: resultado.autenticado && resultado.acessoRLS ? 'success' : 'warning'
      });
      
      // Se a sessão estiver expirada, oferecer renovação
      if (resultado.tokenExpirado) {
        if (window.confirm('Sua sessão expirou. Deseja renovar a sessão agora?')) {
          window.location.reload();
        }
      }
      
      // Se estiver autenticado mas sem acesso RLS, tentar recarregar
      if (resultado.autenticado && !resultado.acessoRLS) {
        if (window.confirm('Problemas de acesso detectados. Deseja tentar recarregar a página?')) {
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Erro durante diagnóstico:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro durante o diagnóstico. Verifique o console para mais detalhes.',
        variant: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fadeIn bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2UyZThmMCIgb3BhY2l0eT0iMC4zIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row justify-between md:items-center">
            <h2 className="text-2xl font-cascadia mb-4 md:mb-0 flex items-center">
              <span className="bg-fiscal-green-500 text-white p-2 rounded-lg mr-3">
                <Package size={20} />
              </span>
              Gerenciamento de Produtos
            </h2>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleDiagnoseAuth}
                className="btn-secondary rounded-full flex items-center px-5"
                disabled={isLoading}
              >
                <Info size={18} className="mr-1" />
                Diagnóstico
              </button>
              
              <div className="relative group">
                <label className={`btn-secondary rounded-full flex items-center px-5 cursor-pointer ${importProgress ? 'opacity-50 cursor-not-allowed' : ''}`} htmlFor="csvImport">
                <Upload size={18} className="mr-1" />
                  {importProgress ? 'Importando...' : 'Importar CSV'}
                <input 
                  type="file" 
                  id="csvImport" 
                  accept=".csv" 
                  className="hidden" 
                  onChange={handleCSVImport}
                    disabled={!!importProgress}
                />
              </label>
                
                <div className="absolute right-0 mt-2 translate-y-1 hidden group-hover:block">
                  <CsvHelpDialog 
                    trigger={
                      <button className="flex items-center space-x-1 text-sm px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-600">
                        <HelpCircle size={14} />
                        <span>Ajuda</span>
                      </button>
                    } 
                  />
                </div>
              </div>
              
              <button
                onClick={() => {
                  setFormData({
                    name: '',
                    code: '',
                    price: 0,
                    description: '',
                    imageUrl: '',
                    ncm: '',
                    unit: '',
                    quantity: 0
                  });
                  setIsAddModalOpen(true);
                }}
                className="btn-primary rounded-full flex items-center px-5"
                disabled={!!importProgress}
              >
                    <Plus size={18} className="mr-1" />
                    Novo Produto
              </button>
            </div>
          </div>
          
          {/* Barra de progresso de importação */}
          {importProgress && (
            <div className="mt-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-blue-700">{importProgress.status}</span>
                <span className="text-sm font-medium text-blue-700">{Math.round((importProgress.current / importProgress.total) * 100)}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.round((importProgress.current / importProgress.total) * 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-blue-500 mt-1">
                {importProgress.current} de {importProgress.total} produtos processados. Por favor, não feche esta página.
              </p>
            </div>
          )}
        </div>
        
        {/* Edit Product Modal */}
        <ProductDialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <ProductDialogContent className="w-[95vw] max-w-3xl rounded-xl">
            <ProductDialogHeader>
              <ProductDialogTitle className="flex items-center">
                <span className="bg-fiscal-green-500 text-white p-2 rounded-lg mr-3">
                  <Edit size={20} />
                </span>
                Editar Produto
              </ProductDialogTitle>
            </ProductDialogHeader>
            
            <form onSubmit={handleSaveEditedProduct} className="mt-4 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Produto <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="edit-name"
                    name="name"
                    value={editingProduct?.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className={inputStyles}
                    placeholder="Nome do produto"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="edit-code" className="block text-sm font-medium text-gray-700 mb-1">
                    Código <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 ml-1">(máx. 9 caracteres)</span>
                  </label>
                  <input
                    type="text"
                    id="edit-code"
                    name="code"
                    value={editingProduct?.code || ''}
                    onChange={(e) => {
                      // Limitar para no máximo 9 caracteres
                      const limitedCode = e.target.value.slice(0, 9);
                      setEditingProduct({ ...editingProduct, code: limitedCode });
                    }}
                    className={inputStyles}
                    placeholder="Código único do produto"
                    required
                    maxLength={9}
                  />
                  {editingProduct?.code && editingProduct.code.length > 0 && (
                    <p className={`text-xs mt-1 ${editingProduct.code.length > 7 ? 'text-amber-500' : 'text-gray-500'}`}>
                      {editingProduct.code.length}/9 caracteres
                    </p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="edit-price" className="block text-sm font-medium text-gray-700 mb-1">
                    Preço (R$) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="edit-price"
                    name="price"
                    value={editingProduct?.price || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
                    className={inputStyles}
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit-ncm" className="block text-sm font-medium text-gray-700 mb-1">
                    NCM
                    <span className="text-xs text-gray-500 ml-1">(máx. 9 caracteres)</span>
                  </label>
                  <input
                    type="text"
                    id="edit-ncm"
                    name="ncm"
                    value={editingProduct?.ncm || ''}
                    onChange={(e) => {
                      const limitedNcm = e.target.value.slice(0, 9);
                      setEditingProduct({ ...editingProduct, ncm: limitedNcm });
                    }}
                    className={inputStyles}
                    placeholder="Código NCM (opcional)"
                    maxLength={9}
                  />
                </div>

                <div>
                  <label htmlFor="edit-unit" className="block text-sm font-medium text-gray-700 mb-1">
                    Unidade
                    <span className="text-xs text-gray-500 ml-1">(máx. 9 caracteres)</span>
                  </label>
                  <input
                    type="text"
                    id="edit-unit"
                    name="unit"
                    value={editingProduct?.unit || ''}
                    onChange={(e) => {
                      const limitedUnit = e.target.value.slice(0, 9);
                      setEditingProduct({ ...editingProduct, unit: limitedUnit });
                    }}
                    className={inputStyles}
                    placeholder="Unidade de medida (ex: UN, KG, M)"
                    maxLength={9}
                  />
                </div>

                <div>
                  <label htmlFor="edit-quantity" className="block text-sm font-medium text-gray-700 mb-1">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    id="edit-quantity"
                    name="quantity"
                    value={editingProduct?.quantity || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, quantity: parseFloat(e.target.value) })}
                    className={inputStyles}
                    placeholder="Quantidade em estoque"
                    min="0"
                    step="1"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  id="edit-description"
                  name="description"
                  value={editingProduct?.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className={inputStyles + " min-h-[80px]"}
                  placeholder="Descrição detalhada do produto (opcional)"
                  rows={3}
                />
              </div>
              
              <div>
                <label htmlFor="edit-imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  URL da Imagem
                </label>
                <input
                  type="url"
                  id="edit-imageUrl"
                  name="imageUrl"
                  value={editingProduct?.imageUrl || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, imageUrl: e.target.value })}
                  className={inputStyles}
                  placeholder="https://exemplo.com/imagem.jpg (opcional)"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="edit-imageFile" className="block text-sm font-medium text-gray-700 mb-1">
                  Imagem do Produto
                </label>
                <input
                  type="file"
                  id="edit-imageFile"
                  name="imageFile"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-fiscal-green-500 focus:border-fiscal-green-500 transition-colors"
                />
                {editingProduct?.imageUrl && (
                  <div className="mt-2">
                    <img src={editingProduct.imageUrl} alt="Imagem atual" className="h-20 w-20 object-cover rounded-xl border border-gray-200" />
                    <p className="text-xs text-gray-500">Imagem atual</p>
                  </div>
                )}
              </div>
              
              <ProductDialogFooter>
                <ProductDialogClose asChild>
                  <button type="button" className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium">
                    Cancelar
                  </button>
                </ProductDialogClose>
                <button 
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-fiscal-green-500 text-white hover:bg-fiscal-green-600 transition-colors flex items-center text-sm font-medium shadow-sm"
                >
                  <Save size={18} className="mr-2" />
                  Salvar Alterações
                </button>
              </ProductDialogFooter>
            </form>
          </ProductDialogContent>
        </ProductDialog>
        
        {/* Add Product Modal */}
        <ProductDialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <ProductDialogContent className="w-[95vw] max-w-3xl rounded-xl">
            <ProductDialogHeader>
              <ProductDialogTitle className="flex items-center">
              <span className="bg-fiscal-green-500 text-white p-2 rounded-lg mr-3">
                <Plus size={20} />
              </span>
                Adicionar Novo Produto
              </ProductDialogTitle>
            </ProductDialogHeader>
            
            <form onSubmit={handleAddProduct} className="mt-4 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Produto <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={inputStyles}
                    placeholder="Nome do produto"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                    Código <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 ml-1">(máx. 9 caracteres)</span>
                  </label>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={(e) => {
                      // Limitar em tempo real para no máximo 9 caracteres
                      const limitedCode = e.target.value.slice(0, 9);
                      setFormData({ ...formData, code: limitedCode });
                    }}
                    className={`${inputStyles} ${formData.code.length > 9 ? 'border-red-500 bg-red-50' : ''}`}
                    placeholder="Código único do produto"
                    required
                    maxLength={9}
                  />
                  {formData.code.length > 0 && (
                    <p className={`text-xs mt-1 ${formData.code.length > 7 ? 'text-amber-500' : 'text-gray-500'}`}>
                      {formData.code.length}/9 caracteres
                    </p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                    Preço (R$) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    className={inputStyles}
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="ncm" className="block text-sm font-medium text-gray-700 mb-1">
                    NCM
                    <span className="text-xs text-gray-500 ml-1">(máx. 9 caracteres)</span>
                  </label>
                  <input
                    type="text"
                    id="ncm"
                    name="ncm"
                    value={formData.ncm}
                    onChange={(e) => {
                      const limitedNcm = e.target.value.slice(0, 9);
                      setFormData({ ...formData, ncm: limitedNcm });
                    }}
                    className={inputStyles}
                    placeholder="Código NCM (opcional)"
                    maxLength={9}
                  />
                  {formData.ncm && formData.ncm.length > 0 && (
                    <p className="text-xs mt-1 text-gray-500">
                      {formData.ncm.length}/9 caracteres
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                    Unidade
                    <span className="text-xs text-gray-500 ml-1">(máx. 9 caracteres)</span>
                  </label>
                  <input
                    type="text"
                    id="unit"
                    name="unit"
                    value={formData.unit}
                    onChange={(e) => {
                      const limitedUnit = e.target.value.slice(0, 9);
                      setFormData({ ...formData, unit: limitedUnit });
                    }}
                    className={inputStyles}
                    placeholder="Unidade de medida (ex: UN, KG, M)"
                    maxLength={9}
                  />
                  {formData.unit && formData.unit.length > 0 && (
                    <p className="text-xs mt-1 text-gray-500">
                      {formData.unit.length}/9 caracteres
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                    className={inputStyles}
                    placeholder="Quantidade em estoque"
                    min="0"
                    step="1"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={inputStyles + " min-h-[80px]"}
                  placeholder="Descrição detalhada do produto (opcional)"
                    rows={3}
                  />
                </div>
                
              <div>
                <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  URL da Imagem
                </label>
                  <input
                    type="url"
                    id="imageUrl"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className={inputStyles}
                  placeholder="https://exemplo.com/imagem.jpg (opcional)"
                  />
                </div>
                
              <div>
                <label htmlFor="imageFile" className="block text-sm font-medium text-gray-700 mb-1">
                  Imagem do Produto
                </label>
                <input
                  type="file"
                  id="imageFile"
                  name="imageFile"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-fiscal-green-500 focus:border-fiscal-green-500 transition-colors"
                />
              </div>
                
              <ProductDialogFooter>
                <ProductDialogClose asChild>
                  <button type="button" className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium">
                  Cancelar
                </button>
                </ProductDialogClose>
                <button 
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-fiscal-green-500 text-white hover:bg-fiscal-green-600 transition-colors flex items-center text-sm font-medium shadow-sm"
                >
                  <Plus size={18} className="mr-2" />
                  Adicionar Produto
                  </button>
              </ProductDialogFooter>
            </form>
          </ProductDialogContent>
        </ProductDialog>
        
        {/* Search Products */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center mb-6">
            <span className="bg-fiscal-green-500 text-white p-2 rounded-lg mr-3">
              <Search size={20} />
            </span>
            <h3 className="text-lg font-cascadia">Buscar Produtos</h3>
          </div>
          
          <div className="relative mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por nome, código ou NCM..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Voltar para a primeira página ao pesquisar
                }}
                className="w-full py-2.5 pl-10 pr-4 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-fiscal-green-500 focus:border-fiscal-green-500 transition-colors"
              />
            </div>
          </div>

          {/* Contador de produtos */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Lista de Produtos</h3>
            <span className="text-sm text-gray-500">
              {products.length} produtos
            </span>
          </div>
          
          {products.length > 0 && (
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="selectAll"
                  checked={selectedProducts.length === products.length}
                  onChange={() => setSelectedProducts(selectedProducts.length === products.length ? [] : products.map(p => p.id))}
                  className="h-4 w-4 text-fiscal-green-600 rounded border-gray-300 focus:ring-fiscal-green-500"
                />
                <label htmlFor="selectAll" className="ml-2 text-sm font-medium text-gray-700">
                  Selecionar Todos
                </label>
              </div>
              
              {selectedProducts.length > 0 && (
                <button
                  onClick={handleDeleteSelectedProducts}
                  className="flex items-center px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition-colors"
                >
                  <Trash2 size={16} className="mr-1" />
                  Apagar Selecionados ({selectedProducts.length})
                </button>
              )}
            </div>
          )}
          
          {/* Implementar lógica de filtro para a pesquisa */}
          {(() => {
            // Filtrar produtos com base no termo de pesquisa
            const filteredProducts = products.filter(product => {
              const searchTermLower = searchTerm.toLowerCase();
              return (
                // Pesquisar por nome
                (product.name && product.name.toLowerCase().includes(searchTermLower)) ||
                // Pesquisar por código
                (product.code && product.code.toLowerCase().includes(searchTermLower)) ||
                // Pesquisar por NCM
                (product.ncm && product.ncm.toLowerCase().includes(searchTermLower)) ||
                // Pesquisar por descrição
                (product.description && product.description.toLowerCase().includes(searchTermLower))
              );
            });

            // Calcular paginação
            const indexOfLastProduct = currentPage * productsPerPage;
            const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
            const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
            const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

            // Mostrar mensagem quando não há resultados para a pesquisa
            if (searchTerm && filteredProducts.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <Search size={40} className="mb-2 opacity-40" />
                  <p>Nenhum produto encontrado para "{searchTerm}"</p>
                  <p className="text-sm mt-1">Tente outro termo de pesquisa.</p>
                </div>
              );
            }
            
            // Exibir produtos ou mensagem de nenhum produto cadastrado
            return filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <Package size={40} className="mb-2 opacity-40" />
                <p>Nenhum produto cadastrado</p>
              <p className="text-sm mt-1">Clique em "Novo Produto" para adicionar ou importe um arquivo CSV.</p>
              </div>
            ) : (
              <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentProducts.map(product => (
                  <div 
                    key={product.id} 
                    className="relative border border-gray-200 rounded-xl p-4 hover:border-fiscal-green-100 hover:bg-fiscal-green-50 transition-all duration-200"
                  >
                  <div className="absolute top-3 left-3">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => setSelectedProducts(selectedProducts.includes(product.id) ? selectedProducts.filter(id => id !== product.id) : [...selectedProducts, product.id])}
                      className="h-4 w-4 text-fiscal-green-600 rounded border-gray-300 focus:ring-fiscal-green-500"
                    />
                  </div>
                  
                  <div className="flex items-start ml-6">
                    <div className="flex-shrink-0 bg-gray-100 w-14 h-14 rounded-md flex items-center justify-center mr-3">
                      {product.imageUrl ? (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name} 
                          className="w-full h-full object-cover rounded-md"
                            onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/56?text=Produto';
                          }}
                        />
                      ) : (
                        <Image className="text-gray-400" size={24} />
                      )}
                    </div>
                  
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <h4 className="font-cascadia text-base text-fiscal-green-900 mb-0.5 truncate">{product.name || "Produto Importado"}</h4>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => {
                              setEditingProduct(product);
                              setIsEditModalOpen(true);
                            }}
                            className="text-blue-500 hover:text-blue-700 focus:outline-none p-1 flex items-center justify-center"
                            title="Editar produto"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-500 hover:text-red-700 focus:outline-none p-1 flex items-center justify-center"
                            title="Remover produto"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500 mb-2 flex items-center">
                        <Tag size={14} className="mr-1" />
                        <span>Código: {product.code}</span>
                      </div>
                      
                      {product.ncm && (
                        <div className="text-xs text-gray-500 mb-2">
                          <span>NCM: {product.ncm}</span>
                        </div>
                      )}
                      
                      {product.description && (
                        <div className="text-xs text-gray-500 mb-2">
                          <span>{product.description}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <span className="text-fiscal-green-600 font-medium">
                          R$ {product.price.toFixed(2)}
                        </span>
                        
                        <span className="text-sm text-gray-500">
                          {product.quantity !== undefined ? `${product.quantity} ${product.unit || 'UN'}` : (product.unit || 'UN')}
                        </span>
                      </div>
                    </div>
                    </div>
                  </div>
                ))}
              </div>
                
                {/* Controles de paginação */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center mt-6 space-x-2">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`p-2 rounded-full ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                      aria-label="Página anterior"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      {/* Mostrar 5 números de página */}
                      {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                        // Lógica para determinar quais números de página mostrar
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = idx + 1;
                        } else if (currentPage <= 3) {
                          pageNum = idx + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + idx;
                        } else {
                          pageNum = currentPage - 2 + idx;
                        }
                        
                        // Garantir que o número da página está dentro dos limites
                        if (pageNum > 0 && pageNum <= totalPages) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-8 h-8 flex items-center justify-center rounded-full ${currentPage === pageNum ? 'bg-fiscal-green-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                            >
                              {pageNum}
                            </button>
                          );
                        }
                        return null;
                      })}
                      
                      {/* Mostrar reticências se houver muitas páginas */}
                      {totalPages > 5 && currentPage < totalPages - 2 && (
                        <span className="px-1 text-gray-500">...</span>
                      )}
                      
                      {/* Sempre mostrar a última página se houver muitas páginas */}
                      {totalPages > 5 && currentPage < totalPages - 2 && (
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          className={`w-8 h-8 flex items-center justify-center rounded-full text-gray-700 hover:bg-gray-100`}
                        >
                          {totalPages}
                        </button>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`p-2 rounded-full ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                      aria-label="Próxima página"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                )}
                
                {/* Informação sobre a paginação */}
                <div className="text-center text-sm text-gray-500 mt-2">
                  Mostrando {indexOfFirstProduct + 1}-{Math.min(indexOfLastProduct, filteredProducts.length)} de {filteredProducts.length} produtos
                </div>
              </>
            );
          })()}
        </div>
        
        {/* Help Section */}
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
          <div className="flex items-start">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <Info size={20} className="text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-blue-800">Dicas para gerenciamento de produtos</h4>
              <ul className="text-sm text-blue-700 mt-1 space-y-1 list-disc pl-4">
                <li>Use códigos únicos para facilitar a identificação dos produtos</li>
                <li>Adicione imagens usando URLs diretas de imagens (ex: https://exemplo.com/imagem.jpg)</li>
                <li>Para importar produtos, use arquivos CSV com as colunas: NCM, Descrição, Unidade, Quantidade, Preço</li>
                <li>O arquivo CSV pode usar ";" ou "," como separador</li>
                <li>Se precisar de ajuda com CSV, clique no botão "Ajuda" próximo ao botão de importação</li>
                <li>Todos os produtos ficam salvos no seu dispositivo e podem ser usados nos orçamentos</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductManagement;