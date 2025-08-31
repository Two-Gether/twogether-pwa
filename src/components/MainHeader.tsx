"use client";

import React, { useEffect, useState } from 'react';

interface HeaderProps {
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ 
  title = "TWOGETHER", 
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full px-5 py-5 bg-white flex justify-between items-center">
        <div className="text-left text-gray-800 font-catways text-base font-normal leading-[22.4px]">
          {title}
        </div>
        <div className="w-5 h-5 relative overflow-hidden" />
      </div>
    );
  }

  return (
    <div className="w-full h-full px-5 py-5 bg-white flex justify-between items-center">
      <div className="text-left text-gray-800 font-catways text-base font-normal leading-[22.4px]">
        {title}
      </div>
      
      <div className="w-5 h-5 relative overflow-hidden">
        <img src="/images/common/search.svg" alt="Search" className="w-5 h-5" />
      </div>
    </div>
  );
};

export default Header;
