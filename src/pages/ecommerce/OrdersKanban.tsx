import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { EcommerceService, OrderKanban } from '@/services/ecommerceService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  Clock,
  PackageCheck,
  Truck,
  XCircle,
  RefreshCcw,
  Search,
  Filter,
  Calendar,
  User
} from 'lucide-react';
import EcommerceDashboardLayout from '@/components/ecommerce/EcommerceDashboardLayout';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

// Componente KanbanColumn
interface KanbanColumnProps {
  title: string;
  status: OrderKanban['status'];
  orders: OrderKanban[];
  icon: React.ReactNode;
  color: string;
  onMoveOrder: (order: OrderKanban, newStatus: OrderKanban['status']) => void;
  count: number;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ 
  title, 
  status, 
  orders, 
  icon, 
  color,
  onMoveOrder,
  count
}) => {
  return (
    <div className="flex flex-col h-full min-w-[320px] max-w-[350px] bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 snap-start">
      <div className="flex items-center p-4 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50/80 rounded-t-2xl">
        <div className={`w-11 h-11 rounded-full flex items-center justify-center ${color} shadow-sm ring-2 ring-white`}>
          {icon}
        </div>
        <div className="ml-3">
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-xs text-gray-500">Total: {count}</p>
        </div>
        <Badge variant="outline" className="ml-auto font-medium px-2.5 py-0.5 rounded-full border-2">
          {count}
        </Badge>
      </div>

      <div className="space-y-3 overflow-y-auto p-4 flex-grow bg-gray-50/50" 
        style={{ 
          minHeight: "calc(100vh - 290px)",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.02'%3E%3Cpath opacity='.5' d='M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z'/%3E%3Cpath d='M6 5V0H5v5H0v1h5v94h1V6h94V5H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          borderRadius: "0 0 1rem 1rem"
        }}
      >
        {orders.length === 0 ? (
          <div className="text-center py-10 px-4">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <AlertCircle className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-400 font-medium">Nenhum pedido</p>
            <p className="text-xs text-gray-400 mt-1">Os pedidos aparecerão aqui</p>
          </div>
        ) : (
          orders.map(order => (
            <OrderCard 
              key={order.id} 
              order={order} 
              onMoveOrder={onMoveOrder} 
              currentStatus={status}
            />
          ))
        )}
      </div>
    </div>
  );
};

// Componente OrderCard
interface OrderCardProps {
  order: OrderKanban;
  currentStatus: OrderKanban['status'];
  onMoveOrder: (order: OrderKanban, newStatus: OrderKanban['status']) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, currentStatus, onMoveOrder }) => {
  const nextStatus: Record<OrderKanban['status'], OrderKanban['status'] | null> = {
    'entrada': 'preparando',
    'preparando': 'saiu_para_entrega',
    'saiu_para_entrega': null,
    'cancelado': null,
    'pendente': 'entrada'
  };

  const statusToLabel: Record<OrderKanban['status'], string> = {
    'entrada': 'Entrada',
    'preparando': 'Preparando',
    'saiu_para_entrega': 'Saiu para Entrega',
    'cancelado': 'Cancelado',
    'pendente': 'Pendente'
  };

  const statusColors: Record<OrderKanban['status'], string> = {
    'entrada': 'bg-blue-100 text-blue-700',
    'preparando': 'bg-amber-100 text-amber-700',
    'saiu_para_entrega': 'bg-green-100 text-green-700',
    'cancelado': 'bg-red-100 text-red-700',
    'pendente': 'bg-orange-100 text-orange-700'
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit', 
      minute: '2-digit' 
    }).format(date);
  };
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const timeSince = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 86400;
    if (interval > 1) {
      return Math.floor(interval) + "d atrás";
    }
    interval = seconds / 3600;
    if (interval > 1) {
      return Math.floor(interval) + "h atrás";
    }
    interval = seconds / 60;
    if (interval > 1) {
      return Math.floor(interval) + "m atrás";
    }
    return "agora";
  };

  return (
    <Card className="bg-white backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden">
      <CardHeader className="p-4 pb-3 space-y-1 bg-gradient-to-r from-white to-gray-50/70">
        <div className="flex justify-between items-start">
          <Badge className={`${statusColors[currentStatus]} text-xs font-medium rounded-full px-2.5 py-0.5 shadow-sm border border-white/50`}>
            {statusToLabel[currentStatus]}
          </Badge>
          <div className="text-xs text-gray-500 flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {timeSince(order.created_at)}
          </div>
        </div>
        <CardTitle className="text-base font-semibold mt-1">{order.product_name}</CardTitle>
        <CardDescription className="text-xs flex items-center">
          ID: #{order.id.substring(0, 8)}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 pb-3">
        <div className="flex items-center mt-2">
          <Avatar className="h-9 w-9 border border-gray-100 ring-2 ring-offset-2 ring-gray-100/50">
            <AvatarFallback className="bg-blue-50 text-blue-600 text-xs font-medium">
              {getInitials(order.seller_name)}
            </AvatarFallback>
          </Avatar>
          <div className="ml-2.5">
            <div className="text-sm font-medium">{order.seller_name}</div>
            <div className="text-xs text-gray-500 flex items-center">
              <User className="w-3 h-3 mr-1" /> Vendedor
            </div>
          </div>
        </div>
        
        {order.notes && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500 mb-1">Observações:</div>
            <div className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-100/80">
              {order.notes}
            </div>
          </div>
        )}
        
        <div className="mt-3 text-xs text-gray-500 flex items-center">
          <Calendar className="w-3 h-3 mr-1" />
          {formatDate(order.created_at)}
        </div>
      </CardContent>
      <CardFooter className="p-3 pt-0 flex gap-2">
        {nextStatus[currentStatus] && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-xs font-medium border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-all duration-200 shadow-sm"
            onClick={() => onMoveOrder(order, nextStatus[currentStatus]!)}
          >
            {currentStatus === 'entrada' && <PackageCheck className="w-3.5 h-3.5 mr-1.5" />}
            {currentStatus === 'preparando' && <Truck className="w-3.5 h-3.5 mr-1.5" />}
            {currentStatus === 'pendente' && <Clock className="w-3.5 h-3.5 mr-1.5" />}
            Mover para {statusToLabel[nextStatus[currentStatus]!]}
          </Button>
        )}

        {currentStatus !== 'cancelado' && currentStatus !== 'saiu_para_entrega' && (
          <Button 
            variant="outline" 
            size="sm" 
            className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200 rounded-lg transition-all duration-200 shadow-sm"
            onClick={() => onMoveOrder(order, 'cancelado')}
          >
            <XCircle className="w-3.5 h-3.5" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

// Filtro de pesquisa
interface SearchFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
}

const SearchFilter: React.FC<SearchFilterProps> = ({ searchTerm, onSearchChange, onRefresh }) => {
  return (
    <div className="flex flex-col md:flex-row gap-3 md:items-center mb-5">
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-fiscal-green-600" />
        <Input 
          placeholder="Buscar pedidos por nome ou ID..." 
          className="pl-10 bg-white/90 backdrop-blur-sm rounded-xl border-gray-200 focus-visible:ring-fiscal-green-500 shadow-sm transition-all duration-200 hover:border-fiscal-green-300" 
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border-gray-200 hover:bg-fiscal-green-50 hover:border-fiscal-green-200 rounded-xl transition-all duration-200 shadow-sm"
        >
          <Filter className="h-4 w-4 text-fiscal-green-600" />
          <span>Filtrar</span>
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border-gray-200 hover:bg-fiscal-green-50 hover:border-fiscal-green-200 rounded-xl transition-all duration-200 shadow-sm"
          onClick={onRefresh}
        >
          <RefreshCcw className="h-4 w-4 text-fiscal-green-600" />
          <span>Atualizar</span>
        </Button>
      </div>
    </div>
  );
};

// Resumo de pedidos
interface OrderSummaryProps {
  counts: {
    entrada: number;
    preparando: number;
    saiu_para_entrega: number;
    pendente: number;
    cancelado: number;
    total: number;
  }
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ counts }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
      <Card className="bg-white/95 backdrop-blur-sm border-0 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Total de pedidos</p>
            <p className="text-2xl font-bold">{counts.total}</p>
          </div>
          <div className="bg-gray-100 p-3 rounded-full shadow-sm ring-2 ring-white">
            <PackageCheck className="h-5 w-5 text-gray-600" />
          </div>
        </CardContent>
      </Card>
      <Card className="bg-white/95 backdrop-blur-sm border-0 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Entrada</p>
            <p className="text-2xl font-bold text-blue-600">{counts.entrada}</p>
          </div>
          <div className="bg-blue-100 p-3 rounded-full shadow-sm ring-2 ring-white">
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
        </CardContent>
      </Card>
      <Card className="bg-white/95 backdrop-blur-sm border-0 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Preparando</p>
            <p className="text-2xl font-bold text-yellow-600">{counts.preparando}</p>
          </div>
          <div className="bg-yellow-100 p-3 rounded-full shadow-sm ring-2 ring-white">
            <PackageCheck className="h-5 w-5 text-yellow-600" />
          </div>
        </CardContent>
      </Card>
      <Card className="bg-white/95 backdrop-blur-sm border-0 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Em entrega</p>
            <p className="text-2xl font-bold text-green-600">{counts.saiu_para_entrega}</p>
          </div>
          <div className="bg-green-100 p-3 rounded-full shadow-sm ring-2 ring-white">
            <Truck className="h-5 w-5 text-green-600" />
          </div>
        </CardContent>
      </Card>
      <Card className="bg-white/95 backdrop-blur-sm border-0 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Cancelados</p>
            <p className="text-2xl font-bold text-red-600">{counts.cancelado}</p>
          </div>
          <div className="bg-red-100 p-3 rounded-full shadow-sm ring-2 ring-white">
            <XCircle className="h-5 w-5 text-red-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Componente principal: OrdersKanban
const OrdersKanban: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<OrderKanban[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  
  const fetchOrders = async () => {
    setLoading(true);
    try {
      if (user?.id) {
        const fetchedOrders = await EcommerceService.getOrdersKanban(user.id);
        setOrders(fetchedOrders);
        toast({
          title: "Atualizado",
          description: "Pedidos carregados com sucesso.",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os pedidos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchOrders();
    // Configurar um intervalo para atualizar os pedidos periodicamente
    const intervalId = setInterval(fetchOrders, 60000); // Atualiza a cada 60 segundos
    
    return () => clearInterval(intervalId);
  }, [user]);
  
  const handleMoveOrder = async (order: OrderKanban, newStatus: OrderKanban['status']) => {
    try {
      const success = await EcommerceService.updateOrderKanbanStatus(order.id, newStatus);
      if (success) {
        toast({
          title: "Status Atualizado",
          description: `Pedido movido para ${newStatus}.`
        });
        // Atualiza o estado local para refletir a mudança imediatamente
        setOrders(prev => 
          prev.map(o => o.id === order.id ? { ...o, status: newStatus } : o)
        );
      } else {
        throw new Error("Falha ao atualizar status");
      }
    } catch (error) {
      console.error("Erro ao mover pedido:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do pedido.",
        variant: "destructive"
      });
    }
  };

  // Filtrar pedidos pela busca
  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      order.product_name.toLowerCase().includes(searchLower) ||
      order.seller_name.toLowerCase().includes(searchLower) ||
      order.id.toLowerCase().includes(searchLower) ||
      (order.notes && order.notes.toLowerCase().includes(searchLower))
    );
  });
  
  // Filtrar pedidos por status
  const entradaOrders = filteredOrders.filter(order => order.status === 'entrada');
  const preparandoOrders = filteredOrders.filter(order => order.status === 'preparando');
  const saiuParaEntregaOrders = filteredOrders.filter(order => order.status === 'saiu_para_entrega');
  const canceladoOrders = filteredOrders.filter(order => order.status === 'cancelado');
  const pendenteOrders = filteredOrders.filter(order => order.status === 'pendente');

  const orderCounts = {
    entrada: entradaOrders.length,
    preparando: preparandoOrders.length,
    saiu_para_entrega: saiuParaEntregaOrders.length,
    pendente: pendenteOrders.length,
    cancelado: canceladoOrders.length,
    total: filteredOrders.length
  };

  return (
    <EcommerceDashboardLayout>
      <div className="container py-6 max-w-[1600px]">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">Kanban de Pedidos</h1>
            <p className="text-gray-500">Gerencie seus pedidos de forma visual</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Tabs defaultValue="kanban" className="w-[240px]" onValueChange={(v) => setViewMode(v as 'kanban' | 'list')}>
              <TabsList className="bg-white border rounded-xl">
                <TabsTrigger value="kanban" className="data-[state=active]:bg-fiscal-green-50 data-[state=active]:text-fiscal-green-700 rounded-l-lg">Kanban</TabsTrigger>
                <TabsTrigger value="list" className="data-[state=active]:bg-fiscal-green-50 data-[state=active]:text-fiscal-green-700 rounded-r-lg">Lista</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Button 
              onClick={fetchOrders} 
              variant="default" 
              className="bg-fiscal-green-600 hover:bg-fiscal-green-700 text-white rounded-xl transition-colors duration-200"
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>
        
        <OrderSummary counts={orderCounts} />
        
        <SearchFilter 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onRefresh={fetchOrders}
        />
        
        <Separator className="my-6" />
        
        {loading ? (
          <div className="flex items-center justify-center py-20 bg-white rounded-xl shadow-sm">
            <div className="flex flex-col items-center">
              <div className="animate-spin w-10 h-10 border-4 border-fiscal-green-600/20 border-t-fiscal-green-600 rounded-full mb-4"></div>
              <p className="text-gray-600 font-medium">Carregando pedidos...</p>
              <p className="text-sm text-gray-500">Aguarde enquanto buscamos os dados</p>
            </div>
          </div>
        ) : (
          <div className="flex overflow-x-auto gap-4 pb-8 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-fiscal-green-300/50 scrollbar-track-transparent px-1 py-2" style={{ minHeight: "calc(100vh - 380px)" }}>
            <KanbanColumn
              title="Entrada"
              status="entrada"
              orders={entradaOrders}
              icon={<Clock className="w-5 h-5 text-blue-600" />}
              color="bg-blue-100"
              onMoveOrder={handleMoveOrder}
              count={entradaOrders.length}
            />
            <KanbanColumn
              title="Preparando"
              status="preparando"
              orders={preparandoOrders}
              icon={<PackageCheck className="w-5 h-5 text-yellow-600" />}
              color="bg-yellow-100"
              onMoveOrder={handleMoveOrder}
              count={preparandoOrders.length}
            />
            <KanbanColumn
              title="Saiu para Entrega"
              status="saiu_para_entrega"
              orders={saiuParaEntregaOrders}
              icon={<Truck className="w-5 h-5 text-green-600" />}
              color="bg-green-100"
              onMoveOrder={handleMoveOrder}
              count={saiuParaEntregaOrders.length}
            />
            <KanbanColumn
              title="Pendente"
              status="pendente"
              orders={pendenteOrders}
              icon={<AlertCircle className="w-5 h-5 text-orange-600" />}
              color="bg-orange-100"
              onMoveOrder={handleMoveOrder}
              count={pendenteOrders.length}
            />
            <KanbanColumn
              title="Cancelado"
              status="cancelado"
              orders={canceladoOrders}
              icon={<XCircle className="w-5 h-5 text-red-600" />}
              color="bg-red-100"
              onMoveOrder={handleMoveOrder}
              count={canceladoOrders.length}
            />
          </div>
        )}
      </div>
    </EcommerceDashboardLayout>
  );
};

export default OrdersKanban; 