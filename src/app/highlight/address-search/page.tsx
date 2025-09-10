"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/ui/Header';
import SearchBar from '@/components/ui/SearchBar';
import LocationItem from '@/components/ui/LocationItem';

interface AddressSearchResult {
  address_name: string;
  road_address_name?: string;
  place_name?: string;
  x?: string;
  y?: string;
}

export default function AddressSearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AddressSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query?: string) => {
    const searchTerm = query || searchQuery;
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    try {
      // Kakao 주소 검색 API 호출
      const response = await fetch(
        `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(searchTerm)}`,
        {
          headers: {
            'Authorization': `KakaoAK ${process.env.NEXT_PUBLIC_KAKAO_API_KEY || 'YOUR_KAKAO_API_KEY'}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.documents || []);
      } else {
        console.error('주소 검색 실패:', response.status);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('주소 검색 오류:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectAddress = (address: AddressSearchResult) => {
    // 선택된 주소를 하이라이트 페이지로 전달
    const addressString = address.address_name || address.road_address_name || '';
    router.push(`/highlight?address=${encodeURIComponent(addressString)}`);
  };


  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header 
        title="주소 검색"
        showBackButton={true}
      />

      {/* 검색 영역 */}
      <div className="px-6 py-6">
        <div className="mb-6">
          <SearchBar
            placeholder="주소를 입력하세요"
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={handleSearch}
          />
        </div>

        {/* 검색 결과 */}
        {searchResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-gray-700 text-base font-pretendard font-semibold">
              검색 결과
            </h3>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {searchResults.map((result, index) => (
                <LocationItem
                  key={index}
                  title={result.address_name}
                  address={result.road_address_name || result.place_name || ''}
                  onClick={() => handleSelectAddress(result)}
                />
              ))}
            </div>
          </div>
        )}

        {/* 검색 결과가 없을 때 */}
        {searchQuery && !isSearching && searchResults.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500 text-sm font-pretendard">
              검색 결과가 없습니다.
            </div>
            <div className="text-gray-400 text-xs font-pretendard mt-1">
              다른 키워드로 검색해보세요.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
