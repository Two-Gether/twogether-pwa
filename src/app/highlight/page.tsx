"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/ui/Header';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Tag from '@/components/ui/Tag';
import { handleImageUpload } from '@/utils/imageUtils';
import { useAuthStore, apiWithAuth } from '@/hooks/auth/useAuth';
import Notification from '@/components/ui/Notification';

// localStorage 키
const HIGHLIGHT_DRAFT_KEY = 'highlight_upload_draft';

// 태그 카테고리 정의
const tagCategories = [
  {
    name: '분위기',
    tags: ['조용한', '활기찬', '아늑한', '모던한', '감성적인', '힙한', '고급스러운', '캐주얼한']
  },
  {
    name: '용도/목적',
    tags: ['데이트', '기념일', '카페투어', '맛집 투어', '사진찍기 좋은', '산책하기 좋은', '야경명소', '브런치', '디저트 맛집', '술 한잔']
  },
  {
    name: '실용성',
    tags: ['주차 편함', '대중교통 편함', '예약 필수', '웨이팅 필수', '포장 가능', '24시간', '반려동물 동반', '단체석 있음']
  },
  {
    name: '가격대',
    tags: ['가성비', '합리적', '고가', '저렴함', '무료', '세트메뉴 있음', '할인 이벤트', '쿠폰 사용가능']
  },
  {
    name: '특징',
    tags: ['인스타 감성', '뷰 맛집', '숨은 맛집', '핫플', '현지인 추천', '조용한 데이트', '프라이빗', '루프탑', '오션뷰', '시그니처 메뉴']
  }
];

const MAX_TAGS = 5;

function HighlightUploadContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    photos: [] as Array<{ file: File; preview: string; serverUrl?: string }>,
    description: '',
    review: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Toast 표시 함수
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // localStorage에서 임시 저장된 데이터 불러오기
  useEffect(() => {
    const savedDraft = localStorage.getItem(HIGHLIGHT_DRAFT_KEY);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        
        // 사진 데이터 복원 (Base64에서 File 객체로 변환)
        if (draft.photos && draft.photos.length > 0) {
          const restoredPhotos = draft.photos.map((photo: { name: string; type: string; data: string; preview: string }) => {
            // Base64를 Blob으로 변환
            const byteString = atob(photo.data.split(',')[1]);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], { type: photo.type });
            const file = new File([blob], photo.name, { type: photo.type });
            
            return {
              file,
              preview: photo.preview
            };
          });
          
          setFormData(prev => ({
            ...prev,
            photos: restoredPhotos,
            name: draft.name || prev.name,
            description: draft.description || prev.description
          }));
        }
        
        if (draft.selectedTags) {
          setSelectedTags(draft.selectedTags);
        }
      } catch (error) {
        console.error('임시 저장 데이터 복원 실패:', error);
      }
    }
  }, []);

  // URL 파라미터에서 주소와 가게명 받아오기
  useEffect(() => {
    const addressParam = searchParams.get('address');
    const nameParam = searchParams.get('name');

    if (addressParam || nameParam) {
      const newFormData = {
        address: addressParam ? decodeURIComponent(addressParam) : '',
        name: nameParam ? decodeURIComponent(nameParam) : ''
      };

      setFormData(prev => ({
        ...prev,
        ...newFormData
      }));
    }
  }, [searchParams]);

  // 폼 데이터가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    if (formData.photos.length > 0 || formData.description || formData.name) {
      const draftData = {
        name: formData.name,
        description: formData.description,
        selectedTags,
        photos: formData.photos.map(photo => ({
          name: photo.file.name,
          type: photo.file.type,
          data: photo.preview, // Base64 미리보기 URL 그대로 저장
          preview: photo.preview
        }))
      };
      
      localStorage.setItem(HIGHLIGHT_DRAFT_KEY, JSON.stringify(draftData));
    } else if (formData.photos.length === 0 && !formData.description && !formData.name) {
      // 모든 데이터가 비어있으면 localStorage 정리
      localStorage.removeItem(HIGHLIGHT_DRAFT_KEY);
    }
  }, [formData.photos, formData.description, formData.name, selectedTags]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        // 이미 선택된 태그 제거
        return prev.filter(t => t !== tag);
      } else {
        // 최대 5개까지만 선택 가능
        if (prev.length >= MAX_TAGS) {
          showToast('error', `최대 ${MAX_TAGS}개까지만 선택할 수 있습니다.`);
          return prev;
        }
        return [...prev, tag];
      }
    });
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
        const { file: processedFile, preview, address } = await handleImageUpload(file);
        
        // 2. 폼 데이터에 미리보기와 파일만 저장 (선업로드 제거)
        if (preview) {
          setFormData(prev => ({
            ...prev,
            photos: [{
              file: processedFile,
              preview: preview
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.photos.length === 0) {
      alert('사진을 선택해주세요.');
      return;
    }
    
    try {
      setIsUploading(true);
      
      // 메타데이터 JSON 생성 (순서 명시)
      const metaData = {
        name: formData.name || formData.address.split(' ')[0] || formData.address, // 가게명 우선, 없으면 주소 첫 단어
        address: formData.address,
        description: formData.description,
        tags: selectedTags // 선택된 태그 그대로 전송
      };

      // JSON 문자열로 변환 (순서 보장)
      const metaJsonString = JSON.stringify(metaData, ['name', 'address', 'description', 'tags']);

      // multipart/form-data 생성 (인앱 웹뷰 호환을 위해 파일명 명시)
      const formDataToSend = new FormData();
      formDataToSend.append('meta', metaJsonString); // 순서가 보장된 JSON 문자열
      const uploadFile = formData.photos[0].file;
      const safeFileName = (uploadFile as File).name || 'photo.jpg';
      formDataToSend.append('image', uploadFile, safeFileName);

      // 디버그: 서버에 최종 전송되는 페이로드 콘솔 출력
      const debugPayload = {
        name: metaData.name,
        address: metaData.address,
        description: metaData.description,
        tags: metaData.tags,
        imageFileName: safeFileName,
      };
      // 사용자가 확인하기 쉬운 형태로 출력
      console.log('[하이라이트 전송 페이로드]', JSON.stringify(debugPayload, null, 2));
      console.log('[하이라이트 meta JSON]', metaJsonString);

      // API 호출
      const response = await apiWithAuth(`${process.env.NEXT_PUBLIC_API_BASE_URL}/place`, {
        method: 'POST',
        body: formDataToSend
      });
      
      if (response.ok) {
        // 성공 시 localStorage 정리
        localStorage.removeItem(HIGHLIGHT_DRAFT_KEY);
        
        showToast('success', '하이라이트가 성공적으로 등록되었습니다!');
      
        setTimeout(() => router.push('/main'), 1500);
      } else {
        let result: unknown = null;
        try {
          result = await response.json();
        } catch {}
        console.error('[하이라이트 전송 실패]', response.status, result);
        const message = result && typeof result === 'object' && 'error' in result ? (result as { error: string }).error : '알 수 없는 오류가 발생했습니다.';
        showToast('error', `등록 실패: ${message}`);
      }
      
    } catch {
      showToast('error', '하이라이트 등록 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const isFormValid = formData.address && formData.photos.length > 0 && !isUploading;

  return (
    <div className="min-h-screen bg-white">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 left-0 right-0 z-50 p-4">
          <Notification
            type={toast.type}
            onClose={() => setToast(null)}
          >
            {toast.message}
          </Notification>
        </div>
      )}

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
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 text-base font-pretendard font-semibold leading-[19.2px]">
                빠른 리뷰 (최대 {MAX_TAGS}개)
              </span>
              <span className="text-gray-500 text-sm font-pretendard font-normal">
                {selectedTags.length}/{MAX_TAGS}
              </span>
            </div>

            {/* 모든 카테고리 태그를 한 번에 표시 */}
            <div className="flex gap-10 overflow-x-auto scrollbar-hide pb-1">
              {tagCategories.map((category) => (
                <div key={category.name} className="min-w-[140px] flex-shrink-0">
                  <div className="text-gray-600 text-sm font-pretendard font-medium mb-6">
                    {category.name}
                  </div>
                  <div className="flex flex-col gap-4">
                    {category.tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTagToggle(tag)}
                        className={`w-full text-center px-3 py-2 rounded-lg text-sm font-pretendard font-medium transition-all whitespace-nowrap border ${
                          selectedTags.includes(tag)
                            ? 'bg-brand-50 border-brand-300 text-brand-600'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>
      </div>

      {/* 하단 버튼 */}
      <div className="px-6 py-8">
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

export default function HighlightUploadPage() {
  return (
    <Suspense fallback={null}>
      <HighlightUploadContent />
    </Suspense>
  );
}
