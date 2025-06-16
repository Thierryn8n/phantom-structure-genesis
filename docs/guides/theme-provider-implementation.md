# Implementação e Uso do StoreThemeProvider

## Visão Geral

O componente `StoreThemeProvider` é responsável por carregar as configurações de tema da loja a partir do banco de dados Supabase e aplicá-las dinamicamente à interface do usuário usando variáveis CSS.

## Como Funciona

1. **Carregamento das configurações**: O componente utiliza o hook `useStoreTheme` para buscar as configurações da loja (`ecommerce_settings`) e os estilos específicos dos cartões de produtos (`ecommerce_product_card_styles`).

2. **Aplicação do tema**: As configurações são convertidas em variáveis CSS que são aplicadas globalmente aos componentes filhos usando styled-components.

3. **Fallback seguro**: Se ocorrer qualquer erro no carregamento das configurações, o componente usa valores padrão para garantir que a loja continue funcionando.

## Integrando à sua Aplicação

### 1. Envolvendo Componentes

```jsx
import StoreThemeProvider from '@/components/ecommerce/StoreThemeProvider';

function MyEcommerceComponent() {
  return (
    <StoreThemeProvider>
      {/* Seus componentes de e-commerce aqui */}
    </StoreThemeProvider>
  );
}
```

### 2. No App.tsx (já implementado)

O `StoreThemeProvider` já foi configurado no `App.tsx` para envolver automaticamente todas as rotas de e-commerce:

- `/ecommerce` - Loja principal
- `/checkout` - Página de checkout
- `/ecommerce/wishlist` - Lista de desejos
- `/ecommerce/auth` - Autenticação para clientes

## Usando o Hook useStoreTheme

Para acessar e manipular diretamente as configurações de tema em seus componentes, use o hook `useStoreTheme`:

```jsx
import useStoreTheme from '@/hooks/useStoreTheme';

function MyComponent() {
  const { 
    settings, 
    cardStyles, 
    themes, 
    loading, 
    error, 
    applyTheme, 
    saveSettings, 
    saveCardStyles 
  } = useStoreTheme();

  // Exemplo: aplicar um tema predefinido
  const handleApplyTheme = (themeId) => {
    applyTheme(themeId);
  };

  // Exemplo: salvar alterações nas configurações
  const handleSaveColor = (color) => {
    saveSettings({ primary_color: color });
  };

  return (
    <div>
      {loading ? (
        <p>Carregando tema...</p>
      ) : (
        <div>
          <h2 style={{ color: settings?.primary_color }}>
            Tema Atual: {settings?.primary_color}
          </h2>
          
          {/* Seletor de temas predefinidos */}
          <div>
            <h3>Temas Disponíveis</h3>
            {themes.map(theme => (
              <button
                key={theme.id}
                onClick={() => handleApplyTheme(theme.id)}
              >
                {theme.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### Funções disponíveis no hook

- `settings`: Objeto com as configurações atuais da loja
- `cardStyles`: Objeto com os estilos do cartão de produto
- `themes`: Array com os temas predefinidos disponíveis
- `loading`: Boolean indicando se os dados estão sendo carregados
- `error`: String com mensagem de erro, se houver
- `applyTheme(themeId)`: Aplica um tema predefinido às configurações atuais
- `saveSettings(newSettings)`: Salva alterações nas configurações da loja
- `saveCardStyles(newStyles)`: Salva alterações nos estilos do cartão de produto

## Usando Variáveis CSS no Seu Código

Quando você cria um componente dentro do `StoreThemeProvider`, as seguintes variáveis CSS estão disponíveis:

### Variáveis Gerais

```css
--primary-color
--secondary-color
--accent-color
--text-color
--background-color
--font-family
--border-radius
```

### Variáveis para Cartão de Produto

```css
--product-card-border-width
--product-card-border-color
--product-card-title-font-size
--product-card-price-font-size
--product-card-rating-size
```

### Exemplo de Uso

```jsx
const MyStyledComponent = styled.div`
  background-color: var(--background-color);
  color: var(--text-color);
  
  button {
    background-color: var(--primary-color);
    border-radius: var(--border-radius);
  }
  
  .product-title {
    font-size: var(--product-card-title-font-size);
  }
`;
```

## Classes Pré-estilizadas

Para facilitar o uso, algumas classes básicas já estão pré-configuradas:

- `.btn-primary`, `.btn-secondary`, `.btn-accent` - Botões estilizados
- `.product-card` - Container para cartão de produto
- `.product-card .title` - Título no cartão
- `.product-card .price` - Preço no cartão
- `.product-card .rating` - Avaliação no cartão

## Personalização Avançada

### Adicionando Novas Variáveis

Para adicionar novas variáveis de tema:

1. Atualize a interface `EcommerceSettings` ou `ProductCardStyles` no arquivo `useStoreTheme.ts`.
2. Adicione a nova coluna na tabela correspondente no banco de dados.
3. Adicione a nova variável no componente `ThemeContainer` no `StoreThemeProvider.tsx`.

### Estilos Condicionais

Para aplicar estilos baseados em configurações booleanas:

```jsx
const ProductCard = styled.div<{ settings: EcommerceSettings }>`
  ${props => props.settings.show_discount_badge && `
    .discount-badge {
      display: block;
      background-color: var(--accent-color);
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: var(--border-radius);
    }
  `}
`;
```

## Resolução de Problemas

### Erros no Carregamento

Se o erro `Erro ao carregar tema` aparecer, verifique:

1. Se as tabelas foram criadas no Supabase
2. Se existe pelo menos um registro na tabela `ecommerce_settings`
3. Se as variáveis de ambiente do Supabase estão configuradas corretamente

### Alterando Estilos Padrão

Os estilos padrão são definidos como constante `defaultSettings` no arquivo `useStoreTheme.ts`. Para alterá-los, modifique os valores nesta constante.

## Próximos Passos

1. Criar componentes que usam o hook `useStoreTheme` para permitir edição do tema em tempo real
2. Implementar visualização prévia de temas
3. Adicionar suporte para temas escuros 