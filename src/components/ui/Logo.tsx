import React from 'react';
import { FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LogoProps {
  small?: boolean;
}

const Logo: React.FC<LogoProps> = ({ small = false }) => {
  return (
    <Link to="/" className="flex items-center">
      <div className={`flex items-center justify-center ${small ? 'h-10 w-10' : 'h-8 w-8'} bg-fiscal-green-500 rounded ${small ? 'rounded-lg' : ''}`}>
        <FileText size={small ? 24 : 20} className="text-white" />
      </div>
      {!small && <span className="ml-2 font-cascadia text-xl">FF</span>}
    </Link>
  );
};

export default Logo;
