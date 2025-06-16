import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EcommerceService, EcommerceProduct, ProductReview, Seller, NewCustomerData, NewOrderKanbanData } from '@/services/ecommerceService';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Star, ChevronLeft, Share2, Heart, MessageSquare, Send, Plus, Minus, UserCircle2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { applyStoreTheme } from '@/utils/applyStoreTheme'; // Para aplicar o tema
import { loadGoogleFont } from '@/utils/loadGoogleFont'; // Para carregar a fonte
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose, // Para fechar o modal
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Para seleção de vendedor
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group" // Alternativa para seleção de vendedor

const StarRating: React.FC<{ rating: number; setRating?: (rating: number) => void; interactive?: boolean; size?: number }> = ({ rating, setRating, interactive = false, size = 18 }) => {
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => {
        const starValue = i + 1;
        return (
          <Star 
            key={i} 
            size={size}
            className={`cursor-${interactive ? 'pointer' : 'default'} transition-colors ${starValue <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} ${interactive && 'hover:text-yellow-500'}`}
            onClick={() => interactive && setRating && setRating(starValue)}
          />
        );
      })}
    </div>
  );
};

const ProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth(); // Obter usuário do contexto de autenticação
  const { toast } = useToast();
  const [product, setProduct] = useState<EcommerceProduct | null>(null);
  const [storeInfo, setStoreInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true); // Estado para carregamento de reviews
  const [quantity, setQuantity] = useState(1);

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [newReviewAuthor, setNewReviewAuthor] = useState(user?.user_metadata?.full_name || user?.email || ''); // Preencher se usuário logado
  const [newReviewRating, setNewReviewRating] = useState(0);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Estados para a funcionalidade de WhatsApp
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerStreet, setCustomerStreet] = useState('');
  const [customerNumber, setCustomerNumber] = useState('');
  const [customerNeighborhood, setCustomerNeighborhood] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerState, setCustomerState] = useState('');
  const [customerZipCode, setCustomerZipCode] = useState('');
  const [isSubmittingWhatsApp, setIsSubmittingWhatsApp] = useState(false);

  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const fetchProductData = async () => {
      if (!productId) return;
      setIsLoading(true);
      try {
        const productData = await EcommerceService.getProductById(productId);
        setProduct(productData);
        if (!productData) {
          toast({ title: "Erro", description: "Produto não encontrado.", variant: "destructive" });
          navigate('/ecommerce');
          return;
        }
      } catch (error) {
        console.error('Erro ao carregar detalhes do produto:', error);
        toast({ title: 'Erro', description: 'Não foi possível carregar os detalhes do produto.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };

    const fetchStoreInfoAndTheme = async () => {
      try {
        const sInfo = await EcommerceService.getStoreInfo();
        setStoreInfo(sInfo);
        if (sInfo?.font_family) loadGoogleFont(sInfo.font_family);
        if (sInfo) applyStoreTheme(sInfo);
      } catch (error) {
        console.error('Erro ao carregar informações da loja:', error);
      }
    };
    
    const fetchReviews = async () => {
      if (!productId) return;
      setIsLoadingReviews(true);
      try {
        const fetchedReviews = await EcommerceService.getProductReviews(productId);
        setReviews(fetchedReviews);
      } catch (error) {
        console.error('Erro ao buscar reviews:', error);
        toast({ title: 'Erro', description: 'Não foi possível carregar as avaliações.', variant: 'destructive' });
      } finally {
        setIsLoadingReviews(false);
      }
    };

    fetchProductData();
    fetchStoreInfoAndTheme();
    fetchReviews();
  }, [productId, toast, navigate]);
  
  useEffect(() => {
    // Atualiza o nome do autor no formulário de review se o usuário logar/deslogar ou mudar
    if (user && !newReviewAuthor) {
        setNewReviewAuthor(user.user_metadata?.full_name || user.email || '');
    }
  }, [user, newReviewAuthor]);

  // Efeito para buscar vendedores quando storeInfo (e owner_id) estiver disponível
  useEffect(() => {
    const fetchSellers = async () => {
      if (storeInfo?.owner_id) {
        try {
          const fetchedSellers = await EcommerceService.getActiveSellers(storeInfo.owner_id);
          setSellers(fetchedSellers);
          if (fetchedSellers.length > 0) {
            // Opcional: pré-selecionar o primeiro vendedor
            // setSelectedSellerId(fetchedSellers[0].id);
          }
        } catch (error) {
          console.error("Erro ao buscar vendedores:", error);
          toast({ title: "Erro", description: "Não foi possível carregar a lista de vendedores.", variant: "destructive" });
        }
      }
    };
    fetchSellers();
  }, [storeInfo, toast]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return;
    if (!newReviewRating || !newReviewComment.trim()) {
      toast({ title: "Atenção", description: "Por favor, selecione uma nota e escreva um comentário.", variant: "default" });
      return;
    }
    setIsSubmittingReview(true);
    try {
      const reviewPayload = {
        product_id: productId,
        user_id: user?.id, // Inclui user_id se o usuário estiver logado
        author_name: newReviewAuthor.trim() || (user ? (user.user_metadata?.full_name || user.email || 'Usuário Autenticado') : 'Anônimo'),
        rating: newReviewRating,
        comment: newReviewComment.trim(),
      };
      const submittedReview = await EcommerceService.addProductReview(reviewPayload);
      setReviews(prev => [submittedReview, ...prev]); // Adiciona no topo para feedback imediato
      setNewReviewRating(0);
      setNewReviewComment('');
      // Não limpar newReviewAuthor se o usuário estiver logado, para conveniência
      if (!user) setNewReviewAuthor(''); 
      toast({ title: "Obrigado!", description: "Sua avaliação foi enviada com sucesso." });
    } catch (error) {
      console.error("Erro ao submeter review:", error);
      toast({ title: "Erro", description: "Não foi possível enviar sua avaliação. Tente novamente.", variant: "destructive" });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
      toast({
        title: 'Produto adicionado',
        description: `${product.name} (x${quantity}) foi adicionado ao carrinho.`,
      });
    }
  };

  const handleBuyNow = () => {
    if (product) {
      addToCart(product, quantity);
      navigate('/ecommerce/checkout');
    }
  };
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleWhatsAppFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !selectedSellerId || !storeInfo?.owner_id) {
      toast({ title: "Erro", description: "Informações do produto, vendedor ou loja ausentes.", variant: "destructive"});
      return;
    }
    if (!customerName || !customerPhone || !customerZipCode || !customerCity || !customerStreet) {
        toast({ title: "Campos Obrigatórios", description: "Por favor, preencha nome, telefone, CEP, rua e cidade.", variant: "default"});
        return;
    }

    const selectedSeller = sellers.find(s => s.id === selectedSellerId);
    if (!selectedSeller || !selectedSeller.phone) {
      toast({ title: "Erro", description: "Vendedor selecionado não encontrado ou sem telefone.", variant: "destructive"});
      return;
    }

    setIsSubmittingWhatsApp(true);
    try {
      const customerData: NewCustomerData = {
        name: customerName,
        phone: customerPhone,
        email: null, // Definimos como null explicitamente
        address: {
          street: customerStreet,
          number: customerNumber,
          neighborhood: customerNeighborhood,
          city: customerCity,
          state: customerState,
          zipCode: customerZipCode,
        },
        owner_id: storeInfo.owner_id, // Usar o owner_id da loja
      };
      
      const newCustomer = await EcommerceService.createCustomer(customerData);
      toast({ title: "Sucesso", description: `Olá ${newCustomer.name}, seus dados foram salvos!` });

      // Após criar o cliente, criar também um registro de pedido no sistema Kanban
      try {
        const orderData: NewOrderKanbanData = {
          customer_id: newCustomer.id,
          customer_name: newCustomer.name,
          product_id: product.id,
          product_name: product.name,
          seller_id: selectedSeller.id,
          seller_name: selectedSeller.full_name,
          status: 'entrada', // Status inicial: entrada
          notes: `Pedido via WhatsApp. Valor: ${formatPrice(product.price)}`,
        };

        const orderId = await EcommerceService.createOrderKanban(orderData);
        if (orderId) {
          console.log("Pedido adicionado ao sistema Kanban!", orderId);
          toast({ title: "Pedido Criado", description: "Seu pedido foi adicionado ao sistema." });
        }
      } catch (orderError) {
        console.error("Erro ao criar pedido no Kanban:", orderError);
        // Não bloquear o fluxo principal se falhar a criação do pedido no Kanban
      }

      // Preparar mensagem para WhatsApp
      let message = `Olá, ${selectedSeller.full_name}! Tenho interesse no produto: ${product.name} (ID: ${product.id}).`;
      message += `\n\nMeus dados para contato:`;
      message += `\nNome: ${newCustomer.name}`;
      message += `\nTelefone: ${newCustomer.phone}`;
      if (newCustomer.address) {
        message += `\nEndereço: ${newCustomer.address.street || ''}, ${newCustomer.address.number || ''} - ${newCustomer.address.neighborhood || ''}. ${newCustomer.address.city || ''}/${newCustomer.address.state || ''}. CEP: ${newCustomer.address.zipCode || ''}`;
      }
      
      // Remover caracteres não numéricos do telefone do vendedor
      const sellerPhoneNumber = selectedSeller.phone.replace(/\D/g, '');
      // Adicionar código do país se não estiver presente (ex: 55 para Brasil)
      const whatsappNumber = sellerPhoneNumber.startsWith('55') ? sellerPhoneNumber : `55${sellerPhoneNumber}`;

      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      
      window.open(whatsappUrl, '_blank');
      setIsWhatsAppModalOpen(false); // Fechar modal após sucesso
      // Limpar formulário
      setCustomerName('');
      setCustomerPhone('');
      setCustomerStreet('');
      setCustomerNumber('');
      setCustomerNeighborhood('');
      setCustomerCity('');
      setCustomerState('');
      setCustomerZipCode('');
      setSelectedSellerId(null);

    } catch (error: any) {
      console.error("Erro ao submeter contato WhatsApp:", error);
      toast({ title: "Erro ao contatar", description: error.message || "Não foi possível completar a solicitação.", variant: "destructive"});
    } finally {
      setIsSubmittingWhatsApp(false);
    }
  };

  // Detectar dispositivo móvel
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768); // 768px é o breakpoint para md: no Tailwind
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8" style={{ fontFamily: storeInfo?.font_family || 'sans-serif' }}>
        <Skeleton className="w-24 h-8 mb-6" />
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Skeleton className="w-full aspect-square rounded-2xl" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="w-full aspect-square rounded-xl" />
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="w-3/4 h-12" />
            <div className="flex items-center space-x-4">
              <Skeleton className="w-32 h-8" />
              <Skeleton className="w-24 h-8" />
            </div>
            <Skeleton className="w-1/2 h-10" />
            <Skeleton className="w-full h-32" />
            <div className="flex items-center space-x-4">
              <Skeleton className="w-32 h-12" />
              <Skeleton className="w-full h-12" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-semibold mb-6">Produto não encontrado</h1>
        <Button 
          onClick={() => navigate('/ecommerce')} 
          className="inline-flex items-center px-6 py-3 text-lg"
          variant="outline"
        >
          <ChevronLeft className="mr-2 h-5 w-5" /> Voltar para Loja
        </Button>
      </div>
    );
  }

  const averageRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: storeInfo?.font_family || 'sans-serif' }}>
      {/* Breadcrumb com design melhorado */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center text-sm">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/ecommerce')} 
              className="text-gray-600 hover:text-[var(--store-primary)] transition-colors"
            >
              Início
            </Button>
            <ChevronLeft className="mx-2 h-4 w-4 text-gray-400" />
            <span className="font-medium text-gray-900">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal com Layout Melhorado */}
      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8"> {/* Adicionado pb-24 para mobile para dar espaço para a barra fixa */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Galeria de Imagens Melhorada */}
            <div className="space-y-6">
              <div className="relative overflow-hidden rounded-2xl bg-white border shadow-sm group">
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="w-full aspect-square object-cover transform group-hover:scale-105 transition-transform duration-300" 
                />
                <Button
                  variant="ghost"
                  className="absolute top-4 right-4 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white/90 p-2"
                  onClick={() => {/* Implementar favoritos */}}
                >
                  <Heart className="h-5 w-5 text-gray-700" />
                </Button>
              </div>
              
              {/* Thumbnails com hover effect */}
              {product.additionalImages && product.additionalImages.length > 0 && (
                <div className="grid grid-cols-4 gap-4">
                  {product.additionalImages.map((img, idx) => (
                    <div 
                      key={idx}
                      className="aspect-square rounded-xl overflow-hidden border cursor-pointer hover:border-[var(--store-primary)] transition-all"
                    >
                      <img 
                        src={img} 
                        alt={`${product.name} - Vista ${idx + 1}`}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Informações do Produto */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-semibold mb-3">{product.name}</h1>
                <div className="flex items-center space-x-4 mb-4">
                  <StarRating rating={averageRating} size={20} />
                  <span className="text-gray-600">
                    ({reviews.length} {reviews.length === 1 ? 'avaliação' : 'avaliações'})
                  </span>
                </div>
                <div className="text-3xl font-bold text-[var(--store-primary)]">
                  {formatPrice(product.price)}
                </div>
              </div>

              <p className="text-gray-600 leading-relaxed">{product.description}</p>

              {/* Controles de Quantidade */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center border rounded-lg overflow-hidden">
                  <Button
                    variant="ghost"
                    className="px-3 py-2 hover:bg-gray-100"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="px-4 py-2 font-medium text-lg min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <Button
                    variant="ghost"
                    className="px-3 py-2 hover:bg-gray-100"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
                <Button
                  size="lg" 
                  onClick={handleAddToCart} 
                  className="w-full sm:w-auto flex-grow bg-[var(--store-primary)] hover:bg-[var(--store-primary-hover)] text-[var(--store-primary-foreground)] rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md"
                  aria-label={`Adicionar ${product.name} ao carrinho`}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" /> Adicionar ao Carrinho
                </Button>
                <Button
                  size="lg" 
                  onClick={handleBuyNow} 
                  variant="outline"
                  className="w-full sm:w-auto flex-grow border-[var(--store-primary)] text-[var(--store-primary)] hover:bg-[var(--store-primary-hover)] hover:text-[var(--store-primary-foreground)] rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md"
                  aria-label={`Comprar ${product.name} agora`}
                >
                  Comprar Agora
                </Button>
              </div>

              {/* Botão WhatsApp e Modal */} 
              {sellers.length > 0 && (
                <Dialog open={isWhatsAppModalOpen} onOpenChange={setIsWhatsAppModalOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      size="lg" 
                      className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md flex items-center justify-center"
                      aria-label="Contatar via WhatsApp"
                    >
                      <MessageSquare className="mr-2 h-5 w-5" /> Contatar via WhatsApp
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[525px] bg-white dark:bg-gray-900 shadow-xl rounded-lg p-6">
                    <DialogHeader>
                      <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">Contatar Vendedor via WhatsApp</DialogTitle>
                      <DialogDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Preencha seus dados e selecione um vendedor para iniciar a conversa.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleWhatsAppFormSubmit} className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="seller">Selecione o Vendedor *</Label>
                        {sellers.length > 0 ? (
                          <div className="mt-2 overflow-x-auto pb-2">
                            <div className="flex">
                              {sellers.map(seller => (
                                <button
                                  key={seller.id}
                                  type="button" // Importante para não submeter o formulário principal
                                  onClick={() => setSelectedSellerId(seller.id)}
                                  className={cn(
                                    "m-[5px] border rounded-xl p-3 min-w-[120px] max-w-[150px] flex flex-col items-center justify-start text-center transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2",
                                    selectedSellerId === seller.id 
                                      ? "border-blue-600 ring-2 ring-blue-500 shadow-lg bg-blue-50 dark:bg-blue-900/60"
                                      : "border-gray-300 dark:border-gray-600 hover:shadow-md hover:border-gray-400 dark:hover:border-gray-500 focus:ring-offset-2 focus:ring-blue-400"
                                  )}
                                >
                                  <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center mb-2 shadow-sm bg-gray-100 dark:bg-gray-700">
                                    {seller.image_path ? (
                                      <img 
                                        src={seller.image_path} // Lembre-se de ajustar a URL se necessário (Supabase Storage)
                                        alt={seller.full_name} 
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div 
                                        className="w-full h-full flex items-center justify-center text-white text-2xl font-semibold"
                                        style={{ backgroundColor: storeInfo?.primary_color || '#cccccc' }} // Cor do tema ou fallback
                                      >
                                        {seller.full_name ? seller.full_name.charAt(0).toUpperCase() : 'V'}
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate w-full h-8 flex items-center justify-center">
                                    {seller.full_name}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Nenhum vendedor disponível no momento.</p>
                        )}
                        {!selectedSellerId && sellers.length > 0 && (
                            <p className="text-xs text-red-500 mt-1">Por favor, selecione um vendedor.</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="customerName">Nome Completo *</Label>
                          <Input id="customerName" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Seu nome completo" required />
                        </div>
                        <div>
                          <Label htmlFor="customerPhone">Telefone (WhatsApp) *</Label>
                          <Input id="customerPhone" type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="(XX) XXXXX-XXXX" required />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="customerZipCode">CEP *</Label>
                        <Input id="customerZipCode" value={customerZipCode} onChange={e => setCustomerZipCode(e.target.value)} placeholder="XXXXX-XXX" required />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2">
                          <Label htmlFor="customerStreet">Rua/Avenida *</Label>
                          <Input id="customerStreet" value={customerStreet} onChange={e => setCustomerStreet(e.target.value)} placeholder="Nome da rua/avenida" required/>
                        </div>
                        <div>
                          <Label htmlFor="customerNumber">Número</Label>
                          <Input id="customerNumber" value={customerNumber} onChange={e => setCustomerNumber(e.target.value)} placeholder="Nº" />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="customerNeighborhood">Bairro</Label>
                        <Input id="customerNeighborhood" value={customerNeighborhood} onChange={e => setCustomerNeighborhood(e.target.value)} placeholder="Seu bairro" />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="customerCity">Cidade *</Label>
                          <Input id="customerCity" value={customerCity} onChange={e => setCustomerCity(e.target.value)} placeholder="Sua cidade" required />
                        </div>
                        <div>
                          <Label htmlFor="customerState">Estado</Label>
                          <Input id="customerState" value={customerState} onChange={e => setCustomerState(e.target.value)} placeholder="UF" />
                        </div>
                      </div>
                      
                      <DialogFooter className="sm:justify-start pt-4 mt-6">
                        <Button type="submit" disabled={isSubmittingWhatsApp || !selectedSellerId} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md disabled:opacity-70">
                          {isSubmittingWhatsApp ? 'Enviando...' : 'Salvar e Abrir WhatsApp'}
                        </Button>
                        <DialogClose asChild>
                           <Button type="button" variant="outline" className="w-full sm:w-auto mt-2 sm:mt-0 px-6 py-2 rounded-md">
                            Cancelar
                          </Button>
                        </DialogClose>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
              {/* Fim Botão WhatsApp e Modal */} 

              {/* Compartilhamento e Lista de Desejos (se habilitado) */}
              {(storeInfo?.show_social_share_buttons || storeInfo?.enable_wishlist) && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <Button
                  variant="ghost"
                  className="text-gray-600 hover:text-[var(--store-primary)]"
                  onClick={() => {/* Implementar compartilhamento */}}
                >
                  <Share2 className="mr-2 h-5 w-5" />
                  Compartilhar
                </Button>
                  <Button
                    variant="ghost"
                    className="text-gray-600 hover:text-[var(--store-primary)]"
                    onClick={() => navigate('/ecommerce')}
                  >
                    <ChevronLeft className="mr-2 h-5 w-5" /> Voltar para Loja
                </Button>
              </div>
              )}
              
              {/* Botão WhatsApp aqui se sellers.length === 0 e você quiser um fallback */}
              {sellers.length === 0 && product && (
                 <Button 
                  size="lg" 
                  variant="outline"
                  className="w-full mt-4 border-gray-300 text-gray-500 rounded-lg flex items-center justify-center cursor-not-allowed"
                  disabled
                  title="Nenhum vendedor disponível para contato via WhatsApp no momento"
                >
                  <MessageSquare className="mr-2 h-5 w-5" /> WhatsApp Indisponível
                </Button>
              )}
            </div>
          </div>

          {/* Seção de Avaliações */}
          <div className="mt-16 pt-8 border-t">
            <h2 className="text-2xl font-semibold mb-8">Avaliações dos Clientes</h2>
            
            {/* Resumo das Avaliações */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl font-bold mb-2">{averageRating.toFixed(1)}</div>
                  <StarRating rating={averageRating} size={24} />
                  <div className="text-gray-600 mt-2">
                    Baseado em {reviews.length} {reviews.length === 1 ? 'avaliação' : 'avaliações'}
                  </div>
                </div>
                <Button
                  className="h-12 px-6 text-lg bg-[var(--store-primary)] text-white hover:bg-[var(--store-primary-hover)]"
                  onClick={() => document.getElementById('review-form')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Avaliar Produto
                </Button>
              </div>
            </div>

            {/* Lista de Avaliações */}
            {isLoadingReviews ? (
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <Skeleton className="h-24 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((review, index) => (
                  <div 
                    key={index}
                    className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-medium">{review.author_name}</h3>
                        <StarRating rating={review.rating} size={16} />
                      </div>
                      <span className="text-gray-500 text-sm">
                        {new Date(review.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Formulário de Avaliação */}
            <form 
              id="review-form"
              onSubmit={handleReviewSubmit}
              className="mt-12 bg-white rounded-xl p-6 shadow-sm border"
            >
              <h3 className="text-xl font-semibold mb-6">Deixe sua Avaliação</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Seu Nome</label>
                  <Input
                    value={newReviewAuthor}
                    onChange={(e) => setNewReviewAuthor(e.target.value)}
                    placeholder="Digite seu nome"
                    className="w-full"
                    disabled={!!user}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Sua Avaliação</label>
                  <div className="mb-4">
                    <StarRating
                      rating={newReviewRating}
                      setRating={setNewReviewRating}
                      interactive={true}
                      size={24}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Seu Comentário</label>
                  <Textarea
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    placeholder="Conte-nos sua experiência com o produto..."
                    className="w-full min-h-[120px]"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-[var(--store-primary)] text-white hover:bg-[var(--store-primary-hover)]"
                  disabled={isSubmittingReview}
                >
                  {isSubmittingReview ? (
                    <span>Enviando...</span>
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      Enviar Avaliação
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Container fixo para botões em dispositivos móveis */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 p-3 z-50">
            <div className="flex gap-2 max-w-md mx-auto">
              <Button 
                size="default" 
                onClick={handleAddToCart} 
                className="w-full bg-[var(--store-primary)] hover:bg-[var(--store-primary-hover)] text-white"
                aria-label={`Adicionar ${product?.name || 'produto'} ao carrinho`}
              >
                <ShoppingCart className="mr-1 h-4 w-4" /> Carrinho
              </Button>
              <Button 
                size="default" 
                onClick={handleBuyNow} 
                variant="outline"
                className="w-full border-[var(--store-primary)] text-[var(--store-primary)]"
                aria-label={`Comprar ${product?.name || 'produto'} agora`}
              >
                Comprar
              </Button>
              {sellers.length > 0 && (
                <Button 
                  size="default"
                  onClick={() => setIsWhatsAppModalOpen(true)}
                  className="w-full bg-green-500 hover:bg-green-600 text-white"
                  aria-label="Contatar via WhatsApp"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage; 