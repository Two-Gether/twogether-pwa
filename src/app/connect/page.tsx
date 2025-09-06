"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/auth/useAuth';
import Image from 'next/image';
import { ChevronLeft } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function ConnectPage() {
  const [partnerCode, setPartnerCode] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [myPartnerCode, setMyPartnerCode] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();
  const { user, accessToken, updateUser, login } = useAuthStore();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 내 파트너 코드 조회
  useEffect(() => {
    if (!isClient || !accessToken) return;
    
    fetch('/api/partner/code', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        });
      }
      return response.text();
    })
    .then(code => {
      setMyPartnerCode(code.trim());
    })
    .catch(error => {
      console.log(error);
      setMyPartnerCode('조회 실패');
    });
  }, [isClient, accessToken]);

  const handleConnectPartner = () => {
    if (!partnerCode.trim()) {
      setErrorMessage('파트너 코드를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    fetch(`/api/partner/connect?code=${partnerCode}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
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
          throw new Error(errorData.error || '연인 연동에 실패했어요.');
        });
      }
      return response.json();
    })
    .then(data => {
      if (user) {
        updateUser({
          ...user,
          partnerId: data.partnerId,
          partnerNickname: data.partnerNickname,
        });
      }
      router.push('/main');
    })
    .catch(error => {
      console.log(error);
      setErrorMessage(error.message || '연인 연동에 실패했어요.');
    })
    .finally(() => setIsLoading(false));
  };

  const handleRefreshToken = async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }
    try {
      setIsRefreshing(true);
      const res = await fetch('/api/token/refresh', {
        method: 'POST',
      });
      if (!res.ok) {
        alert(`재발급 실패 (${res.status})`);
        return;
      }
      const data = await res.json();
      const newToken = data.accessToken || data.token || data.data?.accessToken;
      if (!newToken) {
        alert('재발급 토큰이 없습니다.');
        return;
      }
      login({ user, accessToken: newToken });
      alert('토큰이 재발급되었습니다.');
    } catch {
      alert('토큰 재발급 중 오류가 발생했습니다.');
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

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mx-4 mt-4 rounded">
          {errorMessage}
        </div>
      )}

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
      
      {/* 토큰 재발급 키 - 오른쪽 하단 고정 */}
      <button
        onClick={handleRefreshToken}
        disabled={isRefreshing}
        className="absolute bottom-6 right-6 mb-10 w-12 h-12 bg-brand-500 rounded-full flex items-center justify-center shadow-lg hover:bg-brand-600 transition-colors disabled:opacity-50 z-50"
      >
        <div className="relative w-6 h-6">
          <Image 
            src="/images/common/reload.svg" 
            alt="Reload" 
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
    </div>
  );
}
