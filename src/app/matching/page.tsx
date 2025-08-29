"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../shared/hooks/useAuth';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function MatchingPage() {
  const [partnerCode, setPartnerCode] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const { user, updateUser } = useAuthStore();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 내 파트너 코드 (임시로 생성)
  const myPartnerCode = isClient && user?.memberId ? `CD${user.memberId.toString().padStart(4, '0')}Z1` : 'CD35Z1';

  const handleConnectPartner = async () => {
    if (!partnerCode.trim()) {
      setErrorMessage('파트너 코드를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/member/partner/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ partnerCode }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // 사용자 정보 업데이트
        if (user) {
          updateUser({
            ...user,
            partnerId: data.partnerId,
            partnerNickname: data.partnerNickname,
          });
        }

        // 메인 페이지로 이동
        router.push('/main');
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || '연인 연동에 실패했어요.');
      }
    } catch (error) {
      setErrorMessage('연인 연동에 실패했어요.');
    } finally {
      setIsLoading(false);
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
          <div className="text-center text-gray-800 font-gowun text-base font-normal">
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
          <p className="text-sm leading-[19.6px] text-gray-500 font-gowun">
            연인과의 데이트를 위한 특화어플로<br/>상대 연인과 연동이 안되면 이용할 수 없어요..
          </p>
        </div>

        {/* My Partner Code */}
        <div className="mb-6 text-center mt-20">
          <h3 className="font-semibold mb-3 leading-[19.2px] text-gray-800 font-gowun text-base">
            내 연인 코드
          </h3>
          <div className="flex items-center justify-center p-4 rounded-lg bg-gray-100 border border-gray-200">
            <div className="text-center text-gray-800 font-gowun text-base font-normal">
              {myPartnerCode}
            </div>
          </div>
        </div>

        {/* Partner Code Registration */}
        <div>
          <button
            onClick={() => setShowModal(true)}
            className="w-full text-center flex items-center justify-center gap-2 text-gray-500 font-gowun text-sm"
          >
            연인 코드 등록
            <ChevronRight size={14} className="text-gray-800" />
          </button>
        </div>
      </div>

      {/* Footer Illustration */}
      <div className="absolute bottom-6 right-6 mb-10">
        <Image 
          src="/images/illust/cats/sad_cat.svg" 
          alt="Sad Cat" 
          width={300} 
          height={300}
        />
      </div>

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
              <h3 className="text-lg font-semibold font-gowun">연인 코드 등록</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 text-xl"
              >
                ×
              </button>
            </div>
            
            <input
              type="text"
              placeholder="연인 코드를 입력하세요"
              value={partnerCode}
              onChange={(e) => setPartnerCode(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent font-gowun"
            />
            
            <button
              onClick={handleConnectPartner}
              disabled={isLoading}
              className="w-full bg-brand-500 text-white py-3 rounded-lg font-medium hover:bg-brand-600 disabled:opacity-50 transition-colors font-gowun"
            >
              {isLoading ? '연동 중...' : '연동하기'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
