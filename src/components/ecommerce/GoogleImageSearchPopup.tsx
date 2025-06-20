import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, X, Download, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProductsService } from '@/services/productsService';

interface GoogleImageSearchPopupProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    description?: string;
  };
  onImageSelected: (imageUrl: string) => void;
}

interface GoogleImage {
  url: string;
  thumbnail: string;
  title: string;
  source: string;
}

const GoogleImageSearchPopup: React.FC<GoogleImageSearchPopupProps> = ({
  isOpen,
  onClose,
  product,
  onImageSelected
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [images, setImages] = useState<GoogleImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  // Inicializar busca com nome e descrição do produto
  useEffect(() => {
    if (isOpen && product) {
      const initialQuery = `${product.name} ${product.description || ''}`.trim();
      setSearchQuery(initialQuery);
      if (initialQuery) {
        handleSearch(initialQuery);
      }
    }
  }, [isOpen, product]);

  const handleSearch = async (query?: string) => {
    const searchTerm = query || searchQuery;
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      // Simulação de busca de imagens do Google usando uma API gratuita
      // Em produção, você pode usar Google Custom Search API ou outra API de imagens
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchTerm)}&per_page=20&client_id=demo`
      );
      
      if (response.ok) {
        const data = await response.json();
        const formattedImages: GoogleImage[] = data.results?.map((img: any) => ({
          url: img.urls.regular,
          thumbnail: img.urls.thumb,
          title: img.alt_description || img.description || searchTerm,
          source: 'Unsplash'
        })) || [];
        
        setImages(formattedImages);
      } else {
        // Fallback: gerar URLs de exemplo para demonstração
        const demoImages: GoogleImage[] = Array.from({ length: 12 }, (_, i) => ({
          url: `https://picsum.photos/400/400?random=${Date.now()}-${i}`,
          thumbnail: `https://picsum.photos/200/200?random=${Date.now()}-${i}`,
          title: `${searchTerm} - Imagem ${i + 1}`,
          source: 'Demo'
        }));
        setImages(demoImages);
      }
    } catch (error) {
      console.error('Erro ao buscar imagens:', error);
      // Fallback: gerar URLs de exemplo
      const demoImages: GoogleImage[] = Array.from({ length: 12 }, (_, i) => ({
        url: `https://picsum.photos/400/400?random=${Date.now()}-${i}`,
        thumbnail: `https://picsum.photos/200/200?random=${Date.now()}-${i}`,
        title: `${searchTerm} - Imagem ${i + 1}`,
        source: 'Demo'
      }));
      setImages(demoImages);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = async (imageUrl: string) => {
    setUpdating(true);
    try {
      // Atualizar a imagem do produto
      await ProductsService.updateProduct(product.id, {
        imageurl: imageUrl
      });
      
      onImageSelected(imageUrl);
      toast({
        title: 'Sucesso!',
        description: 'Imagem do produto atualizada com sucesso.',
      });
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar imagem:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar a imagem do produto.',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleClose = () => {
    setImages([]);
    setSelectedImage(null);
    setSearchQuery('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Buscar Imagem para: {product.name}</span>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X size={20} />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Barra de Pesquisa */}
          <div className="flex gap-2">
            <Input
              placeholder="Digite para buscar imagens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={() => handleSearch()} disabled={loading}>
              <Search size={20} />
              {loading ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>

          {/* Grid de Imagens */}
          <div className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">Buscando imagens...</span>
              </div>
            ) : images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div
                    key={index}
                    className={`relative group cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                      selectedImage === image.url
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-gray-200 hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedImage(image.url)}
                  >
                    <img
                      src={image.thumbnail}
                      alt={image.title}
                      className="w-full h-32 object-cover"
                      loading="lazy"
                    />
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                      {selectedImage === image.url ? (
                        <div className="bg-primary text-white p-2 rounded-full">
                          <Check size={16} />
                        </div>
                      ) : (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="sm" variant="secondary">
                            <Download size={14} className="mr-1" />
                            Selecionar
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {/* Título */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 text-xs truncate">
                      {image.title}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Search size={48} className="mx-auto mb-2 opacity-50" />
                <p>Digite um termo para buscar imagens</p>
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          {selectedImage && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button 
                onClick={() => handleImageSelect(selectedImage)}
                disabled={updating}
              >
                {updating ? 'Atualizando...' : 'Usar Esta Imagem'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GoogleImageSearchPopup;