import React from 'react';

interface LocationItemProps {
  title: string;
  address: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

const LocationItem: React.FC<LocationItemProps> = ({
  title,
  address,
  onClick,
  className = '',
  disabled = false
}) => {
  return (
    <div 
      className={`w-full py-4 bg-white border-b border-gray-300 flex flex-col justify-start items-start gap-1 transition-colors ${
        disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'cursor-pointer hover:bg-gray-50'
      } ${className}`}
      onClick={disabled ? undefined : onClick}
    >
      <div className="w-full flex justify-between items-center">
        <div className="w-full flex justify-center flex-col text-gray-700 font-pretendard text-sm font-bold leading-[19.6px]">
          {title}
        </div>
      </div>
      <div className="w-full flex justify-center flex-col text-gray-500 font-pretendard text-xs font-normal leading-[16.8px]">
        {address}
      </div>
    </div>
  );
};

export default LocationItem;
