import React from 'react';

export interface Recommendation {
  id: string;
  title: string;
  location: string;
  dateRange: string;
  imageUrl: string;
  category: 'event' | 'place';
  tags?: string[];
  fullAddress?: string; // Map 페이지에서 사용할 전체 주소
  mapx?: string; // 경도
  mapy?: string; // 위도
}

interface RecommendationCardProps {
  recommendation: Recommendation;
  onClick?: (recommendation: Recommendation) => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ 
  recommendation, 
  onClick 
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(recommendation);
    }
  };

  return (
    <div 
      className="w-[230px] h-[314px] p-3 bg-gradient-to-b from-transparent to-black/50 rounded-lg relative flex-shrink-0 cursor-pointer"
      style={{ 
        backgroundImage: `url(${recommendation.imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
      onClick={handleClick}
    >
      {/* 위치 태그 */}
      <div className="absolute top-3 left-3 px-2 py-1 bg-gray-100 rounded">
        <span className="text-xs text-sub-700 font-pretendard font-semibold leading-[16.80px]">
          {recommendation.location}
        </span>
      </div>

      {/* 하단 정보 */}
      <div className="absolute bottom-3 left-3 right-3">
        <div className="text-base text-white font-pretendard font-semibold leading-[19.20px] mb-1">
          {recommendation.title}
        </div>
        <div className="text-sm text-white font-pretendard font-normal leading-[19.60px]">
          {recommendation.dateRange}
        </div>
      </div>
    </div>
  );
};

export default RecommendationCard;
