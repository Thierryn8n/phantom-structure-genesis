
import React from 'react';
import { FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const Logo: React.FC = () => {
  return (
    <Link to="/" className="flex items-center">
      <div className="flex items-center justify-center h-8 w-8 bg-fiscal-green-500 rounded">
        <FileText size={20} className="text-white" />
      </div>
      <span className="ml-2 font-cascadia text-xl">FF</span>
    </Link>
  );
};

export default Logo;
