import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Filter, PackageCheck, ShoppingCart, Eye, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EcommerceService, EcommerceProduct } from '@/services/ecommerceService';
import { useCart } from '@/contexts/CartContext';

const SearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const searchQuery = searchParams.get('q') || '';

  const [products, setProducts] = useState<EcommerceProduct[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<EcommerceProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  // Carregar produtos baseados na pesquisa
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        const { data } = await EcommerceService.getProducts(1, 100, searchQuery);
        setProducts(data);

        // Extrair categorias únicas dos produtos encontrados
        const uniqueCategories = Array.from(
          new Set(data.map(product => product.category).filter(Boolean))
        );
        setCategories(uniqueCategories);

        // Carregar produtos relacionados (da mesma categoria do primeiro resultado)
        if (data.length > 0 && data[0].category) {
          const { data: related } = await EcommerceService.getProducts(1, 4, '', data[0].category);
          setRelatedProducts(related.filter(p => p.id !== data[0].id));
        }
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (searchQuery) {
      loadProducts();
    }
  }, [searchQuery]);

  // Formatar preço
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  // Filtrar produtos por categoria
  const filteredProducts = selectedCategory
    ? products.filter(product => product.category === selectedCategory)
    : products;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Cabeçalho da Pesquisa */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="border-[var(--store-border)] hover:bg-[var(--store-primary)] hover:text-[var(--store-primary-foreground)]"
        >
          <ArrowLeft size={18} className="mr-2" />
          Voltar
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-2">
            Resultados para "{searchQuery}"
          </h1>
          <p className="text-gray-500">
            {filteredProducts.length} produtos encontrados
          </p>
        </div>
      </div>

      {/* Filtros e Resultados */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar de Filtros */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-4">Filtros</h2>
              
              {/* Pesquisa dentro dos resultados */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  type="search"
                  placeholder="Filtrar resultados..."
                  className="pl-10"
                />
              </div>

              {/* Categorias */}
              <div className="space-y-2">
                <h3 className="font-medium mb-2">Categorias</h3>
                <div className="flex flex-col gap-2">
                  <Button
                    variant={selectedCategory === null ? "default" : "outline"}
                    onClick={() => setSelectedCategory(null)}
                    className="justify-start"
                  >
                    Todas as Categorias
                  </Button>
                  {categories.map(category => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      onClick={() => setSelectedCategory(category)}
                      className="justify-start"
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Produtos */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, index) => (
                <Card key={index} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <Skeleton className="h-6 w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <PackageCheck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum produto encontrado</h3>
              <p className="text-gray-500 mb-4">
                Não encontramos produtos correspondentes à sua busca.
              </p>
              <Button
                onClick={() => navigate('/ecommerce')}
                className="bg-[var(--store-primary)] text-[var(--store-primary-foreground)]"
              >
                Ver todos os produtos
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map(product => (
                  <Card key={product.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                    <div className="relative h-48">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <PackageCheck className="h-12 w-12 text-gray-300" />
                        </div>
                      )}
                      {product.category && (
                        <Badge className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm">
                          {product.category}
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium mb-2 line-clamp-2">{product.name}</h3>
                      <p className="text-2xl font-bold text-[var(--store-primary)]">
                        {formatPrice(product.price)}
                      </p>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 gap-2">
                      <Button
                        className="flex-1 bg-[var(--store-primary)] text-[var(--store-primary-foreground)]"
                        onClick={() => addToCart(product, 1)}
                      >
                        <ShoppingCart size={18} className="mr-2" />
                        Adicionar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/products/${product.id}`)}
                      >
                        <Eye size={18} />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              {/* Produtos Relacionados */}
              {relatedProducts.length > 0 && (
                <div className="mt-12">
                  <h2 className="text-2xl font-bold mb-6">Produtos Relacionados</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {relatedProducts.map(product => (
                      <Card key={product.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                        <div className="relative h-48">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                              <PackageCheck className="h-12 w-12 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-medium mb-2 line-clamp-2">{product.name}</h3>
                          <p className="text-xl font-bold text-[var(--store-primary)]">
                            {formatPrice(product.price)}
                          </p>
                        </CardContent>
                        <CardFooter className="p-4 pt-0">
                          <Button
                            className="w-full bg-[var(--store-primary)] text-[var(--store-primary-foreground)]"
                            onClick={() => addToCart(product, 1)}
                          >
                            <ShoppingCart size={18} className="mr-2" />
                            Adicionar
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResults; 