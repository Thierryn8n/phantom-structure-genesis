import React, { useState, useEffect } from 'react';
import EcommerceDashboardLayout from '@/components/ecommerce/EcommerceDashboardLayout';
import { 
  ArrowUpRight, ShoppingBag, Users, FileText, DollarSign, Settings, 
  Package, Clock, TrendingUp, UserPlus, MoreHorizontal, AlertTriangle, 
  BarChart3, LineChart, ArrowUp, ArrowDown, Percent, CreditCard, ChevronRight,
  CalendarClock, TrendingDown, ShoppingCart, Truck, Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart as LChart, 
  Line, PieChart, Pie, Cell, Legend, Area, AreaChart, RadialBarChart, RadialBar
} from 'recharts';
import { Link } from 'react-router-dom';
import { EcommerceService, DashboardOverviewData } from '@/services/ecommerceService';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Cores personalizadas para gráficos
const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  light: '#f3f4f6',
  dark: '#374151',
  primaryLight: '#93c5fd',
  secondaryLight: '#c4b5fd',
  successLight: '#6ee7b7',
  warningLight: '#fcd34d',
  dangerLight: '#fca5a5',
  infoLight: '#67e8f9'
};

// Array de cores para gráficos de pizza e barras
const COLORS = [CHART_COLORS.primary, CHART_COLORS.success, CHART_COLORS.warning, CHART_COLORS.info, CHART_COLORS.secondary];

// Mock data - substituir com chamadas de API reais
const mockOverviewData: DashboardOverviewData = {
  totalRevenue: 12530.50,
  revenueToday: 850.75,
  revenueYesterday: 720.00,
  pendingOrdersCount: 12,
  newEntriesCount: 3,
  totalActiveProducts: 156,
  newCustomersToday: 5,
  recentOrders: [
    { id: 'ORD001', customer_name: 'João Silva', created_at: '2024-07-27T10:30:00Z', total_amount: 150.00, status: 'preparando', product_name: 'Produto A' },
    { id: 'ORD002', customer_name: 'Maria Oliveira', created_at: '2024-07-27T09:15:00Z', total_amount: 75.50, status: 'entrada', product_name: 'Produto B' },
    { id: 'ORD003', customer_name: 'Carlos Pereira', created_at: '2024-07-26T18:00:00Z', total_amount: 220.00, status: 'saiu_para_entrega', product_name: 'Produto C' },
    { id: 'ORD004', customer_name: 'Ana Costa', created_at: '2024-07-26T15:30:00Z', total_amount: 99.90, status: 'cancelado', product_name: 'Produto D' },
    { id: 'ORD005', customer_name: 'Pedro Martins', created_at: '2024-07-26T12:00:00Z', total_amount: 300.00, status: 'pendente', product_name: 'Produto E' },
  ],
  salesLast7Days: [
    { name: 'Dom', sales: 600 }, { name: 'Seg', sales: 900 }, { name: 'Ter', sales: 750 }, 
    { name: 'Qua', sales: 1100 }, { name: 'Qui', sales: 800 }, { name: 'Sex', sales: 1200 },
    { name: 'Sáb', sales: 850 },
  ],
  topProducts: [
    { name: 'Produto Estrela A', sales: 120, revenue: 12000 },
    { name: 'Produto Popular B', sales: 95, revenue: 9500 },
    { name: 'Produto Mais Vendido C', sales: 80, revenue: 8000 },
  ]
};

const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'entrada': return 'default';
    case 'preparando': return 'secondary';
    case 'saiu_para_entrega': return 'default';
    case 'cancelado': return 'destructive';
    case 'pendente': return 'outline';
    default: return 'default';
  }
};
const getStatusLabel = (status: string): string => {
  const labels: { [key: string]: string } = {
    entrada: 'Entrada',
    preparando: 'Preparando',
    saiu_para_entrega: 'Em Entrega',
    cancelado: 'Cancelado',
    pendente: 'Pendente',
  };
  return labels[status] || 'Desconhecido';
};

// Componente melhorado para cards de métricas
const MetricCard: React.FC<{ 
  title: string; 
  value: string | number; 
  comparison?: { 
    value: string | number; 
    trend: 'up' | 'down' | 'neutral'; 
    label: string;
  }; 
  icon: React.ReactNode; 
  colorClass: string; 
  isLoading: boolean; 
  linkTo?: string;
  bgColor?: string;
  iconBgColor?: string;
}> = ({ 
  title, 
  value, 
  comparison, 
  icon, 
  colorClass, 
  isLoading, 
  linkTo,
  bgColor = 'bg-white',
  iconBgColor,
}) => {
  
  // Formatar valores numéricos como moeda quando apropriado
  const formattedValue = typeof value === 'number' && title.toLowerCase().includes('vendas') 
    ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
    : value;
    
  const IconWrapper = () => (
    <div className={`p-3 rounded-full ${iconBgColor || `bg-${colorClass.split('-')[0]}-100`} text-${colorClass}`}>
      {icon}
    </div>
  );

  const ValueDisplay = () => (
    <div className="ml-4 flex-1">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <h3 className="text-2xl font-bold mt-1">
        {isLoading ? <Skeleton className="h-8 w-24" /> : formattedValue}
      </h3>
    </div>
  );

  const ComparisonDisplay = () => {
    if (!comparison) return null;
    
    const getTrendIcon = () => {
      if (comparison.trend === 'up') {
        return <ArrowUp size={14} className="mr-0.5 text-green-600" />;
      } else if (comparison.trend === 'down') {
        return <ArrowDown size={14} className="mr-0.5 text-red-600" />;
      }
      return null;
    };

    const getTextColor = () => {
      if (comparison.trend === 'up') return 'text-green-600';
      if (comparison.trend === 'down') return 'text-red-600';
      return 'text-gray-500';
    };

    return (
      <div className={`mt-3 text-xs flex items-center ${getTextColor()}`}>
        {getTrendIcon()}
        <span>{comparison.value} {comparison.label}</span>
      </div>
    );
  };

  const cardContent = (
    <Card className={`rounded-xl border-none shadow-sm hover:shadow-md transition-shadow ${bgColor}`}>
      <CardContent className="p-5">
        <div className="flex items-start">
          <IconWrapper />
          <ValueDisplay />
          {linkTo && (
            <Link to={linkTo} className="self-start text-xs text-gray-400 hover:text-gray-600">
              <ArrowUpRight size={16} />
            </Link>
          )}
        </div>
        <ComparisonDisplay />
      </CardContent>
    </Card>
  );
  
  return cardContent;
};

const EcommerceDashboard: React.FC = () => {
  const [overviewData, setOverviewData] = useState<DashboardOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchDashboardData = async () => {
    if (!user?.id) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para visualizar o dashboard.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const data = await EcommerceService.getDashboardOverviewData(user.id);
      setOverviewData(data);
      console.log("Dados do dashboard carregados:", data);
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar as métricas do dashboard. Tente novamente mais tarde.",
        variant: "destructive"
      });
      // Usar dados de fallback para não quebrar a UI
      setOverviewData(mockOverviewData);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?.id]);

  // Calcular o percentual de mudança para receita de hoje vs ontem
  const revenueChangePercent = overviewData && overviewData.revenueYesterday > 0 
    ? Math.round(((overviewData.revenueToday - overviewData.revenueYesterday) / overviewData.revenueYesterday) * 100)
    : 0;
    
  // Determinar a tendência (up/down) com base nos dados
  const revenueTrend = revenueChangePercent > 0 ? 'up' : revenueChangePercent < 0 ? 'down' : 'neutral';

  // Preparar dados para o gráfico de distribuição de vendas por status
  const prepareOrderStatusData = () => {
    if (!overviewData?.recentOrders?.length) return [];
    
    const statusCounts: Record<string, number> = {};
    overviewData.recentOrders.forEach(order => {
      const status = getStatusLabel(order.status);
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  };
  
  const orderStatusData = prepareOrderStatusData();

  // Converter dados de vendas para gráfico acumulativo
  const cumulativeSalesData = overviewData?.salesLast7Days.map((day, index, array) => {
    const accumulated = array
      .slice(0, index + 1)
      .reduce((total, current) => total + current.sales, 0);
      
    return {
      name: day.name,
      sales: day.sales,
      accumulated
    };
  });

  return (
    <EcommerceDashboardLayout>
      <div className="space-y-8 p-4 md:p-6 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2UyZThmMCIgb3BhY2l0eT0iMC40IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] min-h-screen rounded-[20px] shadow-sm">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Visão Geral da Loja</h1>
              <p className="text-gray-500 mt-1">
                Acompanhe as métricas chave e atividades recentes da sua loja.
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={fetchDashboardData}
                className="bg-white hover:bg-yellow-50 border border-gray-300 text-gray-700 hover:text-yellow-600 hover:border-yellow-300 transition-all rounded-xl"
              >
                <TrendingUp size={16} className="mr-2" />
                Atualizar Dados
              </Button>
            </div>
          </div>
          
          <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
            <div className="overflow-x-auto pb-2">
              <TabsList className="inline-flex bg-white border border-gray-300 p-1 rounded-[20px] shadow-sm mb-6 w-auto">
                <TabsTrigger 
                  value="overview" 
                  className="data-[state=active]:bg-yellow-50 data-[state=active]:text-yellow-600 data-[state=active]:shadow-sm data-[state=active]:font-medium data-[state=active]:border data-[state=active]:border-yellow-200 text-sm px-4 py-2 rounded-xl transition-all border border-transparent hover:border-gray-200"
                >
                  Visão Geral
                </TabsTrigger>
                <TabsTrigger 
                  value="sales" 
                  className="data-[state=active]:bg-yellow-50 data-[state=active]:text-yellow-600 data-[state=active]:shadow-sm data-[state=active]:font-medium data-[state=active]:border data-[state=active]:border-yellow-200 text-sm px-4 py-2 rounded-xl transition-all border border-transparent hover:border-gray-200"
                >
                  Vendas
                </TabsTrigger>
                <TabsTrigger 
                  value="products" 
                  className="data-[state=active]:bg-yellow-50 data-[state=active]:text-yellow-600 data-[state=active]:shadow-sm data-[state=active]:font-medium data-[state=active]:border data-[state=active]:border-yellow-200 text-sm px-4 py-2 rounded-xl transition-all border border-transparent hover:border-gray-200"
                >
                  Produtos
                </TabsTrigger>
              </TabsList>
          </div>
          
            <TabsContent value="overview" className="space-y-6">
              {/* Cards de métricas principais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <MetricCard 
                  title="Vendas Hoje" 
                  value={overviewData?.revenueToday ?? 0} 
                  comparison={{ 
                    value: Math.abs(revenueChangePercent), 
                    trend: revenueTrend, 
                    label: "vs. ontem" 
                  }}
                  icon={<DollarSign size={22} />} 
                  colorClass="green-600"
                  isLoading={isLoading}
                  linkTo="/ecommerce/orders?filter=today"
                  iconBgColor="bg-green-100"
                />
                <MetricCard 
                  title="Pedidos Pendentes" 
                  value={overviewData?.pendingOrdersCount ?? 0} 
                  comparison={{ 
                    value: overviewData?.newEntriesCount || 0, 
                    trend: 'up', 
                    label: "novas entradas" 
                  }}
                  icon={<ShoppingCart size={22} />} 
                  colorClass="blue-600"
                  isLoading={isLoading}
                  linkTo="/ecommerce/orders"
                  iconBgColor="bg-blue-100"
                />
                <MetricCard 
                  title="Total de Produtos" 
                  value={overviewData?.totalActiveProducts ?? 0} 
                  comparison={{ 
                    value: "ativos", 
                    trend: "neutral", 
                    label: "na loja" 
                  }}
                  icon={<Package size={22} />} 
                  colorClass="purple-600"
                  isLoading={isLoading}
                  linkTo="/ecommerce/products"
                  iconBgColor="bg-purple-100"
                />
                <MetricCard 
                  title="Novos Clientes" 
                  value={overviewData?.newCustomersToday ?? 0} 
                  comparison={{ 
                    value: "hoje", 
                    trend: "neutral", 
                    label: "registrados" 
                  }}
                  icon={<UserPlus size={22} />} 
                  colorClass="amber-600"
                  isLoading={isLoading}
                  linkTo="/ecommerce/customers"
                  iconBgColor="bg-amber-100"
                />
              </div>

              {/* Gráficos principais e tabelas */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Gráfico de vendas dos últimos 7 dias */}
                <Card className="lg:col-span-2 shadow-sm hover:shadow-md transition-shadow border-none rounded-[20px] bg-white">
                  <CardHeader className="bg-gray-50/50 border-b border-gray-200/50 p-5">
                    <CardTitle className="flex items-center">
                      <LineChart size={20} className="mr-2 text-blue-600" />
                      Vendas nos Últimos 7 Dias
                    </CardTitle>
                    <CardDescription>Tendência de receita da última semana.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px] p-4">
                    {isLoading ? <Skeleton className="w-full h-full" /> : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={overviewData?.salesLast7Days || []}>
                          <defs>
                            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.8}/>
                              <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" fontSize={12} />
                          <YAxis 
                            fontSize={12} 
                            tickFormatter={(value) => value >= 1000 ? `R$${value/1000}k` : `R$${value}`} 
                          />
                          <Tooltip 
                            formatter={(value: number) => [`R$ ${value.toFixed(2).replace('.', ',')}`, "Vendas"]} 
                            labelFormatter={(label) => `Dia: ${label}`}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="sales" 
                            stroke={CHART_COLORS.primary} 
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#salesGradient)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Status de pedidos */}
                <Card className="shadow-sm hover:shadow-md transition-shadow border-none rounded-[20px] bg-white">
                  <CardHeader className="bg-gray-50/50 border-b border-gray-200/50 p-5">
                    <CardTitle className="flex items-center">
                      <BarChart3 size={20} className="mr-2 text-purple-600" />
                      Status dos Pedidos
                    </CardTitle>
                    <CardDescription>Distribuição atual dos pedidos.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px] p-4">
                    {isLoading ? <Skeleton className="w-full h-full" /> : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={orderStatusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {orderStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} pedidos`, 'Quantidade']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
          </div>
          
              {/* Pedidos Recentes - Tabela aprimorada */}
              <Card className="shadow-sm hover:shadow-md transition-shadow border-none rounded-[20px] bg-white">
                <CardHeader className="flex flex-row items-center justify-between p-5 bg-gray-50/50 border-b border-gray-200/50">
              <div>
                    <CardTitle className="flex items-center">
                      <Clock size={20} className="mr-2 text-gray-700" />
                      Pedidos Recentes
                    </CardTitle>
                    <CardDescription>Acompanhe os últimos pedidos realizados na sua loja.</CardDescription>
              </div>
                  <Link to="/ecommerce/orders" className="text-sm text-blue-600 hover:underline font-medium flex items-center hover:text-blue-700 transition-colors">
                    Ver todos <ChevronRight size={16} />
                  </Link>
                </CardHeader>
                <CardContent className="p-5">
                  {isLoading ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-gray-50/70">
                            <TableHead className="w-[100px] font-medium">Pedido ID</TableHead>
                            <TableHead className="font-medium">Cliente</TableHead>
                            <TableHead className="font-medium">Data</TableHead>
                            <TableHead className="font-medium">Status</TableHead>
                            <TableHead className="text-right font-medium">Total</TableHead>
                            <TableHead className="text-right font-medium">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {overviewData?.recentOrders && overviewData.recentOrders.length > 0 ? (
                            overviewData.recentOrders.map((order) => (
                              <TableRow key={order.id} className="hover:bg-gray-50/70">
                                <TableCell className="font-medium">#{order.id.substring(0, 8)}</TableCell>
                                <TableCell>{order.customer_name}</TableCell>
                                <TableCell>
                                  {new Date(order.created_at).toLocaleString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={getStatusBadgeVariant(order.status)} className="rounded-md font-normal">
                                    {getStatusLabel(order.status)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  R$ {order.total_amount?.toFixed(2).replace('.', ',')}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Link to={`/ecommerce/orders/${order.id}`} className="text-blue-600 hover:text-blue-800">
                                    <Eye size={16} className="inline ml-2" />
                                  </Link>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-10">
                                <Package size={40} className="mx-auto text-gray-400 mb-2" />
                                <p className="font-medium text-gray-500">Nenhum pedido recente encontrado.</p>
                                <p className="text-sm text-gray-400">Os novos pedidos aparecerão aqui.</p>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
            </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="sales" className="space-y-6">
              {/* Análise de vendas detalhada */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <MetricCard 
                  title="Receita Total" 
                  value={overviewData?.totalRevenue ?? 0} 
                  comparison={{ 
                    value: "30 dias", 
                    trend: "neutral", 
                    label: "últimos" 
                  }}
                  icon={<CreditCard size={22} />} 
                  colorClass="blue-600"
                  isLoading={isLoading}
                  iconBgColor="bg-blue-100"
                />
                <MetricCard 
                  title="Venda Média" 
                  value={overviewData?.recentOrders?.length ? 
                    (overviewData.totalRevenue / overviewData.recentOrders.length) : 0} 
                  comparison={{ 
                    value: "por pedido", 
                    trend: "neutral", 
                    label: "" 
                  }}
                  icon={<DollarSign size={22} />} 
                  colorClass="green-600"
                  isLoading={isLoading}
                  iconBgColor="bg-green-100"
                />
                <MetricCard 
                  title="Taxa de Conversão" 
                  value={`${(Math.random() * 10 + 2).toFixed(1)}%`} 
                  comparison={{ 
                    value: 0.5, 
                    trend: "up", 
                    label: "vs. mês passado" 
                  }}
                  icon={<Percent size={22} />} 
                  colorClass="amber-600"
                  isLoading={isLoading}
                  iconBgColor="bg-amber-100"
                />
                <MetricCard 
                  title="Pedidos Finalizados" 
                  value={15} // Valor exemplo - substituir por dados reais
                  comparison={{ 
                    value: 3, 
                    trend: "up", 
                    label: "hoje" 
                  }}
                  icon={<Truck size={22} />} 
                  colorClass="teal-600"
                  isLoading={isLoading}
                  iconBgColor="bg-teal-100"
                />
              </div>

              {/* Gráfico de vendas acumuladas */}
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp size={20} className="mr-2 text-green-600" />
                    Vendas Acumuladas (Últimos 7 dias)
                  </CardTitle>
                  <CardDescription>Crescimento da receita acumulada ao longo da semana.</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px] p-2">
                  {isLoading ? <Skeleton className="w-full h-full" /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={cumulativeSalesData}>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.1}/>
                            <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorAccumulated" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis 
                          fontSize={12} 
                          tickFormatter={(value) => `R$${value >= 1000 ? (value/1000).toFixed(1) + 'k' : value}`} 
                        />
                        <Tooltip 
                          formatter={(value: number) => [`R$ ${value.toFixed(2).replace('.', ',')}`, ""]} 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        />
                        <Legend />
                        <Area 
                          type="monotone" 
                          name="Venda diária"
                          dataKey="sales" 
                          stroke={CHART_COLORS.success} 
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorSales)"
                        />
                        <Area 
                          type="monotone" 
                          name="Acumulado"
                          dataKey="accumulated" 
                          stroke={CHART_COLORS.primary} 
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorAccumulated)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              
              {/* Distribuição por hora do dia */}
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CalendarClock size={20} className="mr-2 text-purple-600" />
                    Pedidos por Dia da Semana
                  </CardTitle>
                  <CardDescription>Distribuição dos pedidos por dia da semana.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] p-2">
                  {isLoading ? <Skeleton className="w-full h-full" /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Dom', value: 4 },
                        { name: 'Seg', value: 7 },
                        { name: 'Ter', value: 5 },
                        { name: 'Qua', value: 6 },
                        { name: 'Qui', value: 9 },
                        { name: 'Sex', value: 12 },
                        { name: 'Sáb', value: 8 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip 
                          formatter={(value: number) => [`${value} pedidos`, "Quantidade"]} 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        />
                        <Bar 
                          dataKey="value" 
                          fill={CHART_COLORS.secondary} 
                          radius={[4, 4, 0, 0]} 
                          name="Pedidos"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="products" className="space-y-6">
              {/* Análise de produtos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top produtos por receita */}
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 size={20} className="mr-2 text-purple-600" />
                      Top Produtos por Receita
                    </CardTitle>
                    <CardDescription>Produtos que mais geraram receita nos últimos 30 dias.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px] p-2">
                    {isLoading ? <Skeleton className="w-full h-full" /> : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          layout="vertical" 
                          data={overviewData?.topProducts || []}
                          margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis type="number" tickFormatter={(value) => `R$${value >= 1000 ? (value/1000).toFixed(1) + 'k' : value}`} />
                          <YAxis type="category" dataKey="name" width={120} fontSize={12} tick={{ wordWrap: 'break-word' }} />
                          <Tooltip 
                            formatter={(value: number) => [`R$ ${value.toFixed(2).replace('.', ',')}`, "Receita"]} 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                          />
                          <Bar 
                            dataKey="revenue" 
                            fill={CHART_COLORS.success}
                            name="Receita" 
                            radius={[0, 4, 4, 0]} 
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
                
                {/* Top produtos por quantidade */}
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <ShoppingBag size={20} className="mr-2 text-blue-600" />
                      Top Produtos por Quantidade
                    </CardTitle>
                    <CardDescription>Produtos mais vendidos nos últimos 30 dias.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px] p-2">
                    {isLoading ? <Skeleton className="w-full h-full" /> : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          layout="vertical" 
                          data={overviewData?.topProducts || []}
                          margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis type="number" />
                          <YAxis type="category" dataKey="name" width={120} fontSize={12} />
                          <Tooltip 
                            formatter={(value: number) => [`${value} unidades`, "Quantidade"]} 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                          />
                          <Bar 
                            dataKey="sales" 
                            fill={CHART_COLORS.primary}
                            name="Unidades vendidas" 
                            radius={[0, 4, 4, 0]} 
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Lista detalhada dos produtos */}
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package size={20} className="mr-2 text-gray-700" />
                    Produtos Populares
                  </CardTitle>
                  <CardDescription>Desempenho detalhado por produto.</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                    </div>
                  ) : (
                    <ul className="space-y-4">
                      {overviewData?.topProducts.map((product, index) => (
                        <li key={product.name} className="flex flex-col">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-800 truncate max-w-[60%]">
                              {index + 1}. {product.name}
                            </span>
                            <span className="font-bold text-gray-900">R$ {product.revenue.toFixed(2).replace('.', ',')}</span>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <Progress value={(product.sales / (overviewData?.topProducts?.[0]?.sales || 1)) * 100} className="h-2" />
                            <span className="text-xs text-gray-500 min-w-[80px] text-right">{product.sales} unidades</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
                <CardFooter>
                  <Link to="/ecommerce/products" className="text-sm text-blue-600 hover:underline font-medium flex items-center">
                    Ver todos os produtos <ChevronRight size={16} />
                  </Link>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Ações Rápidas */}
          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Ações Rápidas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'Adicionar Produto', icon: <ShoppingBag size={20} />, link: '/ecommerce/products/new', color: 'text-green-600', bgColor: 'bg-green-50' },
                { title: 'Ver Pedidos', icon: <FileText size={20} />, link: '/ecommerce/orders', color: 'text-blue-600', bgColor: 'bg-blue-50' },
                { title: 'Gerenciar Clientes', icon: <Users size={20} />, link: '/ecommerce/customers', color: 'text-amber-600', bgColor: 'bg-amber-50' },
                { title: 'Configurações', icon: <Settings size={20} />, link: '/ecommerce/settings', color: 'text-purple-600', bgColor: 'bg-purple-50' },
              ].map(action => (
                <Link to={action.link} key={action.title}>
                  <Card className="rounded-xl border-none hover:shadow-lg transition-all duration-200 cursor-pointer group bg-white">
                    <CardContent className="p-5 flex items-center">
                      <div className={`p-3 rounded-xl mr-4 ${action.bgColor} group-hover:scale-110 transition-transform duration-200`}>
                        {action.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-700 group-hover:text-gray-900">{action.title}</h3>
                        <p className="text-xs text-gray-500">Acessar seção</p>
                </div>
                      <ArrowUpRight size={18} className="ml-auto text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
              </div>
          </div>
        </div>
      </div>
    </EcommerceDashboardLayout>
  );
};

export default EcommerceDashboard;
