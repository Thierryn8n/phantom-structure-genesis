import React, { useMemo } from 'react';
import { styled } from 'styled-components';
import useStoreTheme, { EcommerceSettings, ProductCardStyles } from '@/hooks/useStoreTheme';

interface StoreThemeProviderProps {
  children: React.ReactNode;
}

// Componente styled que aplica variáveis CSS globais
const ThemeContainer = styled.div<{ $settings: EcommerceSettings | null, $cardStyles: ProductCardStyles | null }>`
  --primary-color: ${props => props.$settings?.primary_color || '#2563eb'};
  --secondary-color: ${props => props.$settings?.secondary_color || '#4338ca'};
  --accent-color: ${props => props.$settings?.accent_color || '#f59e0b'};
  --background-color: ${props => props.$settings?.background_color || '#ffffff'};
  --text-color: ${props => props.$settings?.primary_color ? '#000000' : '#FFFFFF'};
  --font-family: ${props => props.$settings?.font_family || 'Inter, sans-serif'};
  --border-radius: ${props => props.$settings?.border_radius ? `${props.$settings.border_radius}px` : '0.5rem'};
  
  /* Estilos do cartão de produto baseados nas configurações */
  --product-card-shadow: ${props => props.$cardStyles?.card_shadow_enabled ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'};
  --product-card-border: ${props => props.$cardStyles?.card_border_enabled ? `${props.$cardStyles?.card_border_width || 1}px solid ${props.$cardStyles?.card_border_color || '#e5e7eb'}` : 'none'};
  --product-card-hover: ${props => props.$cardStyles?.card_hover_effect || 'none'};
  --product-card-image-ratio: ${props => props.$cardStyles?.image_aspect_ratio || '1/1'};
  --product-card-image-fit: ${props => props.$cardStyles?.image_fit || 'cover'};
  --product-card-bg-color: ${props => props.$cardStyles?.card_background_color || '#ffffff'};
  --product-card-border-radius: ${props => props.$cardStyles?.card_border_radius ? `${props.$cardStyles?.card_border_radius}px` : 'var(--border-radius)'};
  
  font-family: var(--font-family);
  color: var(--text-color);
  background-color: var(--background-color);
  
  /* Aplica as variáveis a elementos comuns */
  a {
    color: var(--primary-color);
  }
  
  button, .button {
    border-radius: var(--border-radius);
  }
  
  .btn-primary {
    background-color: var(--primary-color);
    color: white;
  }
  
  .btn-secondary {
    background-color: var(--secondary-color);
    color: white;
  }
  
  .btn-accent {
    background-color: var(--accent-color);
    color: white;
  }
  
  /* Estilos para cartões de produto */
  .product-card {
    border: var(--product-card-border);
    box-shadow: var(--product-card-shadow);
    border-radius: var(--product-card-border-radius);
    background-color: var(--product-card-bg-color);
    transition: all 0.2s ease-in-out;
    
    &:hover {
      transform: ${props => props.$cardStyles?.card_hover_effect === 'scale' ? 'scale(1.02)' : 'none'};
    }
  }
  
  .product-card .image-container {
    aspect-ratio: var(--product-card-image-ratio);
    
    img {
      object-fit: var(--product-card-image-fit);
    }
  }
  
  .product-card .title {
    display: ${props => props.$cardStyles?.display_product_name ? 'block' : 'none'};
  }
  
  .product-card .price {
    display: ${props => props.$cardStyles?.display_price ? 'block' : 'none'};
    color: var(--accent-color);
  }
  
  .product-card .original-price {
    display: ${props => props.$cardStyles?.display_original_price ? 'block' : 'none'};
  }
  
  .product-card .discount-badge {
    display: ${props => props.$cardStyles?.display_discount_percentage ? 'block' : 'none'};
  }
`;

const StoreThemeProvider: React.FC<StoreThemeProviderProps> = ({ children }) => {
  // Busca as configurações da loja com o hook useStoreTheme
  const { settings, cardStyles, loading, error } = useStoreTheme();

  // Verifica se há configurações em cache no localStorage
  const cachedSettings = useMemo(() => {
    try {
      const cachedTheme = localStorage.getItem('store_theme_cache');
      if (cachedTheme) {
        const parsedTheme = JSON.parse(cachedTheme);
        const cacheAge = new Date().getTime() - parsedTheme._cachedAt;
        // Usar cache se tiver menos de 10 minutos e não houver configurações do servidor
        if (cacheAge < 10 * 60 * 1000 && loading) {
          return parsedTheme;
        }
      }
      return null;
    } catch (e) {
      console.error('Erro ao processar cache do tema:', e);
      return null;
    }
  }, [loading]);

  // Salvar novas configurações no cache quando disponíveis
  useMemo(() => {
    if (settings && !loading) {
      const cacheData = {
        ...settings,
        _cachedAt: new Date().getTime()
      };
      localStorage.setItem('store_theme_cache', JSON.stringify(cacheData));
    }
  }, [settings, loading]);

  // Usar configurações do cache ou do servidor
  const themeSettings = useMemo(() => {
    return settings || cachedSettings;
  }, [settings, cachedSettings]);

  // Enquanto carrega, mostra um fallback com as configurações em cache ou children sem tema
  if (loading && !cachedSettings) {
    return <div>{children}</div>;
  }

  return (
    <ThemeContainer $settings={themeSettings} $cardStyles={cardStyles}>
      {error && (
        <div style={{ 
          padding: '0.5rem', 
          background: '#fee2e2', 
          color: '#b91c1c', 
          margin: '0.5rem', 
          borderRadius: '0.25rem',
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 9999,
          fontSize: '0.75rem',
          opacity: 0.9
        }}>
          Erro ao carregar tema. Usando tema padrão.
        </div>
      )}
      {children}
    </ThemeContainer>
  );
};

export default React.memo(StoreThemeProvider); 