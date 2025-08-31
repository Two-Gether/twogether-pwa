import React from 'react';
import { PlaceInfo } from '@/types/kakaoMap';

interface PlaceInfoModalProps {
  placeInfo: PlaceInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveToDB: (placeInfo: PlaceInfo) => void;
}

export const PlaceInfoModal: React.FC<PlaceInfoModalProps> = ({
  placeInfo,
  isOpen,
  onClose,
  onSaveToDB
}) => {
  if (!isOpen || !placeInfo) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">장소 정보</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              장소명
            </label>
            <p className="text-gray-900">{placeInfo.name}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              주소
            </label>
            <p className="text-gray-900">{placeInfo.address}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              카테고리
            </label>
            <p className="text-gray-900">{placeInfo.category}</p>
          </div>
          
          {placeInfo.details.phone && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                전화번호
              </label>
              <p className="text-gray-900">{placeInfo.details.phone}</p>
            </div>
          )}
          
          {placeInfo.details.url && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                웹사이트
              </label>
              <a 
                href={placeInfo.details.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-brand-500 hover:text-brand-600"
              >
                {placeInfo.details.url}
              </a>
            </div>
          )}
        </div>
        
        <div className="flex space-x-3 mt-6">
          <button
            onClick={() => onSaveToDB(placeInfo)}
            className="flex-1 bg-brand-500 text-white py-2 px-4 rounded-lg hover:bg-brand-600"
          >
            저장
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}; 