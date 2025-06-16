// Script de diagnóstico simplificado
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Carregando variáveis de ambiente
const envContent = fs.readFileSync('.env', 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length === 2) {
    envVars[parts[0].trim()] = parts[1].trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: Faltam variáveis VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY no .env');
  process.exit(1);
}

// Criando cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    console.log('Conectando ao Supabase...');
    
    // Verificar autenticação
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authData.user) {
      console.log('Erro: Usuário não autenticado. Fazendo login anônimo...');
      // Para teste, podemos usar a API de anônimo
    } else {
      console.log(`Autenticado como: ${authData.user.id}`);
      
      // Testar consulta à tabela products
      console.log('\nTestando consulta à tabela products:');
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .limit(3);
      
      if (productsError) {
        console.error('Erro ao consultar products:', productsError);
      } else {
        console.log(`Encontrados ${products.length} produtos (sem filtro)`);
        if (products.length > 0) {
          console.log('Campos disponíveis:', Object.keys(products[0]));
          console.log('Exemplo de produto:', products[0]);
        }
      }
      
      // Testar consulta com owner_id
      console.log('\nTestando consulta com owner_id:');
      const { data: userProducts, error: userProductsError } = await supabase
        .from('products')
        .select('*')
        .eq('owner_id', authData.user.id)
        .limit(3);
      
      if (userProductsError) {
        console.error('Erro ao consultar produtos do usuário:', userProductsError);
      } else {
        console.log(`Encontrados ${userProducts.length} produtos do usuário`);
      }
      
      // Testar consulta com user_id (possível campo alternativo)
      console.log('\nTestando consulta com user_id:');
      const { data: userIdProducts, error: userIdProductsError } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', authData.user.id)
        .limit(3);
      
      if (userIdProductsError) {
        console.error('Erro ao consultar produtos com user_id:', userIdProductsError);
      } else {
        console.log(`Encontrados ${userIdProducts.length} produtos com user_id`);
      }
    }
  } catch (err) {
    console.error('Erro no diagnóstico:', err);
  }
}

run(); 