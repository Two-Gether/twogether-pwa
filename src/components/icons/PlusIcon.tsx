"use client";

import React from 'react';

interface PlusIconProps {
  width?: number;
  height?: number;
  className?: string;
}

const PlusIcon: React.FC<PlusIconProps> = ({ width = 12, height = 12, className = '' }) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M20.6272 12.3137H3.99977" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12.3135 4V20.6274" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

export default PlusIcon;
