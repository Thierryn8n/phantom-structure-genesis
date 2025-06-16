import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import ThemePreview from './ThemePreview';

interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  font: string;
}

const predefinedThemes: Theme[] = [
  {
    id: 'moderno',
    name: 'Moderno',
    colors: {
      primary: '#0EA5E9',
      secondary: '#0F172A',
      accent: '#F59E0B',
    },
    font: 'Inter',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    colors: {
      primary: '#18181B',
      secondary: '#71717A',
      accent: '#E4E4E7',
    },
    font: 'DM Sans',
  },
  {
    id: 'elegant',
    name: 'Elegant',
    colors: {
      primary: '#7C3AED',
      secondary: '#1E1B4B',
      accent: '#C4B5FD',
    },
    font: 'Playfair Display',
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    colors: {
      primary: '#EC4899',
      secondary: '#6D28D9',
      accent: '#F472B6',
    },
    font: 'Poppins',
  },
  {
    id: 'profissional',
    name: 'Profissional',
    colors: {
      primary: '#0891B2',
      secondary: '#1E293B',
      accent: '#38BDF8',
    },
    font: 'Source Sans Pro',
  },
  {
    id: 'natural',
    name: 'Natural',
    colors: {
      primary: '#059669',
      secondary: '#064E3B',
      accent: '#34D399',
    },
    font: 'Nunito',
  },
];

interface ThemeSelectorProps {
  selectedTheme: string;
  onThemeSelect: (theme: Theme) => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  selectedTheme,
  onThemeSelect,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {predefinedThemes.map((theme) => (
        <Card
          key={theme.id}
          className={cn(
            'relative cursor-pointer transition-all duration-200 hover:scale-[1.02] group',
            selectedTheme === theme.id && 'ring-2 ring-fiscal-green-500'
          )}
          onClick={() => onThemeSelect(theme)}
        >
          <div className="relative aspect-[16/9] overflow-hidden rounded-t-lg">
            <ThemePreview colors={theme.colors} />
            {selectedTheme === theme.id && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-white" />
              </div>
            )}
          </div>
          
          <div className="p-4">
            <h3 className="font-medium text-lg mb-2">{theme.name}</h3>
            
            <div className="flex gap-2 mb-3">
              {Object.values(theme.colors).map((color, index) => (
                <div
                  key={index}
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            
            <p className="text-sm text-gray-600">
              Fonte: {theme.font}
            </p>
          </div>
          
          <div
            className={cn(
              'absolute inset-0 rounded-lg transition-opacity duration-200',
              'border-2 opacity-0',
              'group-hover:opacity-100',
              selectedTheme === theme.id ? 'border-fiscal-green-500' : 'border-gray-300'
            )}
          />
        </Card>
      ))}
    </div>
  );
};

export default ThemeSelector; 