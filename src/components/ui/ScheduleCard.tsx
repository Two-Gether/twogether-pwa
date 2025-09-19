import Image from 'next/image';

interface ScheduleCardProps {
  title: string;
  dateRange: string;
  daysLeft: number;
  displayText?: string;
  onClick?: () => void;
}

export default function ScheduleCard({ 
  title, 
  dateRange, 
  daysLeft, 
  displayText,
  onClick 
}: ScheduleCardProps) {
  return (
    <div 
      className="p-4 bg-gray-100 rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-200 transition-colors"
      onClick={onClick}
    >
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-1">
          <span className="text-base text-gray-700 font-pretendard font-semibold leading-[19.20px]">
            {title}
          </span>
          <div className={`px-2 rounded-full w-auto flex items-center justify-center ${
            displayText === '진행중' 
              ? 'bg-green-500' 
              : 'bg-brand-500'
          }`}>
            <span className="text-xs text-white font-pretendard font-semibold leading-[16.80px]">
              {displayText || `D-${daysLeft}`}
            </span>
          </div>
        </div>
        <Image 
          src="/images/common/arrowTop.svg"
          alt="arrow"
          width={12}
          height={12}
          className="transform rotate-90"
        />
      </div>
      <div className="text-sm text-gray-500 font-pretendard font-normal leading-[19.60px]">
        {dateRange}
      </div>
    </div>
  );
}
