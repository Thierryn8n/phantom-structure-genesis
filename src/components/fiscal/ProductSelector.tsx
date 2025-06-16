import React, { useState, useEffect } from 'react';
import { Plus, Minus, Search, ShoppingCart, Package, Trash2, Tag, Image, Edit, X, Check, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDeviceDetect } from '@/hooks/useDeviceDetect';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { EcommerceService } from '@/services/ecommerceService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Product {
  id: string;
  name: string;
  code: string;
  price: number;
  description?: string;
  imageUrl?: string;
  unit?: string;
}

export interface SelectedProduct extends Product {
  quantity: number;
  subtotal: number;
}

interface ProductSelectorProps {
  onProductsChange: (products: SelectedProduct[]) => void;
  initialSelectedProducts?: SelectedProduct[];
}

// Modal/Dialog components
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
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 rounded-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-2 bg-gray-100 opacity-70 hover:opacity-100 hover:bg-gray-200 transition-all">
        <X className="h-4 w-4" />
        <span className="sr-only">Fechar</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </EditProductDialogPortal>
));

// Component for displaying the dialog header
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

// Component for displaying the dialog footer
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

// Component for dialog title
const EditProductDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-gray-900", className)}
    {...props}
  />
));

// Component for dialog description
const EditProductDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-gray-500", className)}
    {...props}
  />
));

const ProductSelector: React.FC<ProductSelectorProps> = ({ onProductsChange, initialSelectedProducts = [] }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(initialSelectedProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const { isMobile } = useDeviceDetect();
  const [editingProduct, setEditingProduct] = useState<SelectedProduct | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar produtos do Supabase
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        if (!user?.id) {
          toast({
            title: "Erro de autenticação",
            description: "Você precisa estar logado para ver os produtos.",
            variant: "error"
          });
          return;
        }

        console.log("Iniciando carregamento de todos os produtos...");
        // Usando -1 como limite para buscar todos os produtos de uma vez
        const { data: productsData } = await EcommerceService.getProducts(1, -1, '', '', user.id);
        
        // Mapear os produtos para o formato necessário
        const mappedProducts: Product[] = productsData.map(p => ({
          id: p.id,
          name: p.name,
          code: p.code,
          price: p.price,
          description: p.description,
          imageUrl: p.imageUrl,
          unit: p.unit || 'UN'
        }));

        console.log(`Carregados ${mappedProducts.length} produtos totais`);
        toast({
          title: "Produtos carregados",
          description: `${mappedProducts.length} produtos foram carregados com sucesso.`,
          variant: "success"
        });
        
        setProducts(mappedProducts);
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        toast({
          title: "Erro ao carregar produtos",
          description: "Não foi possível carregar a lista de produtos. Tente novamente mais tarde.",
          variant: "error"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [user?.id, toast]);

  // Efeito para garantir que os produtos selecionados são atualizados quando a prop muda
  useEffect(() => {
    // Verificar se há diferença entre os produtos selecionados atuais e os iniciais
    if (JSON.stringify(selectedProducts) !== JSON.stringify(initialSelectedProducts)) {
      console.log("Atualizando produtos selecionados a partir dos dados iniciais");
      setSelectedProducts(initialSelectedProducts);
    }
  }, [initialSelectedProducts]);

  // Otimização para busca de produtos - usar useMemo para evitar recálculos desnecessários
  const filteredProducts = React.useMemo(() => 
    products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      product.code.toLowerCase().includes(searchTerm.toLowerCase())
    ), 
    [products, searchTerm]
  );

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  const paginate = (pageNumber: number) => {
    if (pageNumber < 1) pageNumber = 1;
    if (pageNumber > totalPages) pageNumber = totalPages;
    setCurrentPage(pageNumber);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const addProduct = (product: Product) => {
    const existingProductIndex = selectedProducts.findIndex(p => p.id === product.id);
    
    if (existingProductIndex >= 0) {
      // Product already in the list, update quantity
      const updatedProducts = [...selectedProducts];
      updatedProducts[existingProductIndex].quantity += 1;
      updatedProducts[existingProductIndex].subtotal = 
        updatedProducts[existingProductIndex].quantity * updatedProducts[existingProductIndex].price;
      
      setSelectedProducts(updatedProducts);
      onProductsChange(updatedProducts);
    } else {
      // Add new product
      const newSelectedProduct: SelectedProduct = {
        ...product,
        quantity: 1,
        subtotal: product.price
      };
      
      const updatedProducts = [...selectedProducts, newSelectedProduct];
      setSelectedProducts(updatedProducts);
      onProductsChange(updatedProducts);
    }
  };

  const updateQuantity = (productId: string, change: number) => {
    const updatedProducts = selectedProducts.map(product => {
      if (product.id === productId) {
        const newQuantity = Math.max(1, product.quantity + change);
        return {
          ...product,
          quantity: newQuantity,
          subtotal: newQuantity * product.price
        };
      }
      return product;
    });
    
    setSelectedProducts(updatedProducts);
    onProductsChange(updatedProducts);
  };

  const removeProduct = (productId: string) => {
    const updatedProducts = selectedProducts.filter(product => product.id !== productId);
    setSelectedProducts(updatedProducts);
    onProductsChange(updatedProducts);
  };

  // Function to open the edit modal
  const openEditModal = (product: SelectedProduct) => {
    setEditingProduct({ ...product });
    setIsEditModalOpen(true);
  };

  // Function to handle changes in the edit form
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editingProduct) return;
    
    const { name, value } = e.target;
    
    setEditingProduct(prev => {
      if (!prev) return null;
      
      // Handle price field specially to maintain numeric type
      if (name === 'price') {
        const numericValue = parseFloat(value);
        const updatedProduct = {
          ...prev,
          [name]: isNaN(numericValue) ? prev.price : numericValue
        };
        
        // Update subtotal when price changes
        updatedProduct.subtotal = updatedProduct.price * updatedProduct.quantity;
        return updatedProduct;
      }
      
      // Handle quantity field specially to maintain numeric type
      if (name === 'quantity') {
        const numericValue = parseInt(value, 10);
        const newQuantity = isNaN(numericValue) || numericValue < 1 ? 1 : numericValue;
        const updatedProduct = {
          ...prev,
          quantity: newQuantity
        };
        
        // Update subtotal when quantity changes
        updatedProduct.subtotal = updatedProduct.price * updatedProduct.quantity;
        return updatedProduct;
      }
      
      return { ...prev, [name]: value };
    });
  };

  // Function to save edited product
  const saveEditedProduct = () => {
    if (!editingProduct) return;
    
    const updatedProducts = selectedProducts.map(product => 
      product.id === editingProduct.id ? editingProduct : product
    );
    
    setSelectedProducts(updatedProducts);
    onProductsChange(updatedProducts);
    setIsEditModalOpen(false);
    setEditingProduct(null);
  };

  // Mobile product card component
  const MobileProductCard = ({ product }: { product: SelectedProduct }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-3 mb-2.5 shadow-sm hover:border-fiscal-green-200 hover:shadow-md transition-all">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center">
            <h4 className="font-medium text-gray-800 line-clamp-1">{product.name}</h4>
            <span className="ml-1.5 text-xs bg-fiscal-green-100 text-fiscal-green-800 rounded-full px-1.5 py-0.5">
              {product.quantity}x
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 font-mono">{product.code}</p>
        </div>
        <div className="flex space-x-1">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(product);
            }}
            className="text-gray-500 p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            aria-label="Editar produto"
          >
            <Edit size={16} />
          </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            removeProduct(product.id);
          }}
            className="text-gray-500 p-1.5 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            aria-label="Remover produto"
        >
          <Trash2 size={16} />
        </button>
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
        <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              updateQuantity(product.id, -1);
            }}
            className="p-1.5 bg-gray-100 hover:bg-red-100 hover:text-red-600 transition-all"
          >
            <Minus size={14} />
          </button>
          <span className="w-6 text-center text-sm font-medium">{product.quantity}</span>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              updateQuantity(product.id, 1);
            }}
            className="p-1.5 bg-gray-100 hover:bg-fiscal-green-100 hover:text-fiscal-green-600 transition-all"
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end text-xs text-gray-500">
            <span className="inline-block bg-gray-100 px-1.5 py-0.5 rounded-full">{product.price.toFixed(2)}</span>
            <span className="mx-1">×</span>
            <span className="inline-block bg-gray-100 px-1.5 py-0.5 rounded-full">{product.quantity}</span>
          </div>
          <p className="font-medium text-fiscal-green-700 mt-0.5">R$ {product.subtotal.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );

  // Renderizar estado de carregamento
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Carregando produtos...</span>
      </div>
    );
  }

  // Renderizar mensagem quando não há produtos
  if (!isLoading && products.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum produto encontrado</h3>
        <p className="mt-1 text-sm text-gray-500">
          Comece adicionando produtos ao seu catálogo.
        </p>
        <div className="mt-6">
          <Link
            to="/ecommerce/products"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Adicionar produtos
          </Link>
        </div>
      </div>
    );
  }

  // Continuar com o conteúdo padrão
  return (
    <div className={isMobile ? "space-y-3" : "space-y-6"}>
      <div className={`bg-white ${isMobile ? 'p-3' : 'p-6'} rounded-xl border border-gray-200 shadow-sm`}>
        <div className="flex items-center mb-3">
          <span className={`bg-fiscal-green-500 text-white ${isMobile ? 'p-1.5' : 'p-2'} rounded-lg mr-2`}>
            <ShoppingCart size={isMobile ? 16 : 20} />
          </span>
          <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-cascadia`}>
            Produtos Selecionados
            {selectedProducts.length > 0 && (
              <span className="ml-2 text-sm bg-fiscal-green-100 text-fiscal-green-800 rounded-full px-2 py-0.5">
                {selectedProducts.length}
              </span>
            )}
          </h3>
        </div>
        
        {selectedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-300 hover:border-fiscal-green-300 transition-all">
            <div className="w-16 h-16 flex items-center justify-center bg-white rounded-full shadow-sm mb-3 text-fiscal-green-300">
              <ShoppingCart size={isMobile ? 24 : 32} className="opacity-80" />
            </div>
            <p className={`${isMobile ? "text-sm" : ""} font-medium text-gray-500`}>Nenhum produto selecionado</p>
            <p className="text-xs mt-1">Adicione produtos da lista abaixo</p>
          </div>
        ) : isMobile ? (
          // Mobile card view
          <div className="space-y-2">
            {selectedProducts.map(product => (
              <MobileProductCard key={product.id} product={product} />
            ))}
            
            <div className="mt-4 rounded-xl p-4 bg-gradient-to-r from-fiscal-green-50 to-fiscal-green-100 shadow-sm border border-fiscal-green-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Total dos produtos:</p>
                  <p className="font-bold text-fiscal-green-700 text-lg">
                  R$ {selectedProducts.reduce((sum, product) => sum + product.subtotal, 0).toFixed(2)}
                </p>
                </div>
                <div className="bg-white h-12 w-12 rounded-full flex items-center justify-center shadow-sm text-fiscal-green-600 font-medium">
                  {selectedProducts.length}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Desktop table view
          <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-fiscal-green-50 to-gray-50 border-b border-gray-200">
                  <th className="py-3 px-4 text-sm font-medium text-gray-700">Código</th>
                  <th className="py-3 px-4 text-sm font-medium text-gray-700">Produto</th>
                  <th className="py-3 px-4 text-sm font-medium text-gray-700">Preço</th>
                  <th className="py-3 px-4 text-sm font-medium text-gray-700">Qtd</th>
                  <th className="py-3 px-4 text-sm font-medium text-gray-700">Subtotal</th>
                  <th className="py-3 px-4 text-sm font-medium text-gray-700 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {selectedProducts.map((product, index) => (
                  <tr 
                    key={product.id} 
                    className={`border-b border-gray-200 hover:bg-fiscal-green-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    <td className="py-3 px-4 text-sm font-mono">{product.code}</td>
                    <td className="py-3 px-4 font-medium text-gray-800">{product.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">R$ {product.price.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => updateQuantity(product.id, -1)}
                          className="p-1.5 rounded-full bg-gray-100 hover:bg-red-100 hover:text-red-600 transition-all"
                          aria-label="Diminuir quantidade"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center font-medium bg-white border border-gray-200 rounded-md py-0.5">{product.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(product.id, 1)}
                          className="p-1.5 rounded-full bg-gray-100 hover:bg-fiscal-green-100 hover:text-fiscal-green-600 transition-all"
                          aria-label="Aumentar quantidade"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-fiscal-green-700">R$ {product.subtotal.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end space-x-1">
                        <button 
                          onClick={() => openEditModal(product)}
                          className="text-gray-500 hover:text-blue-600 transition-colors p-1.5 hover:bg-blue-50 rounded-lg flex items-center"
                          aria-label="Editar produto"
                        >
                          <Edit size={16} />
                        </button>
                      <button 
                        onClick={() => removeProduct(product.id)}
                          className="text-gray-500 hover:text-red-600 transition-colors p-1.5 hover:bg-red-50 rounded-lg flex items-center"
                        aria-label="Remover produto"
                      >
                        <Trash2 size={16} />
                      </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gradient-to-r from-fiscal-green-50 to-fiscal-green-100">
                  <td colSpan={4} className="py-3 px-4 text-right font-medium">Total:</td>
                  <td className="py-3 px-4 font-bold text-fiscal-green-700 text-lg">
                    R$ {selectedProducts.reduce((sum, product) => sum + product.subtotal, 0).toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        
        <div className="mt-4">
          <div className="relative">
          <input
            type="text"
              placeholder="Buscar produtos por nome ou código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 pr-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-fiscal-green-500 focus:border-fiscal-green-500 transition-colors"
          />
            <Search className="absolute right-3 top-3 text-gray-400" size={20} />
          </div>
        </div>
        
        {isMobile && (
          <Link to="/products" className="btn-secondary text-xs w-full rounded-lg flex items-center justify-center py-1.5 px-3 mb-3 mt-3">
            <Package size={14} className="mr-1" />
            Gerenciar Produtos
          </Link>
        )}
        
        {filteredProducts.length > 0 && (
          <div className="text-sm text-gray-500 mt-2 flex justify-between items-center">
            <span>Encontrados: {filteredProducts.length} produtos</span>
            <span>Página {currentPage} de {totalPages || 1}</span>
          </div>
        )}
        
        <div className={`grid grid-cols-1 ${isMobile ? 'gap-2' : 'md:grid-cols-2 gap-4'} mt-3`}>
          {filteredProducts.length > 0 ? (
            currentProducts.map(product => (
            <div
              key={product.id}
                className={`border border-gray-200 rounded-xl ${isMobile ? 'p-2' : 'p-4'} hover:border-fiscal-green-500 hover:shadow-sm cursor-pointer transition-all duration-200`}
              onClick={() => addProduct(product)}
            >
                <div className="flex items-start gap-2">
                  {isMobile ? (
                    // Mobile compact layout
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm line-clamp-1">{product.name}</p>
                      <div className="flex items-center mt-0.5">
                        <Tag size={12} className="mr-1 text-gray-400" />
                        <p className="text-xs text-gray-500">Código: {product.code}</p>
                      </div>
                      <div className="flex justify-between items-center mt-1.5">
                        <p className="font-medium text-fiscal-green-600 text-sm">R$ {product.price.toFixed(2)}</p>
                        <button className="text-xs bg-fiscal-green-100 text-fiscal-green-700 rounded-full px-2 py-0.5 flex items-center">
                          <Plus size={12} className="mr-0.5" />
                          Adicionar
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Desktop layout
                    <>
                      {product.imageUrl ? (
                        <div className="w-16 h-16 rounded-md bg-gray-200 overflow-hidden flex-shrink-0">
                          <img 
                            src={product.imageUrl} 
                            alt={product.name} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Erro';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-md bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <Image size={24} className="text-gray-400" />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <div className="flex items-center mt-1">
                          <Tag size={14} className="mr-1 text-gray-400" />
                          <p className="text-sm text-gray-500">Código: {product.code}</p>
                </div>
                        {product.description && (
                          <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">{product.description}</p>
                        )}
                        <div className="flex justify-between items-center mt-2">
                          <p className="font-medium text-fiscal-green-600">R$ {product.price.toFixed(2)}</p>
                          <button className="text-sm text-fiscal-green-600 hover:text-fiscal-green-800 flex items-center">
                            <Plus size={14} className="mr-1" />
                            Adicionar
                  </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-6 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              {products.length === 0 ? (
                <>
                  <Package size={isMobile ? 30 : 40} className="mb-2 opacity-40" />
                  <p className={isMobile ? "text-sm" : ""}>Nenhum produto cadastrado.</p>
                  <Link to="/products" className="text-fiscal-green-600 hover:text-fiscal-green-800 text-sm mt-2">
                    Cadastrar produtos
                  </Link>
                </>
              ) : (
                <>
                  <Search size={isMobile ? 30 : 40} className="mb-2 opacity-40" />
                  <p className={isMobile ? "text-sm" : ""}>Nenhum produto encontrado.</p>
                  <p className="text-xs mt-1">Tente ajustar sua busca.</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-4 space-x-2">
          <button 
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className={`p-2 rounded-full ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
            aria-label="Página anterior"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
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
              
              if (pageNum > 0 && pageNum <= totalPages) {
                return (
                  <button
                    key={pageNum}
                    onClick={() => paginate(pageNum)}
                    className={`w-8 h-8 flex items-center justify-center rounded-full ${
                      currentPage === pageNum
                        ? 'bg-fiscal-green-500 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              }
              return null;
            })}
            
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <span className="px-1 text-gray-500">...</span>
            )}
            
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <button
                onClick={() => paginate(totalPages)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-700 hover:bg-gray-100"
              >
                {totalPages}
              </button>
            )}
          </div>
          
          <button 
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-full ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
            aria-label="Próxima página"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
      
      {/* Edit Product Modal */}
      <EditProductDialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <EditProductDialogContent className="w-[95vw] max-w-md rounded-xl shadow-xl border-0">
          <div className="bg-gradient-to-r from-fiscal-green-500 to-fiscal-green-600 p-5 rounded-t-xl">
            <EditProductDialogHeader className="mb-0">
              <EditProductDialogTitle className="flex items-center text-white">
                <span className="bg-white/20 backdrop-blur-sm p-2 rounded-lg mr-3">
                  <Edit size={20} className="text-white" />
                </span>
                Editar Produto
              </EditProductDialogTitle>
            </EditProductDialogHeader>
          </div>
          
          {editingProduct && (
            <div className="px-5 pt-4 pb-5">
              <div className="space-y-5">
                <div>
                  <label htmlFor="edit-name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Nome do Produto <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="edit-name"
                    name="name"
                    value={editingProduct.name}
                    onChange={handleEditChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-fiscal-green-500 focus:border-fiscal-green-500 transition-colors shadow-sm"
                    placeholder="Nome do produto"
                  />
                </div>
                
                <div>
                  <label htmlFor="edit-code" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Código <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="edit-code"
                    name="code"
                    value={editingProduct.code}
                    onChange={handleEditChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-fiscal-green-500 focus:border-fiscal-green-500 transition-colors shadow-sm"
                    placeholder="Código do produto"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit-price" className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Preço (R$) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                      <input
                        type="number"
                        id="edit-price"
                        name="price"
                        value={editingProduct.price}
                        onChange={handleEditChange}
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-fiscal-green-500 focus:border-fiscal-green-500 transition-colors shadow-sm"
                        placeholder="0.00"
                        min="0.01"
                        step="0.01"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="edit-quantity" className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Quantidade <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="edit-quantity"
                        name="quantity"
                        value={editingProduct.quantity}
                        onChange={handleEditChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-fiscal-green-500 focus:border-fiscal-green-500 transition-colors shadow-sm"
                        placeholder="0"
                        min="1"
                        step="1"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="edit-description" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Descrição
                  </label>
                  <textarea
                    id="edit-description"
                    name="description"
                    value={editingProduct.description || ''}
                    onChange={handleEditChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-fiscal-green-500 focus:border-fiscal-green-500 transition-colors shadow-sm min-h-[100px] resize-none"
                    placeholder="Descrição do produto (opcional)"
                  />
                </div>
                
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 flex items-start space-x-3">
                  <AlertCircle size={20} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-700">
                    <p className="font-semibold">Nota</p>
                    <p>A edição é temporária e afeta apenas este orçamento. Para alterar o produto permanentemente, use o gerenciador de produtos.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <EditProductDialogFooter className="px-5 pb-5 pt-3 flex items-center justify-end space-x-3">
            <EditProductDialogClose asChild>
              <button className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium">
                Cancelar
              </button>
            </EditProductDialogClose>
            <button 
              onClick={saveEditedProduct}
              className="px-5 py-2.5 rounded-lg bg-fiscal-green-500 text-white hover:bg-fiscal-green-600 transition-colors font-medium flex items-center shadow-sm"
            >
              <Check size={18} className="mr-1.5" />
              Salvar Alterações
            </button>
          </EditProductDialogFooter>
        </EditProductDialogContent>
      </EditProductDialog>
    </div>
  );
};

export default ProductSelector;
