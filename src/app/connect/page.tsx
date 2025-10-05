"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, apiWithAuth } from '@/hooks/auth/useAuth';
import Image from 'next/image';
import { ChevronLeft } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Notification from '@/components/ui/Notification';

export default function ConnectPage() {
  const [partnerCode, setPartnerCode] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [myPartnerCode, setMyPartnerCode] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    show: false,
    message: '',
    type: 'success'
  });
  const router = useRouter();
  const { user, accessToken, updateUser } = useAuthStore();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 페이지 로드 시 사용자 정보 확인
  useEffect(() => {
    if (!isClient || !accessToken || !user) return;
    
    // 파트너가 이미 연결되어 있으면 main 페이지로 이동
    if (user.partnerId) {
      router.push('/main');
    }
  }, [isClient, accessToken, user, router]);

  // Toast 표시 함수
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({
      show: true,
      message,
      type
    });
    
    // 1.5초 후 자동으로 숨기기
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 1500);
  };

  // 임의로 파트너 코드 새로고침 (캐시 무시)
  const forceRefreshPartnerCode = async () => {
    if (!user?.memberId) {
      showToast('로그인 후 이용해주세요.', 'error');
      return;
    }
    try {
      setMyPartnerCode('로딩 중...');
      localStorage.removeItem('partnerCode');
      const response = await apiWithAuth(`${process.env.NEXT_PUBLIC_API_BASE_URL}/member/partner/code?memberId=${user.memberId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }

      const code = await response.text();
      const trimmedCode = code.trim();
      setMyPartnerCode(trimmedCode);
      localStorage.setItem('partnerCode', JSON.stringify({ code: trimmedCode, timestamp: Date.now() }));
      showToast('연인 코드가 갱신되었습니다.', 'success');
    } catch (error) {
      console.log(error);
      showToast('코드 갱신 실패', 'error');
    }
  };

  // 내 파트너 코드 조회 (3시간마다 새로 요청)
  useEffect(() => {
    if (!isClient || !accessToken) return;
    
    const fetchPartnerCode = async () => {
      try {
        if (!user?.memberId) {
          setMyPartnerCode('사용자 정보 없음');
          return;
        }
        const response = await apiWithAuth(`${process.env.NEXT_PUBLIC_API_BASE_URL}/member/partner/code?memberId=${user.memberId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        const code = await response.text();
        const trimmedCode = code.trim();
        setMyPartnerCode(trimmedCode);
        
        // localStorage에 코드와 시간 저장
        const codeData = {
          code: trimmedCode,
          timestamp: Date.now()
        };
        localStorage.setItem('partnerCode', JSON.stringify(codeData));
        
        // 3시간 후에 다시 요청하도록 타이머 설정
        const threeHours = 3 * 60 * 60 * 1000; // 3시간을 밀리초로 변환
        setTimeout(() => {
          fetchPartnerCode();
        }, threeHours);
        
      } catch (error) {
        console.log(error);
        setMyPartnerCode('조회 실패');
      }
    };
    
    // localStorage에서 이전 코드 확인
    const cachedCodeData = localStorage.getItem('partnerCode');
    if (cachedCodeData) {
      try {
        const { code, timestamp } = JSON.parse(cachedCodeData);
        const threeHours = 3 * 60 * 60 * 1000;
        const now = Date.now();
        
        if (now - timestamp < threeHours) {
          // 3시간이 지나지 않았으면 캐시된 코드 사용
          setMyPartnerCode(code);
          
          // 남은 시간 후에 새로 요청
          const remainingTime = threeHours - (now - timestamp);
          setTimeout(() => {
            fetchPartnerCode();
          }, remainingTime);
        } else {
          // 3시간이 지났으면 새로 요청
          fetchPartnerCode();
        }
      } catch (error) {
        console.log('캐시된 코드 파싱 실패:', error);
        fetchPartnerCode();
      }
    } else {
      // 캐시된 코드가 없으면 새로 요청
      fetchPartnerCode();
    }
  }, [isClient, accessToken]);

  const handleConnectPartner = () => {
    if (!partnerCode.trim()) {
      showToast('파트너 코드를 입력해주세요.', 'error');
      return;
    }

    setIsLoading(true);

    apiWithAuth(`${process.env.NEXT_PUBLIC_API_BASE_URL}/member/partner/connect?code=${partnerCode}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nickname: user?.nickname || '사용자',
        partnerId: 1,
        accessToken: accessToken,
        partnerNickname: '연결한 파트너',
        memberId: user?.memberId || 0,
      }),
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          console.error('파트너 연결 API 에러:', response.status, errorData);
          throw new Error(errorData.error || '연인 연동에 실패했어요.');
        });
      }
      return response.json();
    })
    .then(data => {
      if (user) {
        const updatedUser = {
          ...user,
          partnerId: data.partnerId,
          partnerNickname: data.partnerNickname,
        };
        updateUser(updatedUser);

        // 성공 시 바로 main 페이지로 이동 (Toast는 main 페이지에서 표시)
        router.push('/main?success=partner_connected');
      }
    })
    .catch(error => {
      console.log(error);
      const errorMsg = error.message || '연인 연동에 실패했어요.';
      
      // 실패 Toast 표시
      showToast(errorMsg, 'error');
    })
    .finally(() => setIsLoading(false));
  };

  const handleRefreshUserInfo = async () => {
    if (!accessToken) {
      alert('로그인이 필요합니다.');
      return;
    }
    try {
      setIsRefreshing(true);
      const res = await apiWithAuth(`${process.env.NEXT_PUBLIC_API_BASE_URL}/member/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!res.ok) {
        alert(`사용자 정보 조회 실패 (${res.status})`);
        return;
      }
      
      const userData = await res.json();
      console.log('=== 사용자 정보 새로고침 ===');
      console.log('받아온 사용자 정보:', userData);
      
      // 사용자 정보 업데이트
      updateUser(userData);
      
      // 파트너 아이디가 있으면 자동으로 main 페이지로 이동
      if (userData.partnerId) {
        console.log('파트너가 연결되어 있습니다. main 페이지로 이동합니다.');
        showToast('파트너가 이미 연결되어 있습니다!', 'success');
        setTimeout(() => {
          router.push('/main');
        }, 1500);
      } else {
        console.log('파트너가 연결되지 않았습니다.');
        showToast('사용자 정보가 새로고침되었습니다.', 'success');
      }
    } catch (error) {
      console.error('사용자 정보 조회 중 오류:', error);
      alert('사용자 정보 조회 중 오류가 발생했습니다.');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="w-full p-5 bg-white flex justify-between items-center">
        <div className="flex items-center gap-1">
          <button 
            onClick={() => router.push('/login')}
            className="flex items-center justify-center relative"
          >
            <ChevronLeft size={14} className="text-gray-700" />
          </button>
                      <div className="text-center text-gray-800 font-pretendard text-base font-normal">
              연동하기
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-8">
        {/* Warning Message */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-2 leading-[28.8px]">
            <span className="text-brand-500">잠깐! </span>
            <span className="text-gray-800">아직 내 연인과<br/>연결이 안 된 상태에요!</span>
          </h2>
          <p className="text-sm leading-[19.6px] text-gray-500 font-pretendard">
            연인과의 데이트를 위한 특화어플로<br/>상대 연인과 연동이 안되면 이용할 수 없어요..
          </p>
        </div>

        {/* My Partner Code */}
        <div className="mb-3 text-center mt-20">
          <h3 className="font-semibold mb-3 leading-[19.2px] text-gray-800 font-pretendard text-base">
            내 연인 코드
          </h3>
          <div className="relative">
            <Input 
              type="text"
              variant="disabled"
              value={myPartnerCode || '로딩 중...'}
              readOnly
              style={{ textAlign: 'center' }}
            />
            {/* 투명한 복사 버튼 */}
            <button
              onClick={async (e) => {
                e.preventDefault();
                if (!myPartnerCode) return;
                
                try {
                  // 권한 요청 및 복사
                  if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(myPartnerCode);
                    alert("클립보드에 복사되었습니다!");
                  } else {
                    // fallback 방법
                    const textArea = document.createElement('textarea');
                    textArea.value = myPartnerCode;
                    textArea.style.position = 'fixed';
                    textArea.style.left = '-999999px';
                    textArea.style.top = '-999999px';
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    
                    try {
                      document.execCommand('copy');
                      alert("클립보드에 복사되었습니다!");
                    } catch (err) {
                      console.error("복사 실패:", err);
                      alert("복사 실패!");
                    } finally {
                      document.body.removeChild(textArea);
                    }
                  }
                } catch (err) {
                  console.error("복사 실패:", err);
                  alert("복사 실패!");
                }
              }}
              className="absolute inset-0 w-full h-full bg-transparent cursor-pointer z-10"
              title="클릭하여 복사하기"
            />
          </div>
        </div>
        <div className="mt-2">
          <button
            onClick={forceRefreshPartnerCode}
            className="text-gray-500 hover:text-gray-700 underline text-xs"
          >
            코드 새로고침
          </button>
        </div>

        {/* Partner Code Registration */}
        <div>
          <button
            onClick={() => setShowModal(true)}
            className="w-full text-center flex items-center justify-center gap-2 text-gray-500 font-pretendard text-sm underline hover:no-underline transition-all"
          >
            연인 코드 직접등록
          </button>
        </div>
      </div>

      {/* Footer Illustration */}
      <div className="absolute bottom-6 left-0 mb-10 w-80 h-auto">
        <Image 
          src="/images/illust/cats/sadCouple.png" 
          alt="Sad Couple" 
          width={255} 
          height={255}
        />
      </div>
      
      {/* 사용자 정보 새로고침 버튼 - 오른쪽 하단 고정 */}
      <button
        onClick={handleRefreshUserInfo}
        disabled={isRefreshing}
        className="absolute bottom-6 right-6 mb-10 w-12 h-12 bg-brand-500 rounded-full flex items-center justify-center shadow-lg hover:bg-brand-600 transition-colors disabled:opacity-50 z-50"
        title="사용자 정보 새로고침"
      >
        <div className="relative w-6 h-6">
          <Image 
            src="/images/common/reload.svg" 
            alt="사용자 정보 새로고침" 
            width={50} 
            height={50}
          />
        </div>
      </button>

      {/* Modal */}
      {showModal && (
        <div 
          className="absolute inset-0 flex items-end justify-center z-50 bg-black bg-opacity-20"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-t-lg w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold font-pretendard">연인 코드 등록</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 text-xl"
              >
                ×
              </button>
            </div>
            
            <Input 
              type="text"
              variant="placeholder"
              placeholder="연인 코드를 입력하세요"
              value={partnerCode}
              onChange={(e) => setPartnerCode(e.target.value)}
              style={{ marginBottom: '20px' }}
            />
            
            <Button
              kind="functional"
              styleType="fill"
              tone="brand"
              fullWidth
              onClick={handleConnectPartner}
              disabled={isLoading}
            >
              {isLoading ? '연동 중...' : '연동하기'}
            </Button>
          </div>
        </div>
      )}

      {/* Toast Notification - 헤더를 덮도록 z-index 높게 설정 */}
      {toast.show && (
        <div className="fixed top-4 left-0 right-0 z-50 p-4">
          <Notification
            type={toast.type}
            onClose={() => setToast(prev => ({ ...prev, show: false }))}
          >
            {toast.message}
          </Notification>
        </div>
      )}
    </div>
  );
}
