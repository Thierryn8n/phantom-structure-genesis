# Configuração das Tabelas do Fiscal Flow

Este documento explica como configurar as tabelas necessárias para o funcionamento do aplicativo Fiscal Flow no Supabase.

## Problema: Tabelas Faltantes

Se você está encontrando erros como `Status 400` ou `Failed to load resource` ao tentar salvar clientes ou notas fiscais, provavelmente as tabelas necessárias não foram criadas no Supabase.

## Solução: Criar as Tabelas Manualmente

Siga os passos abaixo para criar as tabelas:

1. Acesse o [Dashboard do Supabase](https://app.supabase.io)
2. Selecione seu projeto
3. Vá em "SQL Editor" no menu lateral
4. Crie uma nova query
5. Cole o conteúdo do arquivo `sql/create_tables.sql` nesta query
6. Execute o script para criar todas as tabelas necessárias

## Tabelas Necessárias

O aplicativo Fiscal Flow utiliza as seguintes tabelas:

1. **customers**: Para armazenar dados dos clientes
2. **fiscal_notes**: Para armazenar notas fiscais e orçamentos
3. **sellers**: Para armazenar dados dos vendedores
4. **products**: Para armazenar produtos
5. **user_settings**: Para armazenar configurações do usuário

## Verificação

Para verificar se as tabelas foram criadas corretamente, vá para a seção "Table Editor" no Supabase e verifique se todas as tabelas estão listadas.

## Erro 400 ao Salvar Nota Fiscal

O erro específico:
```
Failed to load resource: the server responded with a status of 400 ()
notesService.ts:54  Erro ao salvar nota fiscal: Object
```

Ocorre porque:
1. A tabela `fiscal_notes` não existe no banco de dados
2. As definições de tipos em TypeScript não correspondem ao esquema do banco de dados

### Como resolver:

1. **Criar as tabelas**: Execute o script SQL em `sql/create_tables.sql` no Supabase.

2. **Atualizar as definições de tipos**: Se ainda encontrar problemas, edite o arquivo `src/integrations/supabase/types.ts` e adicione as definições de tabela para `fiscal_notes` e `customers`. O arquivo já deve ter sido atualizado com as definições corretas.

3. **Verificar os dados enviados**: Certifique-se de que os dados enviados correspondam à estrutura esperada pelo banco. Em particular, os campos JSONB como `address`, `products`, `customer_data` e `payment_data` devem ser objetos JSON válidos.

## Troubleshooting

Se você ainda estiver encontrando problemas:

1. **Erro 401 (Unauthorized)**: Verifique se a sua sessão está válida. O aplicativo tentará renovar automaticamente a sessão, mas em alguns casos pode ser necessário fazer login novamente.

2. **Erro 400 (Bad Request)**: Este erro geralmente indica que há um problema com a estrutura dos dados sendo enviados ou que a tabela não existe. Verifique se todas as tabelas foram criadas corretamente.

3. **Erros de Tipos**: Se encontrar erros relacionados a tipos de dados (por exemplo, `address` incompatível com `Json`), verifique se as definições de tipo em TypeScript estão alinhadas com a estrutura da tabela no banco de dados. 