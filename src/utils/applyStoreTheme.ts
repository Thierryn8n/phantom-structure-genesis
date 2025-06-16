// Função utilitária para determinar se a cor do texto deve ser clara ou escura
const getContrastingTextColor = (hexColor: string): string => {
  if (!hexColor) return '#FFFFFF'; // Retorna branco por padrão
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#000000' : '#FFFFFF'; // Preto para fundos claros, branco para fundos escuros
};

// Função utilitária para aplicar as cores do tema da loja como variáveis CSS
export function applyStoreTheme(storeInfo: any) {
  if (!storeInfo) return;
  const root = document.documentElement;

  // Cores principais da loja
  if (storeInfo.primary_color) {
    root.style.setProperty('--store-primary', storeInfo.primary_color);
    root.style.setProperty('--store-primary-foreground', getContrastingTextColor(storeInfo.primary_color));
    // Para o hover, vamos usar a cor de destaque por enquanto, ou uma versão mais escura da primária
    // Poderíamos escurecer a cor primária programaticamente, mas usar accent é mais simples agora.
    root.style.setProperty('--store-primary-hover', storeInfo.accent_color || storeInfo.primary_color);
  }
  if (storeInfo.secondary_color) {
    root.style.setProperty('--store-secondary', storeInfo.secondary_color);
    root.style.setProperty('--store-secondary-foreground', getContrastingTextColor(storeInfo.secondary_color));
  }
  if (storeInfo.background_color) {
    root.style.setProperty('--store-bg', storeInfo.background_color);
    root.style.setProperty('--store-bg-foreground', getContrastingTextColor(storeInfo.background_color));
  }
  if (storeInfo.accent_color) {
    root.style.setProperty('--store-accent', storeInfo.accent_color);
    root.style.setProperty('--store-accent-foreground', getContrastingTextColor(storeInfo.accent_color));
  }

  // Aplicar cores do cabeçalho
  const headerBgColor = storeInfo.primary_color;
  if (headerBgColor) {
    root.style.setProperty('--store-header-bg', headerBgColor);
    root.style.setProperty('--store-header-foreground', getContrastingTextColor(headerBgColor));
  }

  // Estilos dos cartões de produto
  if (storeInfo.cardStyles) {
    // Aplica as configurações de estilo dos cartões de produto
    if (storeInfo.cardStyles.card_background_color) {
      root.style.setProperty('--product-card-bg-color', storeInfo.cardStyles.card_background_color);
    }
    
    // Borda do cartão
    if (storeInfo.cardStyles.card_border_enabled) {
      const borderWidth = storeInfo.cardStyles.card_border_width || 1;
      const borderColor = storeInfo.cardStyles.card_border_color || '#e5e7eb';
      root.style.setProperty('--product-card-border', `${borderWidth}px solid ${borderColor}`);
    } else {
      root.style.setProperty('--product-card-border', 'none');
    }
    
    // Raio da borda
    if (storeInfo.cardStyles.card_border_radius !== undefined) {
      root.style.setProperty('--product-card-border-radius', `${storeInfo.cardStyles.card_border_radius}px`);
    }
    
    // Sombra do cartão
    if (storeInfo.cardStyles.card_shadow_enabled) {
      const shadowIntensity = storeInfo.cardStyles.card_shadow_intensity || 1;
      const shadowOpacity = 0.1 + (shadowIntensity * 0.05); // 0.1 a 0.35
      root.style.setProperty('--product-card-shadow', `0 4px ${shadowIntensity * 3}px rgba(0,0,0,${shadowOpacity})`);
    } else {
      root.style.setProperty('--product-card-shadow', 'none');
    }
    
    // Efeito hover
    if (storeInfo.cardStyles.card_hover_effect) {
      const hoverEffect = storeInfo.cardStyles.card_hover_effect;
      if (hoverEffect === 'scale') {
        root.style.setProperty('--product-card-hover', 'scale(1.02)');
      } else if (hoverEffect === 'elevate') {
        root.style.setProperty('--product-card-hover', 'translateY(-4px)');
      } else {
        root.style.setProperty('--product-card-hover', 'none');
      }
    }
  }

  // Aplicar estilos CSS globais para a loja
  const styleElement = document.getElementById('ecommerce-product-card-styles');
  if (!styleElement) {
    const css = `
      .product-card {
        border: var(--product-card-border, 1px solid #e5e7eb);
        box-shadow: var(--product-card-shadow, none);
        border-radius: var(--product-card-border-radius, 0.375rem);
        background-color: var(--product-card-bg-color, white);
        transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
      }
      
      .product-card:hover {
        transform: var(--product-card-hover, none);
      }
    `;
    
    const style = document.createElement('style');
    style.id = 'ecommerce-product-card-styles';
    style.innerHTML = css;
    document.head.appendChild(style);
  }
} 