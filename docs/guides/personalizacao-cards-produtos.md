# Guia de Personalização dos Cards de Produtos

Este guia explica como personalizar a aparência dos cards de produtos na sua loja virtual.

## Novas Opções de Personalização

Agora você pode personalizar ainda mais seus cards de produtos com as seguintes opções:

### Aparência do Cartão

- **Cor de Fundo do Cartão**: Escolha a cor de fundo dos cards de produtos.
- **Borda do Cartão**: Habilite ou desabilite a borda ao redor dos cards.
- **Cor da Borda**: Personalize a cor da borda dos cards (disponível quando a borda está ativada).
- **Largura da Borda**: Defina a espessura da borda entre 1px e 5px (disponível quando a borda está ativada).
- **Raio da Borda**: Controle o arredondamento dos cantos dos cards, de 0px (cantos quadrados) até 20px (muito arredondados).
- **Sombra do Cartão**: Habilite ou desabilite a sombra ao redor dos cards.
- **Intensidade da Sombra**: Ajuste a intensidade da sombra, de 0 (sem sombra) até 5 (sombra mais forte).
- **Efeito ao Passar o Mouse**: Escolha o efeito de hover que os cards terão quando o cliente passar o mouse por cima.

## Como Aplicar as Configurações

1. Acesse a área administrativa da sua loja.
2. Vá para "Configurações" > "E-commerce".
3. Selecione a aba "Estilo dos Cartões".
4. Personalize os cards conforme sua preferência.
5. Clique em "Salvar Alterações" para aplicar.

## Aplicando as Migrações

Se você está atualizando sua instalação, precisará aplicar a migração do banco de dados para adicionar suporte às novas funcionalidades:

```sql
-- Execute este comando no seu banco de dados:
\i sql/migrations/20240718_add_card_style_properties.sql
```

> **Nota:** A migração adiciona novas colunas à tabela `ecommerce_product_card_styles` que já existe em sua instalação.

## Exemplos de Estilo

### Card Moderno com Bordas Arredondadas
- Cor de Fundo: #ffffff
- Borda: Ativada
- Cor da Borda: #e5e7eb
- Largura da Borda: 1px
- Raio da Borda: 12px
- Sombra: Ativada
- Intensidade da Sombra: 2

### Card Colorido sem Bordas
- Cor de Fundo: #f0f9ff
- Borda: Desativada
- Raio da Borda: 8px
- Sombra: Ativada
- Intensidade da Sombra: 3 