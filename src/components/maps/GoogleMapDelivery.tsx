import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, Circle, Marker, useJsApiLoader } from '@react-google-maps/api';
import { MapPin, AlertCircle, Map } from 'lucide-react';

// Tipos para as propriedades do componente
interface DeliveryRadius {
  id: string;
  radius: number; // em km
  price: number; // valor da entrega
  color: string; // cor do raio no mapa
}

interface GoogleMapDeliveryProps {
  latitude: number;
  longitude: number;
  radiuses: DeliveryRadius[];
  onRadiusChange?: (id: string, newRadius: number) => void;
  onCenterChange?: (lat: number, lng: number) => void;
  apiKey: string;
}

// Opções padrão do mapa
const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '0.5rem'
};

const defaultOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: true,
  scrollwheel: true,
  fullscreenControl: true,
};

const GoogleMapDelivery: React.FC<GoogleMapDeliveryProps> = ({
  latitude,
  longitude,
  radiuses,
  onRadiusChange,
  onCenterChange,
  apiKey
}) => {
  // Carregar a API do Google Maps
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey || 'YOUR_API_KEY_HERE' // Substitua pela sua chave real da API Google Maps
  });

  // Refs e estados
  const mapRef = useRef<google.maps.Map | null>(null);
  const [center, setCenter] = useState({ lat: latitude, lng: longitude });
  const [circleRefs, setCircleRefs] = useState<{ [key: string]: google.maps.Circle | null }>({});
  const [isDragging, setIsDragging] = useState(false);

  // Atualizar centro quando as props mudam
  useEffect(() => {
    setCenter({ lat: latitude, lng: longitude });
  }, [latitude, longitude]);

  // Callback quando o mapa é carregado
  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Callback quando o mapa é desmontado
  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);
  
  // Callback para carregar um círculo
  const onCircleLoad = useCallback((circle: google.maps.Circle, id: string) => {
    setCircleRefs(prev => ({
      ...prev,
      [id]: circle
    }));
  }, []);
  
  // Callback para círculo desmontado
  const onCircleUnmount = useCallback((id: string) => {
    setCircleRefs(prev => {
      const newRefs = { ...prev };
      delete newRefs[id];
      return newRefs;
    });
  }, []);

  // Callback para quando um círculo é redimensionado
  const onCircleRadiusChanged = useCallback((id: string) => {
    const circle = circleRefs[id];
    if (circle && onRadiusChange) {
      // Converter para km (a API retorna metros)
      const radiusInKm = circle.getRadius() / 1000;
      onRadiusChange(id, radiusInKm);
    }
  }, [circleRefs, onRadiusChange]);

  // Callback para quando o marcador central é arrastado
  const onMarkerDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const onMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    setIsDragging(false);
    if (e.latLng && onCenterChange) {
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();
      setCenter({ lat: newLat, lng: newLng });
      onCenterChange(newLat, newLng);
    }
  }, [onCenterChange]);

  // Se a API ainda está carregando
  if (!isLoaded) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="flex flex-col items-center text-gray-500">
          <div className="animate-spin w-10 h-10 border-4 border-fiscal-green-500 border-t-transparent rounded-full mb-3"></div>
          <p>Carregando o mapa...</p>
        </div>
      </div>
    );
  }

  // Se houver erro ao carregar a API
  if (loadError) {
    return (
      <div className="w-full h-64 bg-red-50 rounded-lg flex items-center justify-center p-4 border border-red-200">
        <div className="flex flex-col items-center text-red-600 max-w-md text-center">
          <AlertCircle size={36} className="mb-2" />
          <h3 className="text-lg font-medium mb-1">Erro ao carregar o mapa</h3>
          <p className="text-sm">Não foi possível carregar o Google Maps. Verifique sua chave de API e tente novamente.</p>
          <p className="text-xs mt-2 text-red-500">{loadError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={14}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={defaultOptions}
      >
        {/* Marcador central (loja) */}
        <Marker
          position={center}
          draggable={true}
          onDragStart={onMarkerDragStart}
          onDragEnd={onMarkerDragEnd}
          icon={{
            url: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 40),
          }}
        />

        {/* Círculos de raio */}
        {radiuses.map((radius) => (
          <Circle
            key={radius.id}
            center={center}
            radius={radius.radius * 1000} // Converter de km para metros
            onLoad={(circle) => onCircleLoad(circle, radius.id)}
            onUnmount={() => onCircleUnmount(radius.id)}
            onRadiusChanged={() => onCircleRadiusChanged(radius.id)}
            options={{
              fillColor: radius.color,
              fillOpacity: 0.2,
              strokeColor: radius.color,
              strokeOpacity: 0.8,
              strokeWeight: 2,
              editable: true,
              draggable: false,
              zIndex: 1000 - radius.radius, // Raios menores ficam em cima
            }}
          />
        ))}
      </GoogleMap>
      
      <div className="mt-2 text-xs text-gray-600 flex items-start">
        <Map size={14} className="mr-1 mt-0.5 flex-shrink-0" />
        <p>
          {isDragging ? (
            <span className="text-fiscal-green-600">Movendo a localização da loja...</span>
          ) : (
            <>
              Arraste o marcador para ajustar a localização exata da sua loja. 
              Você pode redimensionar os círculos arrastando as bordas para ajustar os raios de entrega.
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default GoogleMapDelivery; 