import React from 'react';

interface ThemePreviewProps {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

const ThemePreview: React.FC<ThemePreviewProps> = ({ colors }) => {
  return (
    <div className="w-full h-full bg-white p-4">
      {/* Header */}
      <div className="w-full h-12 mb-4 rounded" style={{ backgroundColor: colors.primary }} />
      
      {/* Content */}
      <div className="space-y-4">
        {/* Title */}
        <div className="w-3/4 h-6 rounded" style={{ backgroundColor: colors.secondary }} />
        
        {/* Grid */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-square rounded-lg" style={{ backgroundColor: colors.accent }} />
          ))}
        </div>
        
        {/* Text Lines */}
        <div className="space-y-2">
          <div className="w-full h-3 rounded" style={{ backgroundColor: colors.secondary + '40' }} />
          <div className="w-5/6 h-3 rounded" style={{ backgroundColor: colors.secondary + '40' }} />
          <div className="w-4/6 h-3 rounded" style={{ backgroundColor: colors.secondary + '40' }} />
        </div>
        
        {/* Button */}
        <div className="w-1/3 h-8 rounded" style={{ backgroundColor: colors.primary }} />
      </div>
    </div>
  );
};

export default ThemePreview; 