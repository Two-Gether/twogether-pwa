"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/ui/Header';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Tag from '@/components/ui/Tag';
import { handleImageUpload } from '@/utils/imageUtils';
import { uploadImage } from '@/utils/imageUpload';

export default function HighlightUploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedTags, setSelectedTags] = useState<string[]>(['가격이 싸요', '교통이 편리해요']);
  const [formData, setFormData] = useState({
    address: '',
    photos: [] as Array<{ file: File; preview: string; serverUrl?: string }>,
    description: '',
    review: ''
  });
  const [isUploading, setIsUploading] = useState(false);

  // 태그를 API 키워드로 매핑
  const tagToKeywordMap: Record<string, string> = {
    '맛있어요': 'taste',
    '가격이 싸요': 'cheap',
    '사장님이 친절해요': 'kindness',
    '교통이 편리해요': 'convenient',
    '분위기가 좋아요': 'atmosphere'
  };

  // 태그 목록을 매핑에서 추출
  const quickReviewTags = Object.keys(tagToKeywordMap);

  // URL 파라미터에서 주소 받아오기
  useEffect(() => {
    const addressParam = searchParams.get('address');
    if (addressParam) {
      setFormData(prev => ({
        ...prev,
        address: decodeURIComponent(addressParam)
      }));
    }
  }, [searchParams]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0]; // 첫 번째 파일만 선택
      
      setIsUploading(true);
      
      try {
        // 1. 이미지 처리 (EXIF 데이터 추출 등)
        const { file: processedFile, preview, exifData, address } = await handleImageUpload(file);
        
        // 2. 서버에 이미지 업로드 (압축 포함)
        const uploadResult = await uploadImage(processedFile);
        
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || '이미지 업로드 실패');
        }
        
        // 3. 폼 데이터 업데이트
        if (preview && uploadResult.imageUrl) {
          setFormData(prev => ({
            ...prev,
            photos: [{
              file: processedFile,
              preview: preview,
              serverUrl: uploadResult.imageUrl
            }]
          }));
        }
        
        // GPS 주소 추출
        if (address && !formData.address) {
          setFormData(prev => ({
            ...prev,
            address: address
          }));
        }
      } catch (error) {
        alert(`이미지 업로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      } finally {
        setIsUploading(false);
        // input 초기화
        event.target.value = '';
      }
    }
  };

  const handleRemovePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 선택된 태그를 키워드로 변환 (최대 2개)
    const selectedKeywords = selectedTags
      .map(tag => tagToKeywordMap[tag])
      .filter(Boolean) // undefined 제거
      .slice(0, 2); // 최대 2개로 제한
    
    // 실제 API로 보낼 데이터 구조
    const apiData = {
      imageUrl: formData.photos.length > 0 ? formData.photos[0].serverUrl || formData.photos[0].preview : "", // 서버 URL 우선, 없으면 preview URL
      name: formData.address.split(' ')[0] || formData.address, // 주소에서 첫 번째 단어를 이름으로 사용 (임시)
      address: formData.address,
      description: formData.description,
      tags: selectedKeywords.map(keyword => keyword.toUpperCase()) // 대문자로 변환
    };

    // TODO: 실제 API 호출 구현
    // console.log('API 데이터:', apiData);
  };

  const isFormValid = formData.address && formData.photos.length > 0 && !isUploading;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header 
        title="하이라이트 업로드"
        showBackButton={true}
      />

      {/* Form */}
      <div className="flex-1 px-6 py-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-7">
          {/* 사진 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1">
              <span className="text-gray-700 text-base font-pretendard font-semibold leading-[19.2px]">사진</span>
              <span className="text-brand-500 text-base font-pretendard font-semibold leading-[19.2px]">*</span>
            </div>
            
            {/* 사진 업로드 영역 - 가로 스크롤 */}
            <div className="flex gap-3 overflow-x-auto pb-2">
              {/* 업로드된 이미지들 */}
              {formData.photos.map((photo, index) => (
                <div key={index} className="w-[146px] h-[187px] bg-gray-50 rounded-lg border border-gray-200 relative overflow-hidden flex-shrink-0 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={photo.preview} 
                    alt={`업로드된 사진 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* 교체 버튼 */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="w-8 h-8 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                        <div className="w-4 h-4 relative">
                          <div className="w-3 h-3 border-2 border-gray-600 rounded-sm"></div>
                          <div className="w-1 h-1 bg-gray-600 absolute top-1 left-1"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 삭제 버튼 */}
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(index)}
                    className="absolute top-2 right-2 w-6 h-6 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center text-sm hover:bg-opacity-70 transition-all duration-200"
                  >
                    ×
                  </button>
                  
                  {/* 파일 입력 (교체용) */}
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
                    onChange={handlePhotoUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              ))}
              
              {/* 업로드 버튼 */}
              {formData.photos.length === 0 && (
                <div className="w-[146px] h-[187px] bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center relative flex-shrink-0">
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-brand-500 text-sm font-pretendard font-normal text-center">
                        업로드 중...
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-5 h-5 relative">
                          <div className="w-3 h-3 border-2 border-gray-400 rounded-sm"></div>
                          <div className="w-1 h-1 bg-gray-400 absolute top-1 left-1"></div>
                        </div>
                        <span className="text-gray-500 text-sm font-pretendard font-normal text-center">
                          사진을 선택하세요
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
                        onChange={handlePhotoUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={isUploading}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 주소 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-gray-700 text-base font-pretendard font-semibold leading-[19.2px]">주소</span>
                <span className="text-brand-500 text-base font-pretendard font-semibold leading-[19.2px]">*</span>
              </div>
              <button
                type="button"
                className="text-brand-500 text-sm font-pretendard font-semibold underline"
                onClick={() => router.push('/highlight/address-search')}
              >
                직접 등록
              </button>
            </div>

            <Input
              type="text"
              variant="placeholder"
              placeholder="주소를 입력하세요"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              required
            />
          </div>

          {/* 한 줄 소개 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 text-base font-pretendard font-semibold leading-[19.2px]">한 줄 소개</span>
              <div className="text-gray-500 text-sm font-pretendard font-normal">
                {formData.description.length}/120
              </div>
            </div>
            <Input
              type="text"
              variant="placeholder"
              placeholder="이 장소 어땠어요?"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              maxLength={120}
            />
          </div>

          {/* 빠른 리뷰 */}
          <div className="flex flex-col gap-4">
            <span className="text-gray-700 text-base font-pretendard font-semibold leading-[19.2px]">빠른 리뷰</span>
            <div className="flex flex-wrap gap-3">
              {quickReviewTags.map((tag) => (
                <Tag
                  key={tag}
                  type="review"
                  onClick={() => handleTagToggle(tag)}
                  variant={selectedTags.includes(tag) ? 'selected' : 'default'}
                >
                  {tag}
                </Tag>
              ))}
            </div>
          </div>
        </form>
      </div>

      {/* 하단 버튼 */}
      <div className="px-6 pt-8">
        <Button
          kind="functional"
          styleType={isFormValid ? "fill" : "outline"}
          tone={isFormValid ? "brand" : "sub"}
          fullWidth
          onClick={handleSubmit}
          disabled={!isFormValid}
        >
          {isUploading ? '업로드 중...' : '등록하기'}
        </Button>
      </div>
    </div>
  );
}
