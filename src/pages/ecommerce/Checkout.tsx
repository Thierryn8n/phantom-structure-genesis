import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import { EcommerceService, StoreInfo } from '@/services/ecommerceService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  CreditCard, 
  ShoppingBag, 
  Truck, 
  MapPin, 
  User, 
  Mail, 
  Phone, 
  ChevronLeft, 
  ArrowRight, 
  Check,
  CheckCircle,
  Trash,
  AlertCircle
} from 'lucide-react';
import { formatPrice } from '@/utils/format';

// Tipos
interface CustomerForm {
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

interface CompletedSteps {
  customer: boolean;
  address: boolean;
  shipping: boolean;
  payment: boolean;
}

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { cartItems, removeFromCart, updateCartItemQuantity, clearCart, getCartTotal } = useCart();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('pix');
  const [shippingMethod, setShippingMethod] = useState<string>('pickup');
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [orderNote, setOrderNote] = useState<string>('');
  
  const [customerForm, setCustomerForm] = useState<CustomerForm>({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
    }
  });
  
  const [completedSteps, setCompletedSteps] = useState<CompletedSteps>({
    customer: false,
    address: false,
    shipping: false,
    payment: false
  });
  
  // Carregar informações da loja
  useEffect(() => {
    const loadStoreInfo = async () => {
      try {
        const info = await EcommerceService.getStoreInfo();
        setStoreInfo(info);
        
        // Definir método de envio padrão
        if (info?.shippingMethods && info.shippingMethods.length > 0) {
          setShippingMethod(info.shippingMethods[0].id);
          setShippingCost(info.shippingMethods[0].price);
        }
      } catch (error) {
        console.error('Erro ao carregar informações da loja:', error);
      }
    };
    
    loadStoreInfo();
  }, []);
  
  // Redirecionar se o carrinho estiver vazio
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/ecommerce');
      toast({
        title: 'Carrinho vazio',
        description: 'Adicione produtos ao carrinho antes de finalizar a compra',
        variant: 'destructive',
      });
    }
  }, [cartItems, navigate, toast]);
  
  // Selecionar método de envio
  const handleShippingMethodChange = (methodId: string) => {
    setShippingMethod(methodId);
    
    const selectedMethod = storeInfo?.shippingMethods?.find(method => method.id === methodId);
    if (selectedMethod) {
      setShippingCost(selectedMethod.price);
    }
  };
  
  // Atualizar dados do cliente
  const handleCustomerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      if (parent === 'address') {
      setCustomerForm(prev => ({
        ...prev,
          address: {
            ...prev.address,
          [child]: value
        }
      }));
      }
    } else {
      setCustomerForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Calcular totais
  const subtotal = getCartTotal();
  const total = subtotal + shippingCost;
  
  // Verificar conclusão das etapas
  const checkStepCompletion = (step: keyof CompletedSteps): boolean => {
    switch (step) {
      case 'customer':
        return Boolean(customerForm.name && customerForm.email && customerForm.phone);
      case 'address':
        if (shippingMethod === 'pickup') return true;
        return Boolean(
          customerForm.address.street && 
          customerForm.address.number && 
          customerForm.address.neighborhood && 
          customerForm.address.city && 
          customerForm.address.state && 
          customerForm.address.zipCode
        );
      case 'shipping':
        return Boolean(shippingMethod);
      case 'payment':
        return Boolean(paymentMethod);
      default:
        return false;
    }
  };

  // Finalizar compra
  const handleCheckout = async () => {
    try {
      setIsProcessing(true);

      // Validar formulário
      if (!checkStepCompletion('customer')) {
      toast({
          title: 'Dados incompletos',
          description: 'Preencha todos os dados pessoais',
        variant: 'destructive',
      });
      return;
    }
    
      if (!checkStepCompletion('address') && shippingMethod !== 'pickup') {
          toast({
          title: 'Endereço incompleto',
          description: 'Preencha todos os dados de endereço',
            variant: 'destructive',
          });
          return;
        }

      // Criar o cliente
      const customerData = {
        name: customerForm.name,
        phone: customerForm.phone,
        email: customerForm.email,
        address: customerForm.address,
        owner_id: storeInfo?.owner_id || ''
      };

      const customer = await EcommerceService.createCustomer(customerData);

      // Criar o pedido
      const orderData = {
        product_id: cartItems[0].id,
        product_name: cartItems.map(item => `${item.name} (${item.quantity}x)`).join(', '),
        customer_id: customer.id,
        customer_name: customerForm.name,
        seller_id: storeInfo?.owner_id || '',
        seller_name: storeInfo?.store_name || storeInfo?.name || '',
        status: 'entrada',
        notes: orderNote,
        total_amount: total
      };

      const orderId = await EcommerceService.createOrderKanban(orderData);

      if (!orderId) {
        throw new Error('Erro ao criar pedido');
      }

      // Limpar o carrinho e redirecionar
      clearCart();
      navigate('/ecommerce/checkout/success');
      
    } catch (error) {
      console.error('Erro ao finalizar compra:', error);
      toast({
        title: 'Erro ao finalizar compra',
        description: 'Ocorreu um erro ao processar seu pedido. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Finalizar Compra</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulário de Checkout */}
          <div className="lg:col-span-2">
            <Accordion type="single" defaultValue="customer" className="space-y-4">
              {/* Dados Pessoais */}
              <AccordionItem value="customer" className="border rounded-lg p-4">
                <AccordionTrigger className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <User size={20} />
                    <span>Dados Pessoais</span>
                  </div>
                  {checkStepCompletion('customer') && (
                    <CheckCircle className="text-green-500" size={20} />
                  )}
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                      <Input 
                        id="name" 
                        name="name"
                        value={customerForm.name}
                        onChange={handleCustomerInputChange}
                      placeholder="Digite seu nome completo"
                      />
                    </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                        <Input 
                          id="email" 
                          name="email"
                          type="email"
                          value={customerForm.email}
                          onChange={handleCustomerInputChange}
                      placeholder="Digite seu e-mail"
                        />
                      </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                        <Input 
                          id="phone" 
                          name="phone"
                          value={customerForm.phone}
                          onChange={handleCustomerInputChange}
                      placeholder="Digite seu telefone"
                        />
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              {/* Endereço */}
              <AccordionItem value="address" className="border rounded-lg p-4">
                <AccordionTrigger className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <MapPin size={20} />
                    <span>Endereço de Entrega</span>
                  </div>
                  {checkStepCompletion('address') && (
                    <CheckCircle className="text-green-500" size={20} />
                  )}
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address.street">Rua</Label>
                        <Input 
                      id="address.street"
                          name="address.street"
                          value={customerForm.address.street}
                          onChange={handleCustomerInputChange}
                      placeholder="Digite sua rua"
                        />
                      </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address.number">Número</Label>
                        <Input 
                        id="address.number"
                          name="address.number"
                          value={customerForm.address.number}
                          onChange={handleCustomerInputChange}
                        placeholder="Nº"
                        />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address.complement">Complemento</Label>
                      <Input 
                        id="address.complement"
                        name="address.complement"
                        value={customerForm.address.complement}
                        onChange={handleCustomerInputChange}
                        placeholder="Apto, Sala, etc."
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address.neighborhood">Bairro</Label>
                        <Input 
                      id="address.neighborhood"
                          name="address.neighborhood"
                          value={customerForm.address.neighborhood}
                          onChange={handleCustomerInputChange}
                      placeholder="Digite seu bairro"
                        />
                      </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address.city">Cidade</Label>
                        <Input 
                        id="address.city"
                          name="address.city"
                          value={customerForm.address.city}
                          onChange={handleCustomerInputChange}
                        placeholder="Digite sua cidade"
                        />
                      </div>
                    <div className="space-y-2">
                      <Label htmlFor="address.state">Estado</Label>
                        <Input 
                        id="address.state"
                          name="address.state"
                          value={customerForm.address.state}
                          onChange={handleCustomerInputChange}
                          placeholder="UF"
                        />
                      </div>
                    </div>
                  <div className="space-y-2">
                    <Label htmlFor="address.zipCode">CEP</Label>
                    <Input
                      id="address.zipCode"
                      name="address.zipCode"
                      value={customerForm.address.zipCode}
                      onChange={handleCustomerInputChange}
                      placeholder="Digite seu CEP"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              {/* Entrega */}
              <AccordionItem value="shipping" className="border rounded-lg p-4">
                <AccordionTrigger className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <Truck size={20} />
                    <span>Método de Entrega</span>
                  </div>
                  {checkStepCompletion('shipping') && (
                    <CheckCircle className="text-green-500" size={20} />
                  )}
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <RadioGroup 
                    value={shippingMethod} 
                    onValueChange={handleShippingMethodChange}
                    className="space-y-2"
                  >
                    {storeInfo?.shippingMethods?.map((method) => (
                      <div key={method.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={method.id} id={method.id} />
                        <Label htmlFor={method.id} className="flex-1">
                          <div className="flex justify-between items-center">
                            <span>{method.name}</span>
                            <span>{formatPrice(method.price)}</span>
                          </div>
                          {method.description && (
                            <p className="text-sm text-gray-500">{method.description}</p>
                          )}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </AccordionContent>
              </AccordionItem>
              
              {/* Pagamento */}
              <AccordionItem value="payment" className="border rounded-lg p-4">
                <AccordionTrigger className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <CreditCard size={20} />
                    <span>Método de Pagamento</span>
                  </div>
                  {checkStepCompletion('payment') && (
                    <CheckCircle className="text-green-500" size={20} />
                  )}
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <RadioGroup 
                    value={paymentMethod} 
                    onValueChange={setPaymentMethod}
                    className="space-y-2"
                  >
                    {storeInfo?.paymentMethods?.map((method) => (
                      <div key={method} className="flex items-center space-x-2">
                        <RadioGroupItem value={method} id={method} />
                        <Label htmlFor={method}>{method}</Label>
                    </div>
                    ))}
                  </RadioGroup>
                </AccordionContent>
              </AccordionItem>
              
              {/* Observações */}
              <div className="border rounded-lg p-4 space-y-2">
                <Label htmlFor="orderNote">Observações do Pedido</Label>
                    <Textarea 
                  id="orderNote"
                      value={orderNote}
                      onChange={(e) => setOrderNote(e.target.value)}
                  placeholder="Alguma observação sobre seu pedido?"
                  className="min-h-[100px]"
                    />
                  </div>
            </Accordion>
          </div>
          
          {/* Resumo do Pedido */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h2 className="text-lg font-medium mb-4">Resumo do Pedido</h2>
              
              <div className="space-y-4">
                {/* Lista de Produtos */}
                <div className="space-y-2">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <span>{item.quantity}x {item.name}</span>
                      <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              
                <Separator />
                
                {/* Subtotal */}
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                
                {/* Frete */}
                <div className="flex justify-between">
                  <span>Frete</span>
                  <span>{formatPrice(shippingCost)}</span>
                </div>
                
                {/* Total */}
                <div className="flex justify-between font-medium text-lg border-t pt-4">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
                </div>
                
              {/* Botão Finalizar Compra */}
                <Button
                  onClick={handleCheckout}
                disabled={isProcessing}
                className="w-full mt-6 bg-[var(--store-primary)] hover:bg-[var(--store-primary-hover)] text-white"
                >
                {isProcessing ? 'Processando...' : 'Finalizar Compra'}
                </Button>
                
              {/* Botão Voltar */}
              <Button
                variant="outline"
                onClick={() => navigate('/ecommerce/cart')}
                className="w-full mt-2"
              >
                Voltar ao Carrinho
              </Button>
            </Card>
          </div>
          </div>
        </div>
      </div>
  );
};

export default Checkout; 