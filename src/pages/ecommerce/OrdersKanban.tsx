
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
  User,
  Factory
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
          minHeight: "calc(100vh - 290px)"
        }}>
        {orders.map((order) => (
          <Card key={order.id} className="cursor-move hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500 bg-white">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium">{order.product_name}</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  #{order.id.slice(-6)}
                </Badge>
              </div>
              <CardDescription className="text-xs flex items-center">
                <User className="h-3 w-3 mr-1" />
                {order.customer_name}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 pb-2">
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Vendedor:</span>
                  <span className="font-medium">{order.seller_name}</span>
                </div>
                {order.total_amount && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Valor:</span>
                    <span className="font-medium text-green-600">
                      R$ {order.total_amount.toFixed(2)}
                    </span>
                  </div>
                )}
                {order.notes && (
                  <div className="text-gray-600 text-xs bg-gray-50 p-2 rounded">
                    {order.notes}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="pt-0 pb-3">
              <div className="flex justify-between items-center w-full">
                <span className="text-xs text-gray-500">
                  {new Date(order.created_at).toLocaleDateString()}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const nextStatus = statusFlow[order.status];
                    if (nextStatus) {
                      onMoveOrder(order, nextStatus);
                    }
                  }}
                  className="h-6 px-2 text-xs"
                >
                  Avançar
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Mapeamento de status para próximo status
const statusFlow: Record<OrderKanban['status'], OrderKanban['status'] | null> = {
  entrada: 'preparando',
  preparando: 'saiu_para_entrega',
  saiu_para_entrega: null,
  cancelado: null,
  pendente: 'entrada',
  producao: 'preparando'
};

// Configuração das colunas do Kanban
const statusLabels: Record<OrderKanban['status'], string> = {
  entrada: 'Entrada',
  preparando: 'Preparando',
  saiu_para_entrega: 'Saiu para Entrega',
  cancelado: 'Cancelado',
  pendente: 'Pendente',
  producao: 'Produção'
};

const statusColors: Record<OrderKanban['status'], string> = {
  entrada: 'bg-blue-100 text-blue-700',
  preparando: 'bg-yellow-100 text-yellow-700',
  saiu_para_entrega: 'bg-green-100 text-green-700',
  cancelado: 'bg-red-100 text-red-700',
  pendente: 'bg-gray-100 text-gray-700',
  producao: 'bg-purple-100 text-purple-700'
};

const statusIcons: Record<OrderKanban['status'], React.ReactNode> = {
  entrada: <AlertCircle className="h-5 w-5 text-blue-600" />,
  preparando: <Clock className="h-5 w-5 text-yellow-600" />,
  saiu_para_entrega: <Truck className="h-5 w-5 text-green-600" />,
  cancelado: <XCircle className="h-5 w-5 text-red-600" />,
  pendente: <PackageCheck className="h-5 w-5 text-gray-600" />,
  producao: <Factory className="h-5 w-5 text-purple-600" />
};

const OrdersKanban: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<OrderKanban[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<OrderKanban['status'] | 'all'>('all');

  useEffect(() => {
    if (user?.id) {
      loadOrders();
    }
  }, [user?.id]);

  const loadOrders = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      const fetchedOrders = await EcommerceService.getOrdersKanban(user.id);
      setOrders(fetchedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: "Erro ao carregar pedidos",
        description: "Não foi possível carregar os pedidos. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoveOrder = async (order: OrderKanban, newStatus: OrderKanban['status']) => {
    try {
      await EcommerceService.updateOrderKanbanStatus(order.id, newStatus);
      setOrders(prevOrders =>
        prevOrders.map(o =>
          o.id === order.id ? { ...o, status: newStatus } : o
        )
      );
      
      toast({
        title: "Status atualizado",
        description: `Pedido movido para ${statusLabels[newStatus]}`
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status do pedido.",
        variant: "destructive"
      });
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.seller_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getOrdersByStatus = (status: OrderKanban['status']) => {
    return filteredOrders.filter(order => order.status === status);
  };

  const statusList: OrderKanban['status'][] = ['entrada', 'preparando', 'producao', 'saiu_para_entrega', 'cancelado', 'pendente'];

  if (isLoading) {
    return (
      <EcommerceDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Carregando pedidos...</p>
          </div>
        </div>
      </EcommerceDashboardLayout>
    );
  }

  return (
    <EcommerceDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Kanban de Pedidos</h1>
            <p className="text-muted-foreground">
              Gerencie o fluxo dos seus pedidos
            </p>
          </div>
          <Button onClick={loadOrders} variant="outline">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por produto, cliente ou vendedor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as OrderKanban['status'] | 'all')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos os Status</option>
                  {statusList.map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kanban Board */}
        <div className="overflow-x-auto">
          <div className="flex gap-6 pb-4" style={{ minWidth: 'fit-content' }}>
            {statusList.map((status) => {
              const statusOrders = getOrdersByStatus(status);
              return (
                <KanbanColumn
                  key={status}
                  title={statusLabels[status]}
                  status={status}
                  orders={statusOrders}
                  icon={statusIcons[status]}
                  color={statusColors[status]}
                  onMoveOrder={handleMoveOrder}
                  count={statusOrders.length}
                />
              );
            })}
          </div>
        </div>

        {filteredOrders.length === 0 && !isLoading && (
          <Card>
            <CardContent className="text-center py-12">
              <PackageCheck className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Nenhum pedido encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedStatus !== 'all' 
                  ? "Tente ajustar os filtros para encontrar pedidos."
                  : "Quando houver pedidos, eles aparecerão aqui."
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </EcommerceDashboardLayout>
  );
};

export default OrdersKanban;
