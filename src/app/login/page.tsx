"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuthStore } from '@/hooks/auth/useAuth';
import { loginApi, startKakaoLogin } from '@/api/auth';
import { useGoogleAuth } from '@/hooks/auth/useGoogleAuth';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const LoginScreen = () => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();
    const { login } = useAuthStore();
    const { googleLogin } = useGoogleAuth();

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
            await startKakaoLogin('/main');
        } catch (error) {
            window.alert('카카오 로그인 실패: ' + (error as Error).message);
        }
    };


    const handleGoogleLogin = async () => {
        try {
            await googleLogin();
        } catch (error) {
            window.alert('구글 로그인 실패: ' + (error as Error).message);
        }
    };

    const handleSocialLogin = (provider: 'kakao' | 'google') => {
        if (provider === 'kakao') {
            handleKakaoLogin();
        } else if (provider === 'google') {
            handleGoogleLogin();
        }
    };

    const handleSignup = () => {
        router.push('/signup');
    };

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

                    {/* <div className="mt-10">
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
                            {/* TODO: 구글 로그인 연동 예정
                              <Image 
                                  src="/images/social/google-logo.svg" 
                                  alt="Google Login" 
                                  width={48} 
                                  height={48} 
                                  className="cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => handleSocialLogin('google')}
                              />
                            
                        </div> 
                    </div>*/}
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
