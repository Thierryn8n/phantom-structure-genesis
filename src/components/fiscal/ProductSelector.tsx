
import React, { useState } from 'react';
import { Plus, Minus, Search } from 'lucide-react';

export interface Product {
  id: string;
  name: string;
  code: string;
  price: number;
  description?: string;
}

export interface SelectedProduct extends Product {
  quantity: number;
  subtotal: number;
}

interface ProductSelectorProps {
  onProductsChange: (products: SelectedProduct[]) => void;
}

// Mock products data - in a real scenario, this would come from Supabase
const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Produto 1', code: 'P001', price: 19.90, description: 'Descrição do Produto 1' },
  { id: '2', name: 'Produto 2', code: 'P002', price: 29.90, description: 'Descrição do Produto 2' },
  { id: '3', name: 'Produto 3', code: 'P003', price: 39.90, description: 'Descrição do Produto 3' },
  { id: '4', name: 'Produto 4', code: 'P004', price: 49.90, description: 'Descrição do Produto 4' },
  { id: '5', name: 'Produto 5', code: 'P005', price: 59.90, description: 'Descrição do Produto 5' },
];

const ProductSelector: React.FC<ProductSelectorProps> = ({ onProductsChange }) => {
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [products] = useState<Product[]>(MOCK_PRODUCTS);

  const filteredProducts = products.filter(
    product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      product.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-cascadia mb-4">Produtos Selecionados</h3>
        
        {selectedProducts.length === 0 ? (
          <p className="text-fiscal-gray-500">Nenhum produto selecionado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-fiscal-gray-100 border-b border-black">
                  <th className="py-2 px-3 text-sm font-medium">Código</th>
                  <th className="py-2 px-3 text-sm font-medium">Produto</th>
                  <th className="py-2 px-3 text-sm font-medium">Preço</th>
                  <th className="py-2 px-3 text-sm font-medium">Qtd</th>
                  <th className="py-2 px-3 text-sm font-medium">Subtotal</th>
                  <th className="py-2 px-3 text-sm font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {selectedProducts.map(product => (
                  <tr key={product.id} className="border-b border-fiscal-gray-200">
                    <td className="py-3 px-3">{product.code}</td>
                    <td className="py-3 px-3">{product.name}</td>
                    <td className="py-3 px-3">R$ {product.price.toFixed(2)}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => updateQuantity(product.id, -1)}
                          className="p-1 rounded bg-fiscal-gray-200 hover:bg-fiscal-gray-300"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span>{product.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(product.id, 1)}
                          className="p-1 rounded bg-fiscal-gray-200 hover:bg-fiscal-gray-300"
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-3">R$ {product.subtotal.toFixed(2)}</td>
                    <td className="py-3 px-3">
                      <button 
                        onClick={() => removeProduct(product.id)}
                        className="text-red-500 hover:text-red-700"
                        aria-label="Remove product"
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-fiscal-gray-100">
                  <td colSpan={4} className="py-3 px-3 text-right font-medium">Total:</td>
                  <td className="py-3 px-3 font-medium">
                    R$ {selectedProducts.reduce((sum, product) => sum + product.subtotal, 0).toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="text-lg font-cascadia mb-4">Adicionar Produtos</h3>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-fiscal-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar produtos por nome ou código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-10"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              className="border border-fiscal-gray-200 rounded-md p-3 hover:border-fiscal-green-500 cursor-pointer"
              onClick={() => addProduct(product)}
            >
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-fiscal-gray-600">Código: {product.code}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">R$ {product.price.toFixed(2)}</p>
                  <button className="text-sm text-fiscal-green-600 hover:text-fiscal-green-800">
                    + Adicionar
                  </button>
                </div>
              </div>
              {product.description && (
                <p className="text-sm text-fiscal-gray-500 mt-1 truncate">{product.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductSelector;
