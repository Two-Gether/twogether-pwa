"use client";

import { useRouter } from 'next/navigation';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
}

// ArrowTop SVG 컴포넌트
const ArrowTop = ({ className }: { className?: string }) => (
  <svg 
    width="14" 
    height="14" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M22 17L12 7L2 17" 
      stroke="#333333" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export default function Header({ title, showBackButton = true }: HeaderProps) {
  const router = useRouter();

  const handleBackClick = () => {
    router.back();
  };

  return (
    <div className="w-full h-[73.74px] px-5 py-4 bg-white flex justify-between items-center">
      <div className="flex items-center gap-1">
        {showBackButton && (
          <button
            onClick={handleBackClick}
            className="w-6 h-6 flex items-center justify-center"
          >
            <ArrowTop className="w-3.5 h-3.5 transform -rotate-90" />
          </button>
        )}
        <h1 className="text-[#333333] text-base font-normal leading-[22.4px]">
          {title}
        </h1>
      </div>
    </div>
  );
}
