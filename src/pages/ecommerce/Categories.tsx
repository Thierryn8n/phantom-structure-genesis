import React, { useState, useEffect } from 'react';
import EcommerceDashboardLayout from '@/components/ecommerce/EcommerceDashboardLayout';
import { 
  Plus, Pencil, Trash2, Save, X, Package2, Calendar,
  ShoppingBag, ShoppingCart, Shirt, Gift, Home, Book, 
  Music, Camera, Laptop, Smartphone, Headphones, Watch,
  Coffee, Pizza, Utensils, Car, Plane, Train, Hotel,
  Gamepad, Palette, Scissors, Baby, Heart, Dumbbell,
  Sun, Umbrella, Leaf, Dog, Cat, Fish, Bird, Trees,
  Wrench, Briefcase, DollarSign, CreditCard,
  Tag, Tags, Box, Boxes, Package, Truck, Store
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { EcommerceService, Category } from '@/services/ecommerceService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

// Mapa de ícones disponíveis
const availableIcons = {
  Package2, ShoppingBag, ShoppingCart, Shirt, Gift, Home, Book,
  Music, Camera, Laptop, Smartphone, Headphones, Watch,
  Coffee, Pizza, Utensils, Car, Plane, Train, Hotel,
  Gamepad, Palette, Scissors, Baby, Heart, Dumbbell,
  Sun, Umbrella, Leaf, Dog, Cat, Fish, Bird, Trees,
  Wrench, Briefcase, DollarSign, CreditCard,
  Tag, Tags, Box, Boxes, Package, Truck, Store
};

const EcommerceCategories: React.FC = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCategory, setNewCategory] = useState<{ name: string; description: string; icon: string }>({ name: '', description: '', icon: 'Package2' });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  // Função para renderizar o ícone dinâmico
  const RenderIconComponent = ({ iconName }: { iconName: string }) => {
    const Icon = availableIcons[iconName as keyof typeof availableIcons] || Package2;
    return <Icon className="h-5 w-5" />;
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const data = await EcommerceService.getCategories();
      setCategories(data.map(c => ({ ...c, icon: c.icon || 'Package2' })));
    } catch (error) {
      toast({
        title: 'Erro ao carregar categorias',
        description: (error as Error).message || 'Não foi possível buscar os dados das categorias.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async () => {
      if (!newCategory.name.trim()) {
      toast({ title: 'Erro de Validação', description: 'O nome da categoria é obrigatório.', variant: 'destructive' });
        return;
      }
    try {
      await EcommerceService.createCategory(newCategory);
      toast({ title: 'Sucesso', description: 'Categoria criada com sucesso.' });
      setNewCategory({ name: '', description: '', icon: 'Package2' });
      setShowNewForm(false);
      loadCategories();
    } catch (error) {
      toast({ title: 'Erro ao Criar', description: (error as Error).message || 'Não foi possível criar a categoria.', variant: 'destructive' });
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.id || !editingCategory.name.trim()) {
      toast({ title: 'Erro de Validação', description: 'Dados da categoria inválidos ou nome obrigatório.', variant: 'destructive' });
        return;
      }
    try {
      await EcommerceService.updateCategory(editingCategory.id, editingCategory);
      toast({ title: 'Sucesso', description: 'Categoria atualizada com sucesso.' });
      setEditingCategory(null);
      loadCategories();
    } catch (error) {
      toast({ title: 'Erro ao Atualizar', description: (error as Error).message || 'Não foi possível atualizar a categoria.', variant: 'destructive' });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    // Usar um dialog de confirmação mais elegante no futuro
    if (!confirm('Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.')) return;
    try {
      await EcommerceService.deleteCategory(id);
      toast({ title: 'Sucesso', description: 'Categoria excluída com sucesso.' });
      loadCategories();
    } catch (error) {
      toast({ title: 'Erro ao Excluir', description: (error as Error).message || 'Não foi possível excluir a categoria.', variant: 'destructive' });
    }
  };

  const IconPicker = ({ currentValue, onSelect }: { currentValue: string; onSelect: (iconName: string) => void }) => (
    <ScrollArea className="h-[300px] border rounded-md">
      <div className="grid grid-cols-6 gap-2 p-4">
        {Object.entries(availableIcons).map(([name, Icon]) => (
          <Button
            key={name}
            variant="outline"
            size="icon"
            className={`p-2 aspect-square rounded-md flex items-center justify-center transition-all
                        ${currentValue === name 
                          ? 'ring-2 ring-green-500 bg-green-100 text-green-700 shadow-md' 
                          : 'hover:bg-gray-100 text-gray-600'}`}
            onClick={() => onSelect(name)}
          >
            <Icon className="h-6 w-6" />
          </Button>
        ))}
      </div>
    </ScrollArea>
  );

  return (
    <EcommerceDashboardLayout>
      <div className="space-y-8 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Gerenciar Categorias</h1>
            <p className="text-gray-500 mt-1">Crie, edite e organize as categorias de produtos da sua loja.</p>
          </div>
          <Button 
            onClick={() => setShowNewForm(true)} 
            disabled={showNewForm}
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-transform hover:scale-105"
          >
            <Plus className="h-5 w-5 mr-2" />
            Adicionar Nova Categoria
          </Button>
        </div>

        {/* Formulário para nova categoria */}
        <div
          className={`
            overflow-hidden // Essencial para a transição de max-height
            transition-[max-height,opacity,transform] duration-300 ease-in-out
            ${showNewForm
              ? 'max-h-[1000px] opacity-100 translate-y-0 mt-6' // Estado visível, 1000px é um valor alto para acomodar o formulário. Adicionado mt-6.
              : 'max-h-0 opacity-0 -translate-y-4'             // Estado escondido
            }
          `}
        >
          <Card className="bg-white shadow-lg border-gray-200">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800">Nova Categoria</CardTitle>
              <CardDescription>Preencha os dados para criar uma nova categoria.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label htmlFor="newCatName" className="block text-sm font-medium mb-1 text-gray-700">Nome da Categoria</label>
                <Input
                  id="newCatName"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="Ex: Eletrônicos"
                  className="bg-white border-gray-300 focus:ring-green-500 focus:border-green-500 shadow-sm"
                />
              </div>
              <div>
                <label htmlFor="newCatDesc" className="block text-sm font-medium mb-1 text-gray-700">Descrição</label>
                <Input
                  id="newCatDesc"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  placeholder="Breve descrição (opcional)"
                  className="bg-white border-gray-300 focus:ring-green-500 focus:border-green-500 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Ícone</label>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-gray-700 bg-white shadow-sm hover:bg-gray-50">
                      <span className="mr-2 text-gray-600">Ícone Atual:</span>
                      <RenderIconComponent iconName={newCategory.icon} />
                      <span className="ml-2 font-medium text-gray-800">{newCategory.icon}</span>
                      <span className="ml-auto text-xs text-blue-600 hover:text-blue-700 font-semibold">Trocar</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] bg-white">
                    <DialogHeader>
                      <DialogTitle className="text-gray-800">Selecionar Ícone</DialogTitle>
                    </DialogHeader>
                    <IconPicker 
                      currentValue={newCategory.icon}
                      onSelect={(iconName) => setNewCategory({ ...newCategory, icon: iconName })} 
                    />
                  </DialogContent>
                </Dialog>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  variant="outline"
                  onClick={() => setShowNewForm(false)}
                  className="hover:bg-gray-100 text-gray-700 border-gray-300 shadow-sm"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateCategory}
                  className="bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Categoria
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grid de categorias */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            [...Array(8)].map((_, i) => (
              <Card key={i} className="border border-gray-200 bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-6 w-3/4" />
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <div className="flex justify-between items-center mt-4">
                    <Skeleton className="h-4 w-24" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
            </div>
          </div>
                </CardContent>
              </Card>
            ))
                ) : categories.length === 0 ? (
            <div className="col-span-full">
              <Card className="border-2 border-dashed border-gray-200 bg-gray-50 py-12">
                <CardContent className="text-center">
                  <Package2 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhuma Categoria Encontrada</h3>
                  <p className="text-gray-500 mb-6">Parece que você ainda não adicionou nenhuma categoria. Comece agora!</p>
                  <Button onClick={() => setShowNewForm(true)} className="bg-green-600 hover:bg-green-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Categoria
                  </Button>
                </CardContent>
              </Card>
            </div>
                ) : (
            categories.map((category, index) => (
              <div
                key={category.id}
                className={`animate-fade-in-up fade-in-up-delay-${Math.min(index % 4 + 1, 3)}`}
              >
                <Card className="border border-gray-200 hover:border-green-500 transition-all duration-300 hover:shadow-xl bg-white shadow-md flex flex-col h-full">
                  <CardContent className="p-5 flex-grow flex flex-col">
                        {editingCategory?.id === category.id ? (
                      // Modo de edição
                      <div className="space-y-4 flex-grow flex flex-col justify-between">
                        <div>
                          <label className="text-xs text-gray-500">Nome</label>
                          <Input
                            value={editingCategory.name}
                            onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                            className="font-medium text-lg mb-2 bg-white border-gray-300 focus:ring-green-500 focus:border-green-500 shadow-sm"
                          />
                          <label className="text-xs text-gray-500">Descrição</label>
                          <Input
                            value={editingCategory.description || ''}
                            onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                            className="mb-3 bg-white border-gray-300 focus:ring-green-500 focus:border-green-500 shadow-sm"
                          />
                          <label className="text-xs text-gray-500">Ícone</label>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-gray-700 bg-white shadow-sm hover:bg-gray-50 mb-3">
                                <RenderIconComponent iconName={editingCategory.icon || 'Package2'} />
                                <span className="ml-2 font-medium text-gray-800">{editingCategory.icon || 'Package2'}</span>
                                <span className="ml-auto text-xs text-blue-600 hover:text-blue-700 font-semibold">Trocar</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] bg-white">
                              <DialogHeader>
                                <DialogTitle className="text-gray-800">Selecionar Ícone</DialogTitle>
                              </DialogHeader>
                              <IconPicker 
                                currentValue={editingCategory.icon || 'Package2'}
                                onSelect={(iconName) => setEditingCategory({ ...editingCategory, icon: iconName })} 
                              />
                            </DialogContent>
                          </Dialog>
                        </div>
                        <div className="flex justify-end gap-2 mt-auto">
                          <Button size="sm" variant="ghost" onClick={() => setEditingCategory(null)} className="text-gray-600 hover:bg-gray-100">
                            <X className="h-4 w-4 mr-1" /> Cancelar
                            </Button>
                          <Button size="sm" onClick={handleUpdateCategory} className="bg-green-500 hover:bg-green-600 text-white">
                            <Save className="h-4 w-4 mr-1" /> Salvar
                            </Button>
                        </div>
                      </div>
                    ) : (
                      // Modo de visualização
                      <>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-green-50 rounded-full text-green-600">
                            <RenderIconComponent iconName={category.icon || 'Package2'} />
                          </div>
                          <h3 className="font-semibold text-lg text-gray-800 truncate" title={category.name}>{category.name}</h3>
                        </div>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow min-h-[60px]">
                          {category.description || 'Sem descrição fornecida.'}
                        </p>
                        <div className="mt-auto border-t border-gray-100 pt-3">
                          <div className="flex items-center text-xs text-gray-500 mb-3">
                            <Calendar className="h-3.5 w-3.5 mr-1.5" />
                            Criado em: {new Date(category.createdAt || '').toLocaleDateString()}
                          </div>
                          <div className="flex justify-end gap-1.5">
                            <Button size="icon" variant="ghost" onClick={() => setEditingCategory(category)} className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDeleteCategory(category.id)} className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </>
                        )}
                  </CardContent>
                </Card>
              </div>
                  ))
                )}
        </div>
      </div>
    </EcommerceDashboardLayout>
  );
};

export default EcommerceCategories; 