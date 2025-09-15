import React from 'react';
import { PlaceSearchResult } from '@/types/kakaoMap';

interface SearchResultsListProps {
  searchKeyword: string;
  results: PlaceSearchResult[];
  showResults: boolean;
  hasMore: boolean;
  isLoading: boolean;
  pagination?: {
    current: number;
    last: number;
  };
  onPlaceSelect: (place: PlaceSearchResult) => void;
  onLoadMore: () => void;
  onClose: () => void;
}

export const SearchResultsList: React.FC<SearchResultsListProps> = ({
  searchKeyword,
  results,
  showResults,
  hasMore,
  isLoading,
  onPlaceSelect,
  onLoadMore,
  onClose
}) => {
  if (!showResults || results.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-32 left-0 right-0 z-30 bg-white rounded-lg shadow-lg mx-5 max-h-96 overflow-y-auto">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800">
          &ldquo;{searchKeyword}&rdquo; 검색 결과 ({results.length}개)
        </h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="divide-y divide-gray-200">
        {results.map((place) => (
          <div
            key={place.id}
            className="p-4 hover:bg-gray-50 cursor-pointer"
            onClick={() => onPlaceSelect(place)}
          >
            <div className="font-medium text-gray-900">{place.place_name}</div>
            <div className="text-sm text-gray-600 mt-1">
              {place.road_address_name || place.address_name}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {place.category_name}
            </div>
          </div>
        ))}
      </div>
      
      {hasMore && (
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="w-full py-2 px-4 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50"
          >
            {isLoading ? '로딩 중...' : '더보기'}
          </button>
        </div>
      )}
    </div>
  );
};
