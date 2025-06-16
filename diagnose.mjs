// Script de diagnóstico para produtos - Versão ESM
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Carregando variáveis de ambiente
const envContent = readFileSync('.env', 'utf8');
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
      console.log('Erro: Usuário não autenticado. Por favor, execute o aplicativo primeiro para autenticar.');
      process.exit(1);
    }
    
    console.log(`Autenticado como: ${authData.user.id}`);
    
    // Testar consulta à tabela products
    console.log('\nTestando consulta à tabela products (sem filtro):');
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
      console.error('Erro ao consultar produtos do usuário (owner_id):', userProductsError);
    } else {
      console.log(`Encontrados ${userProducts.length} produtos com owner_id = ${authData.user.id}`);
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
      console.log(`Encontrados ${userIdProducts.length} produtos com user_id = ${authData.user.id}`);
    }

    // Testar inserção de produto
    console.log('\nTestando inserção de produto:');
    const testProduct = {
      name: 'Produto Teste Diagnóstico',
      code: 'TEST' + Date.now().toString().slice(-6),
      price: 99.99,
      unit: 'UN',
      quantity: 1,
      description: 'Produto de teste para diagnóstico',
      owner_id: authData.user.id
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('products')
      .insert(testProduct)
      .select();
    
    if (insertError) {
      console.error('Erro ao inserir produto de teste:', insertError);
      
      // Verificar se o erro é de permissão ou RLS
      if (insertError.code === 'PGRST301' || insertError.message.includes('permission denied')) {
        console.log('PROBLEMA IDENTIFICADO: Erro de permissão/RLS. Verifique políticas RLS no Supabase.');
      }
    } else {
      console.log('Produto de teste inserido com sucesso:', insertData);
      console.log('LIMPEZA: Removendo produto de teste...');
      
      // Limpar produto de teste
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', insertData[0].id);
      
      if (deleteError) {
        console.error('Erro ao remover produto de teste:', deleteError);
      } else {
        console.log('Produto de teste removido com sucesso.');
      }
    }
    
    console.log('\nDiagnóstico concluído.');
  } catch (err) {
    console.error('Erro no diagnóstico:', err);
  }
}

run(); 