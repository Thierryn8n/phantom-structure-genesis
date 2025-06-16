# Sistema de Temas da Loja

O sistema de temas da loja permite personalizar a aparência da sua loja virtual de forma rápida e consistente. Você pode escolher entre temas predefinidos ou criar seu próprio tema personalizado.

## Temas Predefinidos

Atualmente, os seguintes temas estão disponíveis:

1. **Moderno**
   - Cores vibrantes e modernas
   - Fonte: Inter
   - Ideal para lojas de tecnologia e produtos contemporâneos

2. **Minimal**
   - Design minimalista em tons de cinza
   - Fonte: DM Sans
   - Perfeito para lojas que valorizam simplicidade

3. **Elegant**
   - Tons de roxo e azul profundo
   - Fonte: Playfair Display
   - Excelente para lojas de produtos sofisticados

4. **Vibrant**
   - Cores vivas e energéticas
   - Fonte: Poppins
   - Ótimo para lojas jovens e dinâmicas

5. **Profissional**
   - Tons de azul corporativo
   - Fonte: Source Sans Pro
   - Ideal para lojas B2B e produtos profissionais

6. **Natural**
   - Tons de verde e terra
   - Fonte: Nunito
   - Perfeito para produtos naturais e orgânicos

## Personalização

Cada tema pode ser personalizado através dos seguintes elementos:

- **Cores**
  - Cor Primária: Usada em botões e elementos principais
  - Cor Secundária: Usada em textos e elementos secundários
  - Cor de Destaque: Usada para chamar atenção para elementos específicos

- **Tipografia**
  - Fonte Principal: Define a fonte usada em toda a loja
  - As fontes são carregadas automaticamente do Google Fonts

## Como Usar

1. Acesse as configurações da sua loja
2. Vá para a aba "Temas"
3. Escolha um dos temas predefinidos
4. Personalize as cores e fontes se desejar
5. Salve as alterações

## Desenvolvimento

Para desenvolvedores que desejam customizar ainda mais os temas:

1. O componente `ThemeSelector` em `src/components/ecommerce/ThemeSelector.tsx` gerencia a seleção de temas
2. O componente `ThemePreview` em `src/components/ecommerce/ThemePreview.tsx` gera as previews dos temas
3. As configurações são gerenciadas pelo hook `useStoreTheme` em `src/hooks/useStoreTheme.ts`
4. Os temas são armazenados na tabela `ecommerce_settings` com o campo `theme_id`

## Migrações

Se você está atualizando uma instalação existente, execute a migração em `sql/migrations/20240320_add_theme_id_to_ecommerce_settings.sql` para adicionar suporte aos temas. 