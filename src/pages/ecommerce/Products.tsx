import React, { useState, useEffect } from 'react';
import EcommerceDashboardLayout from '@/components/ecommerce/EcommerceDashboardLayout';
import { Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight, Filter, Save, X, Upload, Image, Tag, PackageCheck, ShoppingCart, Eye, BarChart4 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { EcommerceService, EcommerceProduct as BaseEcommerceProduct, Category } from '@/services/ecommerceService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';

interface NewProduct {
  name: string;
  code: string;
  price: number;
  description?: string;
  imageUrl?: string;
  ncm?: string;
  unit?: string;
  quantity?: number;
  category_id?: string;
}

// Estendendo a interface EcommerceProduct para incluir previewUrl
interface EcommerceProduct extends BaseEcommerceProduct {
  previewUrl?: string;
}

const EcommerceProducts: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [products, setProducts] = useState<EcommerceProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('_all');
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingProduct, setEditingProduct] = useState<EcommerceProduct | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [newProduct, setNewProduct] = useState<NewProduct>({
    name: '',
    code: '',
    price: 0,
    description: '',
    unit: 'UN',
    quantity: 0,
    category_id: '_none'
  });
  const itemsPerPage = 20;

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, [currentPage]);

  useEffect(() => {
    // Resetar página ao mudar filtros
    setCurrentPage(1);
    loadProducts();
  }, [searchTerm, selectedCategoryId]);

  const loadCategories = async () => {
    try {
      const data = await EcommerceService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      
      // Usar o serviço EcommerceService com os filtros adequados
      const result = await EcommerceService.getProducts(
        currentPage,
        itemsPerPage,
        searchTerm,
        selectedCategoryId !== '_all' ? selectedCategoryId : undefined,
        user?.id
      );
      
      setProducts(result.data);
      setTotalProducts(result.count);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os produtos.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      await EcommerceService.deleteProduct(id);
      toast({
        title: 'Sucesso',
        description: 'Produto excluído com sucesso.',
      });
      loadProducts();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o produto.',
        variant: 'destructive',
      });
    }
  };

  const handleAddProduct = async () => {
    try {
      if (!newProduct.name || !newProduct.code || newProduct.price <= 0) {
        toast({
          title: 'Erro',
          description: 'Preencha todos os campos obrigatórios (nome, código e preço).',
          variant: 'destructive',
        });
        return;
      }

      // Upload da imagem, se existir
      let imageUrl = newProduct.imageUrl || '';
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { data, error } = await supabase.storage
          .from('products')
          .upload(`images/${fileName}`, imageFile);

        if (error) {
          console.error('Erro ao fazer upload da imagem:', error);
          toast({
            title: 'Erro',
            description: 'Erro ao fazer upload da imagem.',
            variant: 'destructive',
          });
        } else if (data) {
          const { data: urlData } = supabase.storage
            .from('products')
            .getPublicUrl(`images/${fileName}`);
          
          imageUrl = urlData.publicUrl;
        }
      }

      // Usando a API Supabase diretamente
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: newProduct.name,
          code: newProduct.code,
          price: newProduct.price,
          description: newProduct.description || '',
          unit: newProduct.unit || 'UN',
          quantity: newProduct.quantity || 0,
          category_id: newProduct.category_id === '_none' ? null : newProduct.category_id || null,
          ncm: newProduct.ncm || '',
          image_path: imageUrl,
          owner_id: user?.id
        })
        .select()
        .single();

      if (error) {
        toast({
          title: 'Erro',
          description: `Erro ao criar produto: ${error.message}`,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Sucesso',
        description: 'Produto criado com sucesso!',
      });

      // Limpar formulário e fechar diálogo
      setNewProduct({
        name: '',
        code: '',
        price: 0,
        description: '',
        unit: 'UN',
        quantity: 0,
        category_id: '_none'
      });
      setImageFile(null);
      setIsAddDialogOpen(false);
      loadProducts();
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o produto.',
        variant: 'destructive',
      });
    }
  };

  const handleEditProduct = async () => {
    try {
      if (!editingProduct) return;

      if (!editingProduct.name || !editingProduct.code || editingProduct.price <= 0) {
        toast({
          title: 'Erro',
          description: 'Preencha todos os campos obrigatórios (nome, código e preço).',
          variant: 'destructive',
        });
        return;
      }

      // Upload da imagem, se existir
      let imageUrl = editingProduct.imageUrl || '';
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { data, error } = await supabase.storage
          .from('products')
          .upload(`images/${fileName}`, imageFile);

        if (error) {
          console.error('Erro ao fazer upload da imagem:', error);
          toast({
            title: 'Erro',
            description: 'Erro ao fazer upload da imagem.',
            variant: 'destructive',
          });
        } else if (data) {
          const { data: urlData } = supabase.storage
            .from('products')
            .getPublicUrl(`images/${fileName}`);
          
          imageUrl = urlData.publicUrl;
        }
      }

      // Usando a API Supabase diretamente
      const { data, error } = await supabase
        .from('products')
        .update({
          name: editingProduct.name,
          code: editingProduct.code,
          price: editingProduct.price,
          description: editingProduct.description || '',
          unit: editingProduct.unit || 'UN',
          quantity: editingProduct.quantity || 0,
          category_id: editingProduct.category_id === '_none' ? null : editingProduct.category_id || null,
          ncm: editingProduct.ncm || '',
          image_path: imageUrl
        })
        .eq('id', editingProduct.id)
        .select()
        .single();

      if (error) {
        toast({
          title: 'Erro',
          description: `Erro ao atualizar produto: ${error.message}`,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Sucesso',
        description: 'Produto atualizado com sucesso!',
      });

      // Limpar formulário e fechar diálogo
      setEditingProduct(null);
      setImageFile(null);
      setIsEditDialogOpen(false);
      loadProducts();
    } catch (error) {
      console.error('Erro ao editar produto:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível editar o produto.',
        variant: 'destructive',
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      
      // Criar uma prévia da imagem selecionada
      if (editingProduct) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target && event.target.result) {
            setEditingProduct({
              ...editingProduct,
              previewUrl: event.target.result as string
            });
          }
        };
        reader.readAsDataURL(e.target.files[0]);
      }
    }
  };

  const totalPages = Math.ceil(totalProducts / itemsPerPage);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <EcommerceDashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Produtos</h1>
            <p className="text-gray-500 mt-1">Gerencie os produtos da sua loja virtual</p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-fiscal-green-600 hover:bg-fiscal-green-700 shadow-lg transition-all duration-300 rounded-xl border border-fiscal-green-500 hover:scale-105">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-5 w-5 items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fiscal-green-400 opacity-40"></span>
                    <Plus className="h-4 w-4 relative" />
                  </span>
                  Novo Produto
                </div>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Produto</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Produto *</Label>
                    <Input 
                      id="name" 
                      value={newProduct.name} 
                      onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                      placeholder="Nome do produto"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Código *</Label>
                    <Input 
                      id="code" 
                      value={newProduct.code} 
                      onChange={(e) => setNewProduct({...newProduct, code: e.target.value})}
                      placeholder="Código do produto"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Preço *</Label>
                    <Input 
                      id="price" 
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={newProduct.price} 
                      onChange={(e) => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
                      placeholder="0,00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unidade</Label>
                    <Select 
                      value={newProduct.unit} 
                      onValueChange={(value) => setNewProduct({...newProduct, unit: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UN">Unidade (UN)</SelectItem>
                        <SelectItem value="KG">Quilograma (KG)</SelectItem>
                        <SelectItem value="M">Metro (M)</SelectItem>
                        <SelectItem value="M2">Metro quadrado (M²)</SelectItem>
                        <SelectItem value="L">Litro (L)</SelectItem>
                        <SelectItem value="CX">Caixa (CX)</SelectItem>
                        <SelectItem value="PCT">Pacote (PCT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Qtd. em Estoque</Label>
                    <Input 
                      id="quantity" 
                      type="number"
                      min="0"
                      step="1"
                      value={newProduct.quantity} 
                      onChange={(e) => setNewProduct({...newProduct, quantity: parseInt(e.target.value)})}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select 
                    value={newProduct.category_id || ''} 
                    onValueChange={(value) => setNewProduct({...newProduct, category_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Sem categoria</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea 
                    id="description" 
                    value={newProduct.description || ''} 
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    placeholder="Descrição do produto"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">Imagem do Produto</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ncm">NCM (Nomenclatura Comum do Mercosul)</Label>
                  <Input 
                    id="ncm" 
                    value={newProduct.ncm || ''} 
                    onChange={(e) => setNewProduct({...newProduct, ncm: e.target.value})}
                    placeholder="Código NCM"
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleAddProduct}>Adicionar Produto</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Filtros</CardTitle>
            <CardDescription>
              Filtre produtos por nome, código, descrição ou categoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="search" className="text-sm font-medium mb-1">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    id="search"
                    placeholder="Buscar produtos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Label htmlFor="category" className="text-sm font-medium mb-1">Categoria</Label>
                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">Todas</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={() => {
                setSearchTerm('');
                setSelectedCategoryId('_all');
              }} className="mb-1">
                <Filter className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="table" className="w-full">
          <TabsList className="mb-4 bg-white/90 backdrop-blur-sm shadow-lg border border-gray-100 rounded-2xl p-2 gap-3">
            <TabsTrigger 
              value="table" 
              className="flex items-center rounded-xl px-5 py-2.5 transition-all data-[state=active]:bg-fiscal-green-50/90 data-[state=active]:text-fiscal-green-800 data-[state=active]:border-fiscal-green-200 data-[state=active]:shadow-md border border-transparent hover:border-fiscal-green-100 hover:bg-fiscal-green-50/50 gap-2"
            >
              <BarChart4 className="h-4 w-4" />
              Tabela
            </TabsTrigger>
            <TabsTrigger 
              value="grid" 
              className="flex items-center rounded-xl px-5 py-2.5 transition-all data-[state=active]:bg-fiscal-green-50/90 data-[state=active]:text-fiscal-green-800 data-[state=active]:border-fiscal-green-200 data-[state=active]:shadow-md border border-transparent hover:border-fiscal-green-100 hover:bg-fiscal-green-50/50 gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              Galeria
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="table">
            <Card className="overflow-hidden border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-500 rounded-2xl">
              <CardContent className="p-0">
                <div className="overflow-x-auto rounded-2xl">
                  <table className="w-full min-w-[700px] md:min-w-full table-auto">
                    <thead>
                      <tr className="bg-gradient-to-r from-fiscal-green-100/90 to-fiscal-green-50/80 backdrop-blur-sm">
                        <th className="text-left p-5 font-bold text-fiscal-green-900 first:rounded-tl-2xl">Código</th>
                        <th className="text-left p-5 font-bold text-fiscal-green-900 hidden sm:table-cell">Nome</th>
                        <th className="text-left p-5 font-bold text-fiscal-green-900 hidden md:table-cell">Categoria</th>
                        <th className="text-center p-5 font-bold text-fiscal-green-900 hidden lg:table-cell">Estoque</th>
                        <th className="text-right p-5 font-bold text-fiscal-green-900 last:rounded-tr-2xl w-[180px]">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 space-y-3">
                      {isLoading ? (
                        Array(5).fill(0).map((_, index) => (
                          <tr key={index} className="border-b bg-white rounded-xl border border-fiscal-green-100/50 my-3 mb-4 shadow-sm hover:shadow-md transition-all">
                            <td className="p-4"><Skeleton className="h-5 w-16" /></td>
                            <td className="p-4 hidden sm:table-cell"><Skeleton className="h-5 w-32" /></td>
                            <td className="p-4 hidden md:table-cell"><Skeleton className="h-5 w-20" /></td>
                            <td className="p-4 text-center hidden lg:table-cell"><Skeleton className="h-5 w-10 mx-auto" /></td>
                            <td className="p-4">
                              <div className="flex justify-end gap-2">
                                <Skeleton className="h-8 w-8 rounded-md" />
                                <Skeleton className="h-8 w-8 rounded-md" />
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : products.length === 0 ? (
                        <tr className="bg-white rounded-xl border border-fiscal-green-100/50 my-3 mb-4 shadow-sm">
                          <td colSpan={5} className="text-center p-8 text-muted-foreground">
                            <div className="flex flex-col items-center">
                              <PackageCheck className="h-12 w-12 text-muted-foreground/50 mb-2" />
                              <p>Nenhum produto encontrado.</p>
                              <p className="text-sm">Adicione novos produtos ou ajuste os filtros de busca.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        products.map((product) => {
                          // Encontrar o nome da categoria pelo category_id
                          const categoryName = product.category_id 
                            ? categories.find(c => c.id === product.category_id)?.name || product.category
                            : product.category || '-';
                          
                          const stockStatus = product.stock ? (
                            product.stock > 10 ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border border-green-200 shadow-md font-medium px-3 py-1 rounded-full">
                                <div className="flex items-center gap-1">
                                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse mr-1"></span>
                                  Em Estoque
                                </div>
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-200 shadow-md font-medium px-3 py-1 rounded-full">
                                <div className="flex items-center gap-1">
                                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse mr-1"></span>
                                  Baixo Estoque
                                </div>
                              </Badge>
                            )
                          ) : (
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border border-red-200 shadow-md font-medium px-3 py-1 rounded-full">
                              <div className="flex items-center gap-1">
                                <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1"></span>
                                Sem Estoque
                              </div>
                            </Badge>
                          );
                          
                          return (
                            <tr key={product.id} className="border-b border-fiscal-green-100/50 bg-white rounded-xl my-3 mb-4 hover:bg-fiscal-green-50/90 transition-all duration-300 group relative hover:shadow-lg hover:scale-[1.01] transform">
                              <td className="py-5 px-5 font-mono text-sm">
                                <span className="bg-white px-3 py-1.5 rounded-lg font-medium text-gray-700 shadow-sm border border-fiscal-green-100 group-hover:border-fiscal-green-300 transition-colors">
                                  {product.code}
                                </span>
                              </td>
                              <td className="py-5 px-5 hidden sm:table-cell">
                                <div className="flex items-center gap-4">
                                  {product.imageUrl ? (
                                    <div className="relative">
                                      <div className="relative h-14 w-14 rounded-xl overflow-hidden shadow-lg border-2 border-white">
                                        <img 
                                          src={product.imageUrl} 
                                          alt={product.name} 
                                          className="h-full w-full object-cover group-hover:scale-110 transition-all duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-tr from-fiscal-green-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                      </div>
                                      <span className="absolute -right-1 -bottom-1 h-4 w-4 bg-fiscal-green-400 border-2 border-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"></span>
                                    </div>
                                  ) : (
                                    <div className="h-14 w-14 rounded-xl bg-white flex items-center justify-center shadow-md border-2 border-white">
                                      <Image className="h-6 w-6 text-gray-400" />
                                    </div>
                                  )}
                                  <div className="flex flex-col">
                                    <span className="text-gray-900 font-semibold group-hover:text-fiscal-green-800 transition-colors text-sm truncate max-w-[150px] md:max-w-[200px] lg:max-w-[250px]">
                                      {product.name}
                                    </span>
                                    <span className="text-xs font-medium text-fiscal-green-800 mt-1">{formatPrice(product.price)}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-5 px-5 hidden md:table-cell">
                                {categoryName !== '-' ? (
                                  <Badge variant="outline" className="font-medium border-fiscal-green-200 bg-white shadow-md py-1.5 px-3 rounded-lg group-hover:border-fiscal-green-300 group-hover:bg-fiscal-green-50/50 transition-colors">
                                    <Tag className="h-3 w-3 mr-2 text-fiscal-green-600" />
                                    {categoryName}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-400 italic text-sm">Sem categoria</span>
                                )}
                              </td>
                              <td className="py-5 px-5 text-center hidden lg:table-cell">{stockStatus}</td>
                              <td className="py-5 px-5">
                                <div className="flex justify-end items-center gap-2 flex-nowrap">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button 
                                          size="sm" 
                                          variant="outline" 
                                          onClick={() => {
                                            window.open(`#/produto/${product.id}`, '_blank');
                                          }}
                                          className="bg-white border-fiscal-green-100 hover:bg-fiscal-green-50 hover:border-fiscal-green-300 shadow-md hover:shadow-lg transition-all duration-300 rounded-full h-9 w-9 p-0 hover:scale-110 flex-shrink-0"
                                        >
                                          <Eye className="h-4 w-4 text-fiscal-green-600" />
                                          <span className="sr-only">Visualizar</span>
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="bg-black/90 text-white backdrop-blur-sm border-none shadow-xl rounded-lg py-2 px-3">
                                        <p>Visualizar produto</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>

                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Dialog open={isEditDialogOpen && editingProduct?.id === product.id} onOpenChange={(open) => {
                                          if (!open) setEditingProduct(null);
                                          setIsEditDialogOpen(open);
                                        }}>
                                          <DialogTrigger asChild>
                                            <Button 
                                              size="sm" 
                                              variant="outline" 
                                              onClick={() => {
                                                setEditingProduct(product);
                                                setIsEditDialogOpen(true);
                                              }}
                                              className="bg-white border-fiscal-green-100 hover:bg-fiscal-green-50 hover:border-fiscal-green-300 shadow-md hover:shadow-lg transition-all duration-300 rounded-full h-9 w-9 p-0 hover:scale-110 flex-shrink-0"
                                            >
                                              <Edit className="h-4 w-4 text-fiscal-green-600" />
                                              <span className="sr-only">Editar</span>
                                            </Button>
                                          </DialogTrigger>
                                          {editingProduct && editingProduct.id === product.id && (
                                            <DialogContent className="max-w-2xl bg-white border border-fiscal-green-100/50 shadow-xl rounded-xl">
                                              <DialogHeader className="bg-gradient-to-r from-fiscal-green-50 to-white rounded-t-lg px-4 py-3">
                                                <DialogTitle className="text-fiscal-green-800 text-xl font-semibold">Editar Produto</DialogTitle>
                                              </DialogHeader>
                                              <div className="grid gap-4 mt-4 px-2">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                  <div className="space-y-2">
                                                    <Label htmlFor="edit-name" className="text-gray-700">Nome do Produto *</Label>
                                                    <Input 
                                                      id="edit-name" 
                                                      value={editingProduct.name} 
                                                      onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                                                      placeholder="Nome do produto"
                                                      className="rounded-lg border-fiscal-green-100 focus:border-fiscal-green-300 focus:ring focus:ring-fiscal-green-200 focus:ring-opacity-50"
                                                    />
                                                  </div>
                                                  <div className="space-y-2">
                                                    <Label htmlFor="edit-code" className="text-gray-700">Código *</Label>
                                                    <Input 
                                                      id="edit-code" 
                                                      value={editingProduct.code} 
                                                      onChange={(e) => setEditingProduct({...editingProduct, code: e.target.value})}
                                                      placeholder="Código do produto"
                                                      className="rounded-lg border-fiscal-green-100 focus:border-fiscal-green-300 focus:ring focus:ring-fiscal-green-200 focus:ring-opacity-50"
                                                    />
                                                  </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                  <div className="space-y-2">
                                                    <Label htmlFor="edit-price" className="text-gray-700">Preço *</Label>
                                                    <Input 
                                                      id="edit-price" 
                                                      type="number"
                                                      min="0.01"
                                                      step="0.01"
                                                      value={editingProduct.price} 
                                                      onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})}
                                                      placeholder="0,00"
                                                      className="rounded-lg border-fiscal-green-100 focus:border-fiscal-green-300 focus:ring focus:ring-fiscal-green-200 focus:ring-opacity-50"
                                                    />
                                                  </div>
                                                  <div className="space-y-2">
                                                    <Label htmlFor="edit-unit" className="text-gray-700">Unidade</Label>
                                                    <Select 
                                                      value={editingProduct.unit || 'UN'} 
                                                      onValueChange={(value) => setEditingProduct({...editingProduct, unit: value})}
                                                    >
                                                      <SelectTrigger className="rounded-lg border-fiscal-green-100 focus:border-fiscal-green-300 focus:ring focus:ring-fiscal-green-200 focus:ring-opacity-50">
                                                        <SelectValue placeholder="Selecione" />
                                                      </SelectTrigger>
                                                      <SelectContent className="rounded-lg border-fiscal-green-100">
                                                        <SelectItem value="UN">Unidade (UN)</SelectItem>
                                                        <SelectItem value="KG">Quilograma (KG)</SelectItem>
                                                        <SelectItem value="M">Metro (M)</SelectItem>
                                                        <SelectItem value="M2">Metro quadrado (M²)</SelectItem>
                                                        <SelectItem value="L">Litro (L)</SelectItem>
                                                        <SelectItem value="CX">Caixa (CX)</SelectItem>
                                                        <SelectItem value="PCT">Pacote (PCT)</SelectItem>
                                                      </SelectContent>
                                                    </Select>
                                                  </div>
                                                  <div className="space-y-2">
                                                    <Label htmlFor="edit-quantity" className="text-gray-700">Qtd. em Estoque</Label>
                                                    <Input 
                                                      id="edit-quantity" 
                                                      type="number"
                                                      min="0"
                                                      step="1"
                                                      value={editingProduct.quantity || 0} 
                                                      onChange={(e) => setEditingProduct({...editingProduct, quantity: parseInt(e.target.value)})}
                                                      placeholder="0"
                                                      className="rounded-lg border-fiscal-green-100 focus:border-fiscal-green-300 focus:ring focus:ring-fiscal-green-200 focus:ring-opacity-50"
                                                    />
                                                  </div>
                                                </div>
                                                <div className="space-y-2">
                                                  <Label htmlFor="edit-category" className="text-gray-700">Categoria</Label>
                                                  <Select 
                                                    value={editingProduct.category_id || ''} 
                                                    onValueChange={(value) => setEditingProduct({...editingProduct, category_id: value})}
                                                  >
                                                    <SelectTrigger className="rounded-lg border-fiscal-green-100 focus:border-fiscal-green-300 focus:ring focus:ring-fiscal-green-200 focus:ring-opacity-50">
                                                      <SelectValue placeholder="Selecione uma categoria" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-lg border-fiscal-green-100">
                                                      <SelectItem value="_none">Sem categoria</SelectItem>
                                                      {categories.map((category) => (
                                                        <SelectItem key={category.id} value={category.id}>
                                                          {category.name}
                                                        </SelectItem>
                                                      ))}
                                                    </SelectContent>
                                                  </Select>
                                                </div>
                                                <div className="space-y-2">
                                                  <Label htmlFor="edit-description" className="text-gray-700">Descrição</Label>
                                                  <Textarea 
                                                    id="edit-description" 
                                                    value={editingProduct.description || ''} 
                                                    onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                                                    placeholder="Descrição do produto"
                                                    rows={3}
                                                    className="rounded-lg border-fiscal-green-100 focus:border-fiscal-green-300 focus:ring focus:ring-fiscal-green-200 focus:ring-opacity-50"
                                                  />
                                                </div>
                                                <div className="space-y-2">
                                                  <Label htmlFor="edit-image" className="text-gray-700">Imagem do Produto</Label>
                                                  <div className="flex flex-col gap-3 bg-gray-50/50 p-4 rounded-lg border border-fiscal-green-100/30">
                                                    {(editingProduct.imageUrl || editingProduct.previewUrl) && (
                                                      <div className="mb-2 relative group">
                                                        <img 
                                                          src={editingProduct.previewUrl || editingProduct.imageUrl}
                                                        alt={editingProduct.name} 
                                                          className="h-32 object-contain rounded-md border border-fiscal-green-100 shadow-sm bg-white p-2"
                                                        />
                                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                                                          <Button 
                                                            variant="destructive" 
                                                            size="sm" 
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => {
                                                              setEditingProduct({...editingProduct, imageUrl: '', previewUrl: ''});
                                                              setImageFile(null);
                                                            }}
                                                          >
                                                            <X className="h-4 w-4 mr-1" />
                                                            Remover
                                                          </Button>
                                                        </div>
                                                    </div>
                                                  )}
                                                    <div className="flex flex-col gap-2">
                                                  <Input
                                                    id="edit-image"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageChange}
                                                        className="cursor-pointer rounded-lg border-fiscal-green-100 focus:border-fiscal-green-300 focus:ring focus:ring-fiscal-green-200 focus:ring-opacity-50 bg-white"
                                                  />
                                                      <p className="text-xs text-gray-500">
                                                        Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 5MB
                                                      </p>
                                                    </div>
                                                  </div>
                                                </div>
                                                <div className="space-y-2">
                                                  <Label htmlFor="edit-ncm" className="text-gray-700">NCM (Nomenclatura Comum do Mercosul)</Label>
                                                  <Input 
                                                    id="edit-ncm" 
                                                    value={editingProduct.ncm || ''} 
                                                    onChange={(e) => setEditingProduct({...editingProduct, ncm: e.target.value})}
                                                    placeholder="Código NCM"
                                                    className="rounded-lg border-fiscal-green-100 focus:border-fiscal-green-300 focus:ring focus:ring-fiscal-green-200 focus:ring-opacity-50"
                                                  />
                                                </div>
                                              </div>
                                              <DialogFooter className="mt-6 bg-gray-50/50 p-4 rounded-b-lg border-t border-fiscal-green-100/30">
                                                <Button variant="outline" onClick={() => {
                                                  setEditingProduct(null);
                                                  setIsEditDialogOpen(false);
                                                }} className="rounded-lg border-fiscal-green-200 hover:bg-fiscal-green-50">Cancelar</Button>
                                                <Button onClick={handleEditProduct} className="rounded-lg bg-fiscal-green-600 hover:bg-fiscal-green-700">Salvar Alterações</Button>
                                              </DialogFooter>
                                            </DialogContent>
                                          )}
                                        </Dialog>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="bg-black/90 text-white backdrop-blur-sm border-none shadow-xl rounded-lg py-2 px-3">
                                        <p>Editar produto</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>

                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          onClick={() => handleDeleteProduct(product.id)}
                                          className="shadow-md hover:shadow-lg transition-all duration-300 hover:bg-red-600 rounded-full h-9 w-9 p-0 hover:scale-110 flex-shrink-0"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                          <span className="sr-only">Excluir</span>
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="bg-black/90 text-white backdrop-blur-sm border-none shadow-xl rounded-lg py-2 px-3">
                                        <p>Excluir produto</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>

              {/* Paginação */}
              {totalPages > 1 && (
                <CardFooter className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {((currentPage - 1) * itemsPerPage) + 1} a{' '}
                    {Math.min(currentPage * itemsPerPage, totalProducts)} de {totalProducts} produtos
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="hover:bg-fiscal-green-50 hover:border-fiscal-green-200 transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({length: Math.min(totalPages, 5)}, (_, i) => {
                        const pageNum = i + 1;
                        if (pageNum === currentPage) {
                          return (
                            <Button key={i} size="sm" className="px-3 bg-fiscal-green-600 hover:bg-fiscal-green-700">
                              {pageNum}
                            </Button>
                          );
                        }
                        return (
                          <Button 
                            key={i} 
                            variant="outline" 
                            size="sm" 
                            className="px-3 hover:bg-fiscal-green-50 hover:border-fiscal-green-200 transition-colors"
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      {totalPages > 5 && currentPage < totalPages - 2 && (
                        <>
                          <span className="mx-1">...</span>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="px-3 hover:bg-fiscal-green-50 hover:border-fiscal-green-200 transition-colors"
                            onClick={() => setCurrentPage(totalPages)}
                          >
                            {totalPages}
                          </Button>
                        </>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="hover:bg-fiscal-green-50 hover:border-fiscal-green-200 transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
          
          <TabsContent value="grid">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {isLoading ? (
                Array(8).fill(0).map((_, index) => (
                  <Card key={index} className="overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border border-fiscal-green-100/50 rounded-xl bg-white">
                    <div className="h-48 bg-muted">
                      <Skeleton className="h-full w-full" />
                    </div>
                    <CardHeader className="p-4">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <Skeleton className="h-6 w-1/3 mb-3" />
                      <div className="flex justify-between">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : products.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-fiscal-green-100/50 shadow-md">
                  <PackageCheck className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-xl font-semibold text-muted-foreground">Nenhum produto encontrado</h3>
                  <p className="text-muted-foreground mb-4">Adicione novos produtos ou ajuste os filtros de busca.</p>
                  <Button onClick={() => setIsAddDialogOpen(true)} className="bg-fiscal-green-600 hover:bg-fiscal-green-700 shadow-md transition-all duration-200">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Produto
                  </Button>
                </div>
              ) : (
                products.map((product) => {
                  const categoryName = product.category_id 
                    ? categories.find(c => c.id === product.category_id)?.name || product.category
                    : product.category || '-';

                  return (
                    <Card key={product.id} className="overflow-hidden group hover:shadow-xl transition-all duration-300 border border-fiscal-green-100/50 rounded-xl bg-white hover:scale-[1.02] transform">
                      <div className="h-48 bg-muted relative overflow-hidden rounded-t-lg">
                        {product.imageUrl ? (
                          <img 
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-white">
                            <Image className="h-16 w-16 text-gray-300" />
                          </div>
                        )}
                        {categoryName !== '-' && (
                          <Badge className="absolute top-2 right-2 bg-white shadow-md border border-fiscal-green-100/50">
                            <Tag className="h-3 w-3 mr-1 text-fiscal-green-600" />
                            {categoryName}
                          </Badge>
                        )}
                        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Badge className="bg-white/90 backdrop-blur-sm shadow-md border border-fiscal-green-100/50 px-2 py-1">
                            <Eye className="h-3 w-3 mr-1 text-fiscal-green-600" />
                            Visualizar
                          </Badge>
                        </div>
                      </div>
                      <CardHeader className="p-4 pb-0">
                        <CardTitle className="text-sm truncate" title={product.name}>{product.name}</CardTitle>
                        <CardDescription className="text-xs font-mono">Código: {product.code}</CardDescription>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <p className="text-lg font-bold text-fiscal-green-800">{formatPrice(product.price)}</p>
                          {product.stock ? (
                            product.stock > 10 ? (
                              <Badge className="bg-green-100 text-green-800 border border-green-200 shadow-md">Em Estoque</Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-800 border border-amber-200 shadow-md">Baixo: {product.stock}</Badge>
                            )
                          ) : (
                            <Badge className="bg-red-100 text-red-800 border border-red-200 shadow-md">Sem Estoque</Badge>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="p-4 pt-0 flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 bg-white border-fiscal-green-100 hover:bg-fiscal-green-50 hover:border-fiscal-green-300 shadow-sm hover:shadow-md transition-all duration-200"
                          onClick={() => {
                            setEditingProduct(product);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2 text-fiscal-green-600" />
                          Editar
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          className="flex-1 shadow-sm hover:shadow-md transition-all duration-200 hover:bg-red-600"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })
              )}
            </div>
            
            {/* Paginação para visualização em grade */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center mt-8 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Anterior
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({length: Math.min(totalPages, 5)}, (_, i) => {
                    const pageNum = i + 1;
                    if (pageNum === currentPage) {
                      return (
                        <Button key={i} size="sm" className="px-3">
                          {pageNum}
                        </Button>
                      );
                    }
                    return (
                      <Button 
                        key={i} 
                        variant="outline" 
                        size="sm" 
                        className="px-3"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="mx-1">...</span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="px-3"
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </EcommerceDashboardLayout>
  );
};

export default EcommerceProducts; 