# Instruções para Instalar a Biblioteca Google Maps API

## 1. Instalar o pacote via npm

Execute o seguinte comando no terminal:

```bash
npm install @react-google-maps/api --save
```

## 2. Adicionar a definição de tipos para o Google Maps

Para resolver os erros do TypeScript, crie um arquivo de declaração de tipos:

1. Crie um arquivo chamado `types.d.ts` na pasta `src` do projeto

```bash
# Navegar até a pasta src
cd src

# Criar o arquivo types.d.ts
echo. > types.d.ts
```

2. Adicione o seguinte conteúdo ao arquivo `types.d.ts`:

```typescript
declare module '@react-google-maps/api' {
  import { Component, ReactNode } from 'react';
  
  export interface GoogleMapProps {
    id?: string;
    mapContainerStyle?: React.CSSProperties;
    mapContainerClassName?: string;
    options?: google.maps.MapOptions;
    center: google.maps.LatLngLiteral;
    zoom: number;
    children?: ReactNode;
    onLoad?: (map: google.maps.Map) => void;
    onUnmount?: () => void;
  }
  
  export interface CircleProps {
    center: google.maps.LatLngLiteral;
    radius: number;
    options?: google.maps.CircleOptions;
    onLoad?: (circle: google.maps.Circle) => void;
    onUnmount?: () => void;
    onRadiusChanged?: () => void;
  }
  
  export interface MarkerProps {
    position: google.maps.LatLngLiteral;
    draggable?: boolean;
    onDragStart?: () => void;
    onDragEnd?: (e: google.maps.MapMouseEvent) => void;
    icon?: google.maps.Icon | string;
  }
  
  export interface UseJsApiLoaderOptions {
    id: string;
    googleMapsApiKey: string;
    libraries?: Array<string>;
    version?: string;
    language?: string;
    region?: string;
  }
  
  export interface UseJsApiLoaderResult {
    isLoaded: boolean;
    loadError: Error | null;
  }
  
  export function useJsApiLoader(options: UseJsApiLoaderOptions): UseJsApiLoaderResult;
  export const GoogleMap: React.FC<GoogleMapProps>;
  export const Circle: React.FC<CircleProps>;
  export const Marker: React.FC<MarkerProps>;
}

// Definição para o namespace 'google'
declare namespace google {
  namespace maps {
    class Map {
      constructor(mapDiv: Element, opts?: MapOptions);
    }
    
    class Circle {
      getRadius(): number;
    }
    
    interface MapOptions {
      center?: LatLngLiteral;
      zoom?: number;
      disableDefaultUI?: boolean;
      zoomControl?: boolean;
      streetViewControl?: boolean;
      mapTypeControl?: boolean;
      scrollwheel?: boolean;
      fullscreenControl?: boolean;
    }
    
    interface CircleOptions {
      fillColor?: string;
      fillOpacity?: number;
      strokeColor?: string;
      strokeOpacity?: number;
      strokeWeight?: number;
      editable?: boolean;
      draggable?: boolean;
      zIndex?: number;
    }
    
    interface Icon {
      url: string;
      scaledSize?: Size;
      anchor?: Point;
    }
    
    class Size {
      constructor(width: number, height: number);
    }
    
    class Point {
      constructor(x: number, y: number);
    }
    
    interface LatLngLiteral {
      lat: number;
      lng: number;
    }
    
    interface MapMouseEvent {
      latLng?: LatLng;
    }
    
    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
    }
  }
} 