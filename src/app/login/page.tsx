"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuthStore } from '@/hooks/auth/useAuth';
import { loginApi, getKakaoAuthUrl, checkKakaoLoginStatus } from '@/api/auth';
import { useGoogleAuth } from '@/hooks/auth/useGoogleAuth';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const LoginScreen = () => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isKakaoLoading, setIsKakaoLoading] = useState(false);
    const router = useRouter();
    const { login, isAuthenticated, accessToken } = useAuthStore();
    // const { googleLogin } = useGoogleAuth();

    // 이미 인증된 사용자는 메인 페이지로 리다이렉트
    useEffect(() => {
      if (isAuthenticated && accessToken) {
        router.replace('/main');
      }
    }, [isAuthenticated, accessToken, router]);

    const handleLogin = async () => {
        if (!email || !password) {
            window.alert('이메일과 비밀번호를 입력해주세요.');
            return;
        }
        
        try {
            const data = await loginApi({ email, password });

            // Auth store에 사용자 정보와 토큰 저장 (일반 로그인은 myNickname과 partnerNickname 사용)
            login({
                user: {
                    memberId: data.memberId,
                    nickname: data.myNickname ?? "", // 일반 로그인은 myNickname 사용
                    partnerId: data.partnerId,
                    partnerNickname: data.partnerNickname, // 일반 로그인은 partnerNickname 사용
                    relationshipStartDate: data.relationshipStartDate,
                },
                accessToken: data.accessToken,
            });
            
            // 상태 업데이트 후 페이지 이동 (약간의 지연)
            setTimeout(() => {
                if (data.partnerId === null) {
                    router.push('/connect');
                } else {
                    router.push('/main');
                }
            }, 100);
            
        } catch (error) {
            console.error('Login error:', error);
            window.alert('로그인에 실패했습니다. 다시 시도해주세요.');
        }
    };

    const handleKakaoLogin = async () => {
        try {
            // 1. 카카오 인증 URL 받기
            const kakaoAuthUrl = await getKakaoAuthUrl();
            
            // 2. 새 창으로 카카오 인증 페이지 열기
            const authWindow = window.open(
                kakaoAuthUrl, 
                'kakao_login', 
                'width=500,height=600,scrollbars=yes'
            );
            
            if (!authWindow) {
                throw new Error('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.');
            }
            
            // 3. 로딩 상태로 전환 (사용자 정보 대기)
            setIsKakaoLoading(true);
            
            // 4. 카카오 로그인 완료 대기 (폴링)
            const pollInterval = setInterval(async () => {
                const userData = await checkKakaoLoginStatus();
                
                if (userData) {
                    clearInterval(pollInterval);
                    authWindow.close();
                    
                    // Auth store에 사용자 정보와 토큰 저장
                    login({
                        user: {
                            memberId: userData.memberId,
                            nickname: userData.myNickname ?? "", 
                            partnerId: userData.partnerId,
                            partnerNickname: userData.partnerNickname,
                            relationshipStartDate: userData.relationshipStartDate,
                        },
                        accessToken: userData.accessToken,
                    });
                    
                    setIsKakaoLoading(false);
                    
                    // 파트너 연결 여부에 따라 페이지 이동
                    setTimeout(() => {
                        if (userData.partnerId === null) {
                            router.push('/connect');
                        } else {
                            router.push('/main');
                        }
                    }, 100);
                }
            }, 1000); // 1초마다 확인
            
            // 5. 타임아웃 (60초)
            setTimeout(() => {
                clearInterval(pollInterval);
                if (authWindow && !authWindow.closed) {
                    authWindow.close();
                }
                setIsKakaoLoading(false);
            }, 60000);
            
        } catch (error) {
            console.error('카카오 로그인 에러:', error);
            window.alert('카카오 로그인 실패: ' + (error as Error).message);
            setIsKakaoLoading(false);
        }
    };


    // const handleGoogleLogin = async () => {
    //     try {
    //         await googleLogin();
    //     } catch (error) {
    //         window.alert('구글 로그인 실패: ' + (error as Error).message);
    //     }
    // };

    const handleSocialLogin = (provider: 'kakao' | 'google' | 'apple') => {
        if (provider === 'kakao') {
            handleKakaoLogin();
        } else if (provider === 'google') {
            handleGoogleLogin();
        } else if (provider === 'apple') {
            // TODO: Apple 로그인 구현
            window.alert('Apple 로그인은 준비 중입니다.');
        }
    };

    const handleSignup = () => {
        router.push('/signup');
    };

    // 카카오 로딩 화면
    if (isKakaoLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
                <div className="bg-white rounded-lg p-8 max-w-md w-full text-center shadow-lg">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500"></div>
                    </div>
                    
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        카카오 로그인 중...
                    </h2>
                    <p className="text-gray-600 mb-4">
                        카카오 인증을 진행하고 있습니다.
                    </p>
                    
                    <div className="text-sm text-gray-500">
                        잠시만 기다려주세요
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-5 py-8 bg-gray-100">
            <div className="w-full max-w-sm">
                <h2 className="text-2xl font-bold text-center text-gray-800 font-pretendard my-8">로그인</h2>
                
                <div className="space-y-4 my-6">
                    <Input 
                        type="text"
                        placeholder="이메일을 입력해주세요"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <div className="relative">
                        <input
                            type={isPasswordVisible ? 'text' : 'password'}
                            placeholder="비밀번호를 입력해주세요"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent font-pretendard text-sm leading-[19.6px] bg-gray-100 placeholder:text-gray-700"
                        />
                        <button
                            type="button"
                            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                            className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
                        >
                            <Image 
                                src={isPasswordVisible ? '/images/common/pw_open.svg' : '/images/common/pw_close.svg'} 
                                alt="Toggle Password Visibility" 
                                width={20} 
                                height={20} 
                            />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col justify-between h-full">
                    <div>
                        <Button
                            kind="functional"
                            styleType="fill"
                            tone="brand"
                            fullWidth
                            onClick={handleLogin}
                        >
                            로그인
                        </Button>

                        <div className="flex justify-between items-center mt-4 mb-12">
                            <button 
                                onClick={handleSignup} 
                                className="text-brand-500 font-pretendard text-sm border-b border-brand-500 hover:font-semibold active:font-bold transition-all"
                            >
                                회원가입
                            </button>
                            {/* <button className="text-gray-500 hover:underline font-pretendard text-sm">아이디/비밀번호 찾기</button> */}
                        </div>
                    </div>

                    <div className="mt-10">
                        <div className="flex items-center justify-center mb-6">
                            <div className="flex-1 h-px bg-gray-300"></div>
                            <span className="px-4 text-gray-500 font-pretendard text-sm">or</span>
                            <div className="flex-1 h-px bg-gray-300"></div>
                        </div>

                        <div className="flex justify-center space-x-4">
                            <Image 
                                src="/images/social/kakao-logo.svg" 
                                alt="Kakao Login" 
                                width={48} 
                                height={48} 
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => handleSocialLogin('kakao')}
                            />
                            <Image 
                                src="/images/social/apple-logo.svg" 
                                alt="Kakao Login" 
                                width={48} 
                                height={48} 
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => handleSocialLogin('apple')}
                            />
                            {/* TODO: 구글 로그인 연동 예정
                              <Image 
                                  src="/images/social/google-logo.svg" 
                                  alt="Google Login" 
                                  width={48} 
                                  height={48} 
                                  className="cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => handleSocialLogin('google')}
                              />
                            */}
                        </div> 
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
