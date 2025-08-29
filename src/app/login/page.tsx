"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useLogin, useSocialLogin } from '../../hooks/auth/useAuth';
import { useKakaoLogin } from '../../hooks/auth/useKakaoAuth';
import { useAuthStore } from '../../shared/hooks/useAuth';

const LoginScreen = () => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();
    const { login } = useAuthStore();

    const loginMutation = useLogin();
    const socialLoginMutation = useSocialLogin();
    const kakaoLoginMutation = useKakaoLogin();

    const handleLogin = () => {
        if (!email || !password) {
            window.alert('이메일과 비밀번호를 입력해주세요.');
            return;
        }

        loginMutation.mutate(
            { email, password },
            {
                onSuccess: () => {
                    // Navigate to main app
                },
                onError: (error) => {
                    window.alert('로그인 실패: ' + error.message);
                },
            }
        );
    };

    const handleKakaoLogin = () => {
        kakaoLoginMutation.mutate(undefined, {
            onSuccess: (data) => {
                // 로그인 성공 시 상태 저장
                login({
                    user: {
                        memberId: data.memberId,
                        nickname: data.nickname,
                        partnerId: data.partnerId,
                        partnerNickname: data.partnerNickname,
                    },
                    accessToken: data.accessToken,
                });
                
                // 파트너 ID가 null이면 매칭 페이지로, 아니면 메인 페이지로 이동
                if (data.partnerId === null) {
                    router.push('/matching');
                } else {
                    router.push('/main');
                }
            },
            onError: (error) => {
                window.alert('카카오 로그인 실패: ' + error.message);
            },
        });
    };

    const handleSocialLogin = (provider: 'naver' | 'kakao' | 'apple' | 'google') => {
        if (provider === 'kakao') {
            handleKakaoLogin();
        } else {
            socialLoginMutation.mutate({
                provider: provider,
                token: '', // 임시 토큰 값
            }, {
                onSuccess: () => {
                    // Navigate to main app
                },
                onError: (error) => {
                    window.alert('소셜 로그인 실패: ' + error.message);
                },
            });
        }
    };

    const handleSignup = () => {
        // Navigate to signup page
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-5 py-8 bg-gray-100">
            <div className="w-full max-w-sm">
                <h2 className="text-2xl font-bold text-center text-gray-800 font-gowun mb-8">로그인</h2>
                
                <div className="space-y-4 mb-6">
                    <input
                        type="email"
                        placeholder="이메일을 입력해주세요"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent font-pretendard"
                    />
                    <div className="relative">
                        <input
                            type={isPasswordVisible ? 'text' : 'password'}
                            placeholder="비밀번호를 입력해주세요"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent font-pretendard"
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

                <button
                    onClick={handleLogin}
                    className={`w-full py-3 text-white bg-brand-500 rounded-lg hover:bg-brand-600 font-gowun font-medium transition-colors ${loginMutation.isPending ? 'opacity-60 cursor-not-allowed' : ''}`}
                    disabled={loginMutation.isPending}
                >
                    {loginMutation.isPending ? '로그인 중...' : '로그인'}
                </button>

                <div className="text-center mt-4">
                    <button onClick={handleSignup} className="text-brand-500 hover:underline font-pretendard text-sm">
                        회원가입하기
                    </button>
                </div>

                <div className="flex justify-center space-x-6 mt-4">
                    <button className="text-gray-500 hover:underline font-pretendard text-sm">아이디 찾기</button>
                    <button className="text-gray-500 hover:underline font-pretendard text-sm">비밀번호 찾기</button>
                </div>

                <div className="flex items-center justify-center my-6">
                    <div className="flex-1 h-px bg-gray-300"></div>
                    <span className="px-4 text-gray-500 font-pretendard text-sm">or</span>
                    <div className="flex-1 h-px bg-gray-300"></div>
                </div>

                <div className="flex justify-center space-x-4">
                    <Image 
                        src="/images/icons/kakao-logo.svg" 
                        alt="Kakao Login" 
                        width={48} 
                        height={48} 
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleSocialLogin('kakao')}
                    />
                    <Image 
                        src="/images/icons/apple-logo.svg" 
                        alt="Apple Login" 
                        width={48} 
                        height={48} 
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleSocialLogin('apple')}
                    />
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
