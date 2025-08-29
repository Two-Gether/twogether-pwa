import React from 'react';

interface LocationItemProps {
  title: string;
  address: string;
  onClick?: () => void;
  className?: string;
}

const LocationItem: React.FC<LocationItemProps> = ({
  title,
  address,
  onClick,
  className = ''
}) => {
  return (
    <div 
      className={`w-full py-4 bg-white border-b border-gray-300 flex flex-col justify-start items-start gap-1 cursor-pointer ${className}`}
      onClick={onClick}
    >
      <div className="w-full flex justify-center flex-col text-gray-700 font-gowun text-sm font-bold leading-[19.6px]">
        {title}
      </div>
      <div className="w-full flex justify-center flex-col text-gray-500 font-gowun text-xs font-normal leading-[16.8px]">
        {address}
      </div>
    </div>
  );
};

export default LocationItem;
