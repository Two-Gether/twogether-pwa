"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/ui/Header';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Tag from '@/components/ui/Tag';
import { handleImageUpload } from '@/utils/imageUtils';

export default function HighlightUploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedTags, setSelectedTags] = useState<string[]>(['가격이 싸요', '교통이 편리해요']);
  const [formData, setFormData] = useState({
    address: '',
    photos: [] as Array<{ file: File; preview: string }>,
    description: '',
    review: ''
  });

  const quickReviewTags = [
    '맛있어요',
    '가격이 싸요', 
    '사장님이 친절해요',
    '교통이 편리해요',
    '분위기가 좋아요'
  ];

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
      const newPhotos: Array<{ file: File; preview: string }> = [];
      
      for (let i = 0; i < Math.min(files.length, 5 - formData.photos.length); i++) {
        const file = files[i];
        try {
          const { file: processedFile, preview, exifData, address } = await handleImageUpload(file);
          
          if (preview) {
            newPhotos.push({
              file: processedFile,
              preview: preview
            });
          }
          
          // 첫 번째 이미지에서 GPS 주소 추출
          if (i === 0 && address && !formData.address) {
            setFormData(prev => ({
              ...prev,
              address: address
            }));
            console.log('📍 GPS에서 추출한 주소:', address);
          }
          
          if (exifData.dateTime) {
            console.log('📅 촬영 날짜:', exifData.dateTime);
          }
          
        } catch (error) {
          console.error('파일 처리 실패:', error);
          alert(`파일 처리 중 오류가 발생했습니다: ${file.name}`);
        }
      }
      
      if (newPhotos.length > 0) {
        setFormData(prev => ({
          ...prev,
          photos: [...prev.photos, ...newPhotos]
        }));
        console.log(`${newPhotos.length}개 이미지 추가됨`);
      }
      
      // input 초기화
      event.target.value = '';
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
    // 하이라이트 업로드 로직
    console.log('하이라이트 업로드:', formData, selectedTags);
  };

  const isFormValid = formData.address && formData.photos.length > 0;

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
                <div key={index} className="w-[146px] h-[187px] bg-gray-50 rounded-lg border border-gray-200 relative overflow-hidden flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={photo.preview} 
                    alt={`업로드된 사진 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(index)}
                    className="absolute top-2 right-2 w-6 h-6 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center text-sm"
                  >
                    ×
                  </button>
                </div>
              ))}
              
              {/* 업로드 버튼 */}
              {formData.photos.length < 5 && (
                <div className="w-[146px] h-[187px] bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center relative flex-shrink-0">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-5 h-5 relative">
                      <div className="w-3 h-3 border-2 border-gray-400 rounded-sm"></div>
                      <div className="w-1 h-1 bg-gray-400 absolute top-1 left-1"></div>
                    </div>
                    <span className="text-gray-500 text-sm font-pretendard font-normal text-center">
                      사진을 선택하세요 ({formData.photos.length}/5)
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
                    onChange={handlePhotoUpload}
                    multiple
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
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
      <div className="px-6 pt-6">
        <Button
          kind="functional"
          styleType={isFormValid ? "fill" : "outline"}
          tone={isFormValid ? "brand" : "sub"}
          fullWidth
          onClick={handleSubmit}
          disabled={!isFormValid}
        >
          등록하기
        </Button>
      </div>
    </div>
  );
}
