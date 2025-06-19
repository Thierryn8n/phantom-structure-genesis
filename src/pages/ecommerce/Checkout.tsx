
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { EcommerceService, Seller, NewCustomerData, NewOrderKanbanData } from '@/services/ecommerceService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingBag, CreditCard, Truck, Check, ArrowLeft, User } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import type { StoreInfo } from '@/types';

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { cart, clearCart, getCartTotal } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<'shipping' | 'payment' | 'review' | 'success'>('shipping');
  const [isProcessing, setIsProcessing] = useState(false);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);

  // Shipping Information
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    number: '',
    neighborhood: '',
  });

  // Payment Information
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });

  // Shipping Method
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<string>('');
  const [shippingCost, setShippingCost] = useState<number>(0);

  // Sellers and order management
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedSellerId, setSelectedSellerId] = useState<string>('');

  useEffect(() => {
    const fetchStoreInfo = async () => {
      try {
        const info = await EcommerceService.getStoreInfo();
        setStoreInfo(info);
        
        // Pre-select first shipping method if available
        if (info?.shippingMethods && info.shippingMethods.length > 0) {
          setSelectedShippingMethod(info.shippingMethods[0].id);
          setShippingCost(info.shippingMethods[0].price);
        }
      } catch (error) {
        console.error('Error fetching store info:', error);
      }
    };

    fetchStoreInfo();
  }, []);

  useEffect(() => {
    const fetchSellers = async () => {
      if (storeInfo?.id || storeInfo?.owner_id || storeInfo?.user_id) {
        try {
          const ownerId = storeInfo.id || storeInfo.owner_id || storeInfo.user_id;
          const fetchedSellers = await EcommerceService.getActiveSellers(ownerId);
          setSellers(fetchedSellers);
          if (fetchedSellers.length > 0) {
            setSelectedSellerId(fetchedSellers[0].id);
          }
        } catch (error) {
          console.error("Error fetching sellers:", error);
        }
      }
    };

    fetchSellers();
  }, [storeInfo]);

  useEffect(() => {
    // Update shipping cost when method changes
    const method = storeInfo?.shippingMethods?.find(m => m.id === selectedShippingMethod);
    if (method) {
      setShippingCost(method.price);
    }
  }, [selectedShippingMethod, storeInfo]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const validateShippingInfo = () => {
    const required = ['fullName', 'email', 'phone', 'address', 'city', 'zipCode'];
    return required.every(field => shippingInfo[field as keyof typeof shippingInfo].trim() !== '');
  };

  const validatePaymentInfo = () => {
    if (paymentMethod === 'cash' || paymentMethod === 'pix') {
      return true;
    }
    if (paymentMethod === 'credit' || paymentMethod === 'debit') {
      return paymentDetails.cardNumber && paymentDetails.cardName && 
             paymentDetails.expiryDate && paymentDetails.cvv;
    }
    return false;
  };

  const handleNextStep = () => {
    if (step === 'shipping') {
      if (!validateShippingInfo()) {
        toast({
          title: "Informações incompletas",
          description: "Por favor, preencha todos os campos obrigatórios.",
          variant: "destructive"
        });
        return;
      }
      setStep('payment');
    } else if (step === 'payment') {
      if (!paymentMethod) {
        toast({
          title: "Forma de pagamento",
          description: "Por favor, selecione uma forma de pagamento.",
          variant: "destructive"
        });
        return;
      }
      if (!validatePaymentInfo()) {
        toast({
          title: "Informações de pagamento",
          description: "Por favor, preencha as informações de pagamento.",
          variant: "destructive"
        });
        return;
      }
      setStep('review');
    } else if (step === 'review') {
      handleProcessOrder();
    }
  };

  const handleProcessOrder = async () => {
    setIsProcessing(true);
    try {
      if (!storeInfo?.id && !storeInfo?.owner_id && !storeInfo?.user_id) {
        throw new Error("Store information missing");
      }

      const ownerId = storeInfo.id || storeInfo.owner_id || storeInfo.user_id;

      // Create customer
      const customerData: NewCustomerData = {
        name: shippingInfo.fullName,
        phone: shippingInfo.phone,
        email: shippingInfo.email,
        address: {
          street: shippingInfo.address,
          number: shippingInfo.number,
          neighborhood: shippingInfo.neighborhood,
          city: shippingInfo.city,
          state: shippingInfo.state,
          zipCode: shippingInfo.zipCode,
        },
        owner_id: ownerId,
      };

      const customer = await EcommerceService.createCustomer(customerData);
      
      // Get selected seller
      const selectedSeller = sellers.find(s => s.id === selectedSellerId);
      if (!selectedSeller) {
        throw new Error("Selected seller not found");
      }

      // Create orders for each cart item
      const orderPromises = cart.map(async (item) => {
        const orderData: NewOrderKanbanData = {
          customer_id: customer.id,
          customer_name: customer.name,
          product_id: item.productId,
          product_name: item.name,
          seller_id: selectedSeller.id,
          seller_name: selectedSeller.full_name,
          status: 'entrada',
          notes: `Pedido do checkout. Método de pagamento: ${paymentMethod}. Quantidade: ${item.quantity}`,
          total_amount: item.subtotal + (shippingCost / cart.length), // Distribute shipping cost
        };
        return EcommerceService.createOrderKanban(orderData);
      });

      await Promise.all(orderPromises);

      clearCart();
      setStep('success');

      toast({
        title: "Pedido realizado com sucesso!",
        description: "Você receberá atualizações sobre o status do seu pedido."
      });

    } catch (error) {
      console.error('Error processing order:', error);
      toast({
        title: "Erro ao processar pedido",
        description: "Ocorreu um erro ao processar seu pedido. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (cart.length === 0 && step !== 'success') {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="mx-auto h-24 w-24 text-gray-400 mb-6" />
        <h1 className="text-3xl font-semibold mb-4">Seu carrinho está vazio</h1>
        <p className="text-gray-600 mb-8">Adicione alguns produtos ao carrinho para continuar.</p>
        <Button onClick={() => navigate('/ecommerce')} className="px-8 py-3">
          Continuar Comprando
        </Button>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-semibold mb-4">Pedido Confirmado!</h1>
          <p className="text-gray-600 mb-8">
            Obrigado pela sua compra. Você receberá um email com os detalhes do pedido e atualizações sobre a entrega.
          </p>
          <div className="space-y-3">
            <Button onClick={() => navigate('/ecommerce')} className="w-full">
              Continuar Comprando
            </Button>
            <Button variant="outline" onClick={() => navigate('/ecommerce/orders')} className="w-full">
              Ver Meus Pedidos
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const total = getCartTotal() + shippingCost;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/ecommerce/cart')}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Carrinho
        </Button>
        <h1 className="text-3xl font-bold">Finalizar Compra</h1>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
            step === 'shipping' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
          )}>
            {step === 'shipping' ? '1' : <Check className="h-4 w-4" />}
          </div>
          <span className="ml-2 text-sm font-medium">Entrega</span>
        </div>

        <div className="w-16 h-0.5 bg-gray-300 mx-4" />

        <div className="flex items-center">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
            step === 'shipping' ? 'bg-gray-300 text-gray-600' :
            step === 'payment' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
          )}>
            {step === 'shipping' ? '2' : step === 'payment' ? '2' : <Check className="h-4 w-4" />}
          </div>
          <span className="ml-2 text-sm font-medium">Pagamento</span>
        </div>

        <div className="w-16 h-0.5 bg-gray-300 mx-4" />

        <div className="flex items-center">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
            step === 'review' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
          )}>
            3
          </div>
          <span className="ml-2 text-sm font-medium">Revisão</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Shipping Information */}
          {step === 'shipping' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="h-5 w-5 mr-2" />
                  Informações de Entrega
                </CardTitle>
                <CardDescription>
                  Preencha suas informações para entrega
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Nome Completo *</Label>
                    <Input
                      id="fullName"
                      value={shippingInfo.fullName}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Seu nome completo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={shippingInfo.email}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    value={shippingInfo.phone}
                    onChange={(e) => setShippingInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div>
                  <Label htmlFor="zipCode">CEP *</Label>
                  <Input
                    id="zipCode"
                    value={shippingInfo.zipCode}
                    onChange={(e) => setShippingInfo(prev => ({ ...prev, zipCode: e.target.value }))}
                    placeholder="12345-678"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="address">Endereço *</Label>
                    <Input
                      id="address"
                      value={shippingInfo.address}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Rua, Avenida, etc."
                    />
                  </div>
                  <div>
                    <Label htmlFor="number">Número</Label>
                    <Input
                      id="number"
                      value={shippingInfo.number}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, number: e.target.value }))}
                      placeholder="123"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={shippingInfo.neighborhood}
                    onChange={(e) => setShippingInfo(prev => ({ ...prev, neighborhood: e.target.value }))}
                    placeholder="Nome do bairro"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Cidade *</Label>
                    <Input
                      id="city"
                      value={shippingInfo.city}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Sua cidade"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      value={shippingInfo.state}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, state: e.target.value }))}
                      placeholder="SP"
                    />
                  </div>
                </div>

                {/* Shipping Methods */}
                {storeInfo?.shippingMethods && storeInfo.shippingMethods.length > 0 && (
                  <div>
                    <Label>Método de Entrega</Label>
                    <RadioGroup
                      value={selectedShippingMethod}
                      onValueChange={setSelectedShippingMethod}
                      className="mt-2"
                    >
                      {storeInfo.shippingMethods.map((method) => (
                        <div key={method.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                          <RadioGroupItem value={method.id} id={method.id} />
                          <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-medium">{method.name}</div>
                                {method.description && (
                                  <div className="text-sm text-gray-500">{method.description}</div>
                                )}
                              </div>
                              <div className="font-medium">{formatPrice(method.price)}</div>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}

                {/* Seller Selection */}
                {sellers.length > 0 && (
                  <div>
                    <Label>Vendedor Responsável</Label>
                    <Select value={selectedSellerId} onValueChange={setSelectedSellerId}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Selecione um vendedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {sellers.map((seller) => (
                          <SelectItem key={seller.id} value={seller.id}>
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2" />
                              {seller.full_name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment Information */}
          {step === 'payment' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Forma de Pagamento
                </CardTitle>
                <CardDescription>
                  Escolha como deseja pagar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Payment Methods */}
                <div>
                  <Label>Método de Pagamento</Label>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="mt-2">
                    {storeInfo?.paymentMethods?.map((method) => (
                      <div key={method} className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value={method} id={method} />
                        <Label htmlFor={method} className="cursor-pointer">
                          {method === 'cash' && 'Dinheiro'}
                          {method === 'credit' && 'Cartão de Crédito'}
                          {method === 'debit' && 'Cartão de Débito'}
                          {method === 'pix' && 'PIX'}
                          {method === 'transfer' && 'Transferência Bancária'}
                        </Label>
                      </div>
                    )) || (
                      <>
                        <div className="flex items-center space-x-2 p-3 border rounded-lg">
                          <RadioGroupItem value="cash" id="cash" />
                          <Label htmlFor="cash" className="cursor-pointer">Dinheiro</Label>
                        </div>
                        <div className="flex items-center space-x-2 p-3 border rounded-lg">
                          <RadioGroupItem value="credit" id="credit" />
                          <Label htmlFor="credit" className="cursor-pointer">Cartão de Crédito</Label>
                        </div>
                        <div className="flex items-center space-x-2 p-3 border rounded-lg">
                          <RadioGroupItem value="pix" id="pix" />
                          <Label htmlFor="pix" className="cursor-pointer">PIX</Label>
                        </div>
                      </>
                    )}
                  </RadioGroup>
                </div>

                {/* Card Details */}
                {(paymentMethod === 'credit' || paymentMethod === 'debit') && (
                  <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                    <div>
                      <Label htmlFor="cardNumber">Número do Cartão</Label>
                      <Input
                        id="cardNumber"
                        value={paymentDetails.cardNumber}
                        onChange={(e) => setPaymentDetails(prev => ({ ...prev, cardNumber: e.target.value }))}
                        placeholder="1234 5678 9012 3456"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cardName">Nome no Cartão</Label>
                      <Input
                        id="cardName"
                        value={paymentDetails.cardName}
                        onChange={(e) => setPaymentDetails(prev => ({ ...prev, cardName: e.target.value }))}
                        placeholder="Nome como aparece no cartão"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiryDate">Validade</Label>
                        <Input
                          id="expiryDate"
                          value={paymentDetails.expiryDate}
                          onChange={(e) => setPaymentDetails(prev => ({ ...prev, expiryDate: e.target.value }))}
                          placeholder="MM/AA"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          value={paymentDetails.cvv}
                          onChange={(e) => setPaymentDetails(prev => ({ ...prev, cvv: e.target.value }))}
                          placeholder="123"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Order Review */}
          {step === 'review' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revisão do Pedido</CardTitle>
                  <CardDescription>
                    Verifique suas informações antes de finalizar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Endereço de Entrega:</h4>
                      <p className="text-sm text-gray-600">
                        {shippingInfo.fullName}<br />
                        {shippingInfo.address}, {shippingInfo.number}<br />
                        {shippingInfo.neighborhood && `${shippingInfo.neighborhood}, `}
                        {shippingInfo.city} - {shippingInfo.state}<br />
                        CEP: {shippingInfo.zipCode}
                      </p>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Método de Pagamento:</h4>
                      <p className="text-sm text-gray-600">
                        {paymentMethod === 'cash' && 'Dinheiro'}
                        {paymentMethod === 'credit' && 'Cartão de Crédito'}
                        {paymentMethod === 'debit' && 'Cartão de Débito'}
                        {paymentMethod === 'pix' && 'PIX'}
                        {paymentMethod === 'transfer' && 'Transferência Bancária'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Itens do Pedido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-gray-600">Quantidade: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatPrice(item.subtotal)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.name} (x{item.quantity})</span>
                    <span>{formatPrice(item.subtotal)}</span>
                  </div>
                ))}
                
                <Separator />
                
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(getCartTotal())}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Entrega</span>
                  <span>{formatPrice(shippingCost)}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {step !== 'shipping' && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (step === 'payment') setStep('shipping');
                      else if (step === 'review') setStep('payment');
                    }}
                    className="w-full"
                  >
                    Voltar
                  </Button>
                )}

                <Button
                  onClick={handleNextStep}
                  disabled={isProcessing}
                  className="w-full"
                >
                  {isProcessing ? 'Processando...' :
                   step === 'shipping' ? 'Continuar para Pagamento' :
                   step === 'payment' ? 'Revisar Pedido' :
                   'Finalizar Pedido'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
