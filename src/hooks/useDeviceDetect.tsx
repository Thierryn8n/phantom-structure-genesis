import { useState, useEffect } from 'react';

interface DeviceInfo {
  isMobile: boolean;
  isDesktop: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

export function useDeviceDetect(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isDesktop: true,
    deviceType: 'desktop',
  });

  useEffect(() => {
    const userAgent = typeof window.navigator === 'undefined' ? '' : navigator.userAgent;
    
    // Regex para detecção de dispositivos móveis
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    const tabletRegex = /iPad|Android(?!.*Mobile)/i;
    
    const isMobile = mobileRegex.test(userAgent);
    const isTablet = tabletRegex.test(userAgent);
    
    // Atualiza o estado com informações do dispositivo
    setDeviceInfo({
      isMobile: isMobile,
      isDesktop: !isMobile,
      deviceType: isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop',
    });
    
    // Também podemos usar a largura da tela como método adicional de detecção
    const handleResize = () => {
      const width = window.innerWidth;
      const isMobileByWidth = width < 768;
      const isTabletByWidth = width >= 768 && width < 1024;
      
      setDeviceInfo({
        isMobile: isMobileByWidth || isMobile,
        isDesktop: !isMobileByWidth && !isMobile,
        deviceType: isTabletByWidth || isTablet ? 'tablet' : 
                    isMobileByWidth || isMobile ? 'mobile' : 'desktop',
      });
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return deviceInfo;
} 