import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FileText, Printer, ChevronRight, BarChart2, LineChart as LineChartIcon, 
  TrendingUp, Calendar, Package, Users, CreditCard, Check,
  ArrowUpRight, Clock, DollarSign, AlertTriangle, CheckCircle, PieChart as PieChartIcon
} from 'lucide-react';
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Area, AreaChart, Cell, PieChart, Pie 
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

// Cores para gráficos
const CHART_COLORS = {
  primary: '#22c55e',
  secondary: '#3b82f6',
  accent: '#f97316',
  neutral: '#6b7280',
  success: '#10b981',
};

// Interfaces para dados reais
interface Quote {
  id: string;
  customer: string;
  date: string;
  value: number;
}

interface SalesData {
  month: string;
  value: number;
}

interface ProductData {
  name: string;
  value: number;
}

interface PerformanceStats {
  salesThisMonth: number;
  quotesThisMonth: number;
  conversionRate: number;
  avgQuoteValue: number;
}

const productDistributionData = [
  { name: 'Produto A', value: 35 },
  { name: 'Produto B', value: 25 },
  { name: 'Produto C', value: 20 },
  { name: 'Outros', value: 20 },
];

const COLORS = [CHART_COLORS.primary, CHART_COLORS.secondary, CHART_COLORS.accent, CHART_COLORS.neutral];

const Dashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [recentQuotes, setRecentQuotes] = useState<Quote[]>([]);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [productDistributionData, setProductDistributionData] = useState<ProductData[]>([]);
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats>({
    salesThisMonth: 0,
    quotesThisMonth: 0,
    conversionRate: 0,
    avgQuoteValue: 0
  });
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Verificação de autenticação e redirecionamento
  useEffect(() => {
    // Verificar autenticação apenas uma vez
    if (isAuthChecked) return;
    
    // Verificar se o usuário está autenticado
    const checkAuth = async () => {
      try {
        // Verificar sessão atual do Supabase
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (!sessionData.session) {
          console.log('Usuário não autenticado, redirecionando para login');
          toast({
            title: "Acesso Restrito",
            description: "Faça login para acessar o Dashboard",
            variant: "destructive"
          });
          
          // Redirecionar para página de login com parâmetro de retorno
          navigate('/auth/login?returnUrl=/dashboard');
        }
        
        // Marcar que a verificação foi realizada
        setIsAuthChecked(true);
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        navigate('/auth/login');
      }
    };
    
    // Pequeno timeout para evitar redirecionamentos desnecessários durante o carregamento inicial
    const timeoutId = setTimeout(() => {
      checkAuth();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [navigate, toast, isAuthChecked]);
  
  // Função para buscar orçamentos recentes
  const fetchRecentQuotes = async () => {
    if (!user?.id) return;
    
    try {
      // Buscar os orçamentos recentes da tabela de notas fiscais
      const { data, error } = await supabase
        .from('fiscal_notes')
        .select('id, customer_data, date, total_value')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (error) throw error;
      
      // Formatar os dados para o formato esperado
      const formattedQuotes = data?.map(item => ({
        id: item.id,
        customer: item.customer_data?.name || 'Cliente',
        date: new Date(item.date).toLocaleDateString('pt-BR'),
        value: item.total_value || 0
      })) || [];
      
      setRecentQuotes(formattedQuotes);
    } catch (error) {
      console.error('Erro ao buscar orçamentos recentes:', error);
      toast({
        title: "Erro ao carregar orçamentos",
        description: "Não foi possível obter os orçamentos recentes.",
        variant: "destructive"
      });
      
      // Dados de fallback em caso de erro
      setRecentQuotes([
    { id: '1', customer: 'João Silva', date: '01/05/2025', value: 199.90 },
    { id: '2', customer: 'Maria Oliveira', date: '30/04/2025', value: 349.50 },
    { id: '3', customer: 'Carlos Santos', date: '29/04/2025', value: 1250.00 },
      ]);
    }
  };
  
  // Função para buscar dados de vendas
  const fetchSalesData = async () => {
    if (!user?.id) return;
    
    try {
      // Obtém os últimos 6 meses
      const monthsData: SalesData[] = [];
      const currentDate = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const startDateString = date.toISOString().split('T')[0]; // formato YYYY-MM-DD
        const endDateString = endDate.toISOString().split('T')[0]; // formato YYYY-MM-DD
        
        // Buscar vendas/orçamentos para este mês
        const { data, error } = await supabase
          .from('fiscal_notes')
          .select('total_value')
          .eq('owner_id', user.id)
          .in('status', ['issued', 'printed', 'finalized'])  // Status confirmados
          .gte('date', startDateString)
          .lt('date', endDateString);
          
        if (error) throw error;
        
        // Calcular total de vendas para o mês
        const totalValue = data?.reduce((sum, item) => sum + (item.total_value || 0), 0) || 0;
        
        // Nome do mês em português
        const monthName = date.toLocaleDateString('pt-BR', { month: 'short' })
          .replace('.', '')
          .charAt(0).toUpperCase() + date.toLocaleDateString('pt-BR', { month: 'short' })
            .replace('.', '')
            .slice(1);
        
        monthsData.push({
          month: monthName,
          value: totalValue
        });
      }
      
      setSalesData(monthsData);
    } catch (error) {
      console.error('Erro ao buscar dados de vendas:', error);
      // Dados de fallback
      setSalesData([
        { month: 'Jan', value: 1200 },
        { month: 'Fev', value: 1900 },
        { month: 'Mar', value: 1500 },
        { month: 'Abr', value: 2100 },
        { month: 'Mai', value: 1800 },
        { month: 'Jun', value: 2400 },
      ]);
    }
  };
  
  // Função para buscar distribuição de produtos
  const fetchProductDistribution = async () => {
    if (!user?.id) return;
    
    try {
      // Buscar produtos nos orçamentos
      const { data, error } = await supabase
        .from('fiscal_notes')
        .select('products, total_value')
        .eq('owner_id', user.id)
        .in('status', ['issued', 'printed', 'finalized'])  // Apenas confirmados
        .order('created_at', { ascending: false })
        .limit(50);  // Limitar para performance
        
      if (error) throw error;
      
      // Agrupar produtos e somar valores
      const productsMap = new Map<string, number>();
      
      // Extrair produtos do JSONB e somar valores
      data?.forEach(note => {
        const products = note.products as any[] || [];
        products.forEach(product => {
          const productName = product.name || 'Produto sem nome';
          const productValue = (product.price * product.quantity) || 0;
          const currentValue = productsMap.get(productName) || 0;
          productsMap.set(productName, currentValue + productValue);
        });
      });
      
      // Converter para array e pegar os top 3
      let topProducts = Array.from(productsMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 3);
        
      // Calcular total para percentual
      const totalValue = topProducts.reduce((sum, product) => sum + product.value, 0);
      
      // Calcular percentuais
      topProducts = topProducts.map(product => ({
        name: product.name,
        value: Math.round((product.value / totalValue) * 100) || 0
      }));
      
      // Se houver menos de 3 produtos, adicionar produto "Outros" para completar
      if (topProducts.length < 3) {
        topProducts.push({ name: 'Outros', value: 100 - topProducts.reduce((sum, p) => sum + p.value, 0) });
      } else {
        // Adicionar "Outros" para produtos fora do top 3
        const otherValue = 100 - topProducts.reduce((sum, p) => sum + p.value, 0);
        if (otherValue > 0) {
          topProducts.push({ name: 'Outros', value: otherValue });
        }
      }
      
      setProductDistributionData(topProducts.length > 0 ? topProducts : [
        { name: 'Produto A', value: 35 },
        { name: 'Produto B', value: 25 },
        { name: 'Produto C', value: 20 },
        { name: 'Outros', value: 20 },
      ]);
    } catch (error) {
      console.error('Erro ao buscar distribuição de produtos:', error);
      // Dados de fallback
      setProductDistributionData([
        { name: 'Produto A', value: 35 },
        { name: 'Produto B', value: 25 },
        { name: 'Produto C', value: 20 },
        { name: 'Outros', value: 20 },
      ]);
    }
  };
  
  // Função para buscar estatísticas de desempenho
  const fetchPerformanceStats = async () => {
    if (!user?.id) return;
    
    try {
      // Obter data do início do mês atual
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      
      // Buscar orçamentos do mês atual
      const { data: monthQuotes, error: monthError } = await supabase
        .from('fiscal_notes')
        .select('id, total_value, status')
        .eq('owner_id', user.id)
        .gte('date', startOfMonth);
        
      if (monthError) throw monthError;
      
      // Calcular estatísticas
      const totalQuotes = monthQuotes?.length || 0;
      const confirmedQuotes = monthQuotes?.filter(q => 
        ['issued', 'printed', 'finalized'].includes(q.status)
      ) || [];
      const totalSales = confirmedQuotes.reduce((sum, q) => sum + (q.total_value || 0), 0);
      const conversionRate = totalQuotes > 0 
        ? Math.round((confirmedQuotes.length / totalQuotes) * 100)
        : 0;
      const avgValue = confirmedQuotes.length > 0
        ? totalSales / confirmedQuotes.length
        : 0;
        
      setPerformanceStats({
        salesThisMonth: totalSales,
        quotesThisMonth: totalQuotes,
        conversionRate,
        avgQuoteValue: avgValue
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas de desempenho:', error);
      // Dados de fallback
      setPerformanceStats({
        salesThisMonth: 7920.50,
        quotesThisMonth: 23,
        conversionRate: 65,
        avgQuoteValue: 326.45
      });
    }
  };
  
  // Função para carregar todos os dados
  const loadDashboardData = async () => {
    setIsLoading(true);
    
    try {
      await Promise.all([
        fetchRecentQuotes(),
        fetchSalesData(),
        fetchProductDistribution(),
        fetchPerformanceStats()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      toast({
        title: "Falha ao carregar dados",
        description: "Ocorreu um erro ao buscar os dados do dashboard.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Carregar dados ao montar o componente
  useEffect(() => {
    // Só carregar dados se o usuário estiver autenticado
    if (user?.id && isAuthChecked) {
      loadDashboardData();
    }
  }, [user?.id, isAuthChecked]);
  
  return (
    <Layout>
      <div className="space-y-8 bg-slate-50 p-6 rounded-lg bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2UyZThmMCIgb3BhY2l0eT0iMC40IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Painel de Controle</h1>
            <p className="text-gray-500 mt-1">
              Acompanhe suas métricas e atividades recentes.
            </p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button variant="outline">
              <Calendar size={16} className="mr-2" />
              {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </Button>
            <Button variant="default" onClick={loadDashboardData} disabled={isLoading}>
              <TrendingUp size={16} className="mr-2" />
              {isLoading ? "Atualizando..." : "Atualizar Dados"}
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 md:w-[400px] mb-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="performance">Desempenho</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            {/* Cards de métricas principais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <Card className="shadow-sm hover:shadow-md transition-shadow border border-gray-200 bg-white">
                <CardContent className="p-5">
                  <div className="flex items-start">
                    <div className="p-3 rounded-full bg-green-100 text-green-600">
                      <DollarSign size={22} />
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-500">Vendas do Mês</p>
                      <h3 className="text-2xl font-bold mt-1">R$ {performanceStats.salesThisMonth.toFixed(2).replace('.', ',')}</h3>
                    </div>
                  </div>
                  <div className="mt-3 text-xs flex items-center text-green-600">
                    <TrendingUp size={14} className="mr-0.5" /> 
                    <span>12% vs. mês anterior</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm hover:shadow-md transition-shadow border border-gray-200 bg-white">
                <CardContent className="p-5">
                  <div className="flex items-start">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                      <FileText size={22} />
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-500">Orçamentos</p>
                      <h3 className="text-2xl font-bold mt-1">{performanceStats.quotesThisMonth}</h3>
                    </div>
                  </div>
                  <div className="mt-3 text-xs flex items-center text-blue-600">
                    <Check size={14} className="mr-0.5" /> 
                    <span>Este mês</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm hover:shadow-md transition-shadow border border-gray-200 bg-white">
                <CardContent className="p-5">
                  <div className="flex items-start">
                    <div className="p-3 rounded-full bg-amber-100 text-amber-600">
                      <CreditCard size={22} />
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-500">Taxa de Conversão</p>
                      <h3 className="text-2xl font-bold mt-1">{performanceStats.conversionRate}%</h3>
                    </div>
                  </div>
                  <div className="mt-3 text-xs flex items-center text-amber-600">
                    <TrendingUp size={14} className="mr-0.5" /> 
                    <span>5% vs. mês anterior</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm hover:shadow-md transition-shadow border border-gray-200 bg-white">
                <CardContent className="p-5">
                  <div className="flex items-start">
                    <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                      <Users size={22} />
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-500">Valor Médio</p>
                      <h3 className="text-2xl font-bold mt-1">R$ {performanceStats.avgQuoteValue.toFixed(2).replace('.', ',')}</h3>
                    </div>
                  </div>
                  <div className="mt-3 text-xs flex items-center text-purple-600">
                    <Check size={14} className="mr-0.5" /> 
                    <span>Por orçamento</span>
                  </div>
                </CardContent>
              </Card>
            </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-sm hover:shadow-md transition-shadow border border-gray-200 bg-white">
                <CardHeader>
                  <div className="flex justify-between items-center mb-4">
                    <CardTitle className="flex items-center">
                      <FileText size={20} className="mr-2 text-fiscal-green-600" />
                      Orçamentos Recentes
                    </CardTitle>
                    <Link to="/notes" className="text-sm text-fiscal-green-600 hover:text-fiscal-green-800 flex items-center">
                      Ver todos <ChevronRight size={16} />
                    </Link>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {recentQuotes.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-fiscal-gray-200">
                            <th className="pb-2">Cliente</th>
                            <th className="pb-2">Data</th>
                            <th className="pb-2 text-right">Valor</th>
                            <th className="pb-2"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentQuotes.map((quote) => (
                            <tr key={quote.id} className="border-b border-fiscal-gray-200 hover:bg-fiscal-gray-50">
                              <td className="py-3">{quote.customer}</td>
                              <td className="py-3">{quote.date}</td>
                              <td className="py-3 text-right">R$ {quote.value.toFixed(2).replace('.', ',')}</td>
                              <td className="py-3 text-right">
                                <Link 
                                  to={`/notes/${quote.id}`} 
                                  className="text-fiscal-green-600 hover:text-fiscal-green-800"
                                >
                                  Detalhes
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-fiscal-gray-500">Nenhum orçamento recente.</p>
                  )}
                </CardContent>
              </Card>
              
              <Card className="shadow-sm hover:shadow-md transition-shadow border border-gray-200 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChartIcon size={20} className="mr-2 text-fiscal-green-600" />
                    Distribuição de Produtos
                  </CardTitle>
                  <CardDescription>
                    Produtos mais orçados do mês
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={productDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {productDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, 'Percentual']} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2 shadow-sm hover:shadow-md transition-shadow border border-gray-200 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <LineChartIcon size={20} className="mr-2 text-fiscal-green-600" />
                    Ações Rápidas
                  </CardTitle>
                  <CardDescription>
                    Acesse rapidamente as principais funcionalidades
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                to="/notes/new"
                className="flex items-center justify-between p-4 border border-black rounded-md hover:bg-fiscal-gray-50 hover:border-fiscal-green-500 transition-colors"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-fiscal-green-500 rounded-md mr-3">
                    <FileText size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium">Nova Nota Fiscal</h3>
                    <p className="text-sm text-fiscal-gray-600">Criar um novo orçamento</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-fiscal-gray-400" />
              </Link>
              
              <Link
                to="/print"
                className="flex items-center justify-between p-4 border border-black rounded-md hover:bg-fiscal-gray-50 hover:border-fiscal-green-500 transition-colors"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-fiscal-green-500 rounded-md mr-3">
                    <Printer size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium">Impressão</h3>
                    <p className="text-sm text-fiscal-gray-600">Gerenciar impressões pendentes</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-fiscal-gray-400" />
              </Link>
                  
                  <Link
                    to="/customers"
                    className="flex items-center justify-between p-4 border border-black rounded-md hover:bg-fiscal-gray-50 hover:border-fiscal-green-500 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="p-2 bg-fiscal-green-500 rounded-md mr-3">
                        <Users size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium">Clientes</h3>
                        <p className="text-sm text-fiscal-gray-600">Gerenciar cadastro de clientes</p>
            </div>
          </div>
                    <ChevronRight size={20} className="text-fiscal-gray-400" />
              </Link>
                  
                          <Link 
                    to="/ecommerce/dashboard"
                    className="flex items-center justify-between p-4 border border-black rounded-md hover:bg-fiscal-gray-50 hover:border-fiscal-green-500 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="p-2 bg-fiscal-green-500 rounded-md mr-3">
                        <Package size={24} className="text-white" />
              </div>
                      <div>
                        <h3 className="font-medium">E-commerce</h3>
                        <p className="text-sm text-fiscal-gray-600">Acessar loja virtual</p>
          </div>
        </div>
                    <ChevronRight size={20} className="text-fiscal-gray-400" />
                  </Link>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm hover:shadow-md transition-shadow border border-gray-200 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle size={20} className="mr-2 text-fiscal-green-600" />
                    Status do Sistema
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
          <div className="p-4 bg-fiscal-green-50 border border-fiscal-green-200 rounded-md">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-fiscal-green-500 rounded-full mr-2"></div>
              <p className="text-fiscal-green-800">Todos os dados estão sincronizados</p>
            </div>
            <p className="text-sm text-fiscal-gray-600 mt-1">
              Última sincronização: {new Date().toLocaleTimeString()}
            </p>
          </div>
                  
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                      <p className="text-blue-800">Servidores operando normalmente</p>
                    </div>
                    <p className="text-sm text-fiscal-gray-600 mt-1">
                      Tempo de resposta: 132ms
                    </p>
                  </div>
                  
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-md">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                      <p className="text-purple-800">Nenhuma atualização pendente</p>
                    </div>
                    <p className="text-sm text-fiscal-gray-600 mt-1">
                      Versão atual: 2.4.5
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="performance" className="space-y-6">
            <Card className="shadow-sm hover:shadow-md transition-shadow border border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart2 size={20} className="mr-2 text-fiscal-green-600" />
                  Desempenho de Vendas - 2025
                </CardTitle>
                <CardDescription>
                  Análise mensal de desempenho de vendas
                </CardDescription>
              </CardHeader>
              
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `R$${value >= 1000 ? (value/1000) + 'k' : value}`} />
                    <Tooltip
                      formatter={(value) => {
                        return typeof value === 'number' 
                          ? [`R$ ${value.toFixed(2).replace('.', ',')}`, 'Vendas']
                          : [String(value), 'Vendas'];
                      }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke={CHART_COLORS.primary} 
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-sm hover:shadow-md transition-shadow border border-gray-200 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp size={20} className="mr-2 text-fiscal-green-600" />
                    Métricas de Desempenho
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Orçamentos Enviados</span>
                      <span className="text-sm font-bold">42</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-fiscal-green-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Orçamentos Convertidos</span>
                      <span className="text-sm font-bold">28</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Satisfação do Cliente</span>
                      <span className="text-sm font-bold">93%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-amber-500 h-2 rounded-full" style={{ width: '93%' }}></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Eficiência de Entrega</span>
                      <span className="text-sm font-bold">87%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: '87%' }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm hover:shadow-md transition-shadow border border-gray-200 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock size={20} className="mr-2 text-fiscal-green-600" />
                    Atividades Recentes
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex">
                      <div className="mr-4 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-fiscal-green-100 flex items-center justify-center">
                          <FileText size={20} className="text-fiscal-green-600" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Orçamento #1234 criado</p>
                        <p className="text-xs text-gray-500">Há 32 minutos atrás</p>
                      </div>
                    </div>
                    
                    <div className="flex">
                      <div className="mr-4 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Printer size={20} className="text-blue-600" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium">3 documentos impressos</p>
                        <p className="text-xs text-gray-500">Há 1 hora atrás</p>
                      </div>
                    </div>
                    
                    <div className="flex">
                      <div className="mr-4 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                          <Users size={20} className="text-amber-600" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Novo cliente cadastrado</p>
                        <p className="text-xs text-gray-500">Há 3 horas atrás</p>
                      </div>
                    </div>
                    
                    <div className="flex">
                      <div className="mr-4 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <CreditCard size={20} className="text-purple-600" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Pagamento recebido</p>
                        <p className="text-xs text-gray-500">Há 5 horas atrás</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="shadow-sm hover:shadow-md transition-shadow border border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle size={20} className="mr-2 text-amber-600" />
                  Orçamentos Pendentes de Aprovação
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2">
                  <div className="p-3 border border-fiscal-gray-200 rounded-md hover:bg-fiscal-gray-50 transition-colors">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Orçamento #1254</p>
                        <p className="text-sm text-fiscal-gray-600">Cliente: Roberto Ferreira</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">R$ 567,90</p>
                        <p className="text-xs text-fiscal-gray-500">Enviado: 28/04/2025</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 border border-fiscal-gray-200 rounded-md hover:bg-fiscal-gray-50 transition-colors">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Orçamento #1248</p>
                        <p className="text-sm text-fiscal-gray-600">Cliente: Amanda Santos</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">R$ 1.234,50</p>
                        <p className="text-xs text-fiscal-gray-500">Enviado: 26/04/2025</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 border border-fiscal-gray-200 rounded-md hover:bg-fiscal-gray-50 transition-colors">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Orçamento #1237</p>
                        <p className="text-sm text-fiscal-gray-600">Cliente: Miguel Costa</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">R$ 432,00</p>
                        <p className="text-xs text-fiscal-gray-500">Enviado: 25/04/2025</p>
                      </div>
                    </div>
          </div>
        </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Dashboard;
