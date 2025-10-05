"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import Image from 'next/image';
import { Header, Input, Button, Dropdown } from '@/components/ui';
import Notification from '@/components/ui/Notification';

export default function SignupPage() {
  const router = useRouter();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState('남자');
  const [ageRange, setAgeRange] = useState('10세~19세');
  const [phone, setPhone] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [isVerificationCompleted, setIsVerificationCompleted] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [passwordValid, setPasswordValid] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning' | 'info' | 'default'; message: string; visible: boolean }>({ type: 'default', message: '', visible: false });

  const showToast = (type: 'success' | 'error' | 'warning' | 'info' | 'default', message: string, durationMs = 2000) => {
    setToast({ type, message, visible: true });
    window.setTimeout(() => setToast(prev => ({ ...prev, visible: false })), durationMs);
  };

  // 재발송 타이머 관리
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [resendTimer]);

  // 비밀번호 유효성 검사
  useEffect(() => {
    const isValid = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
    setPasswordValid(isValid);
  }, [password]);

  // 비밀번호 일치 여부 확인
  useEffect(() => {
    if (confirmPassword) {
      setPasswordMatch(password === confirmPassword);
    } else {
      setPasswordMatch(false);
    }
  }, [password, confirmPassword]);

  const handleSendVerificationCode = async () => {
    if (!email.trim()) {
      showToast('warning', '이메일을 입력해주세요.');
      return;
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/member/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const message = await res.text().catch(async () => {
        try { const json = await res.json(); return json?.message || ''; } catch { return ''; }
      });
      setIsVerificationSent(true);
      setResendTimer(60); // 60초 타이머 시작
      showToast('success', message || '인증 코드가 전송되었습니다.');
    } catch {
      showToast('error', '발송에 실패했습니다. 다시 시도해주세요.');
    } finally {
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      showToast('warning', '인증코드를 입력해주세요.');
      return;
    }
    
    setIsVerifying(true);
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/member/email/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode }),
      });
      
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      
      setIsVerificationCompleted(true);
      setIsEmailVerified(true);
      showToast('success', '이메일 인증이 완료되었습니다.');
    } catch {
      showToast('error', '인증에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword || !name || !phone) {
      showToast('warning', '모든 필수 항목을 입력해주세요.');
      return;
    }
    if (password !== confirmPassword) {
      showToast('warning', '비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!isEmailVerified) {
      showToast('warning', '이메일 인증을 완료해주세요.');
      return;
    }
    if (!privacyAgreed) {
      showToast('warning', '개인정보 수집 및 활용에 동의해주세요.');
      return;
    }

    try {
      // 데이터를 API 형식에 맞게 변환
      const signupData = {
        email: email,
        password: password,
        name: name,
        phoneNumber: phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3'), // 하이픈 추가
        gender: gender === "남자" ? "MALE" : "FEMALE",
        ageRange: ageRange.match(/^(\d+)세/)?.[1] || "20" // 첫 번째 숫자만 추출
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/member/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      const data = await res.json();
      console.log('Signup success:', data);
      
      // 성공 시 처리
      showToast('success', '회원가입이 완료되었습니다!');
      
      // 로그인 페이지로 이동
      window.setTimeout(() => { router.push('/login'); }, 1500);
      
    } catch (error) {
      console.error('Signup error:', error);
      showToast('error', '회원가입에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {toast.visible && (
        <div className="fixed top-4 left-0 right-0 z-50 px-5">
          <Notification type={toast.type} variant="toast">{toast.message}</Notification>
        </div>
      )}
      {/* Header */}
      <Header title="회원가입" showBackButton={true} />

      {/* Main Content */}
      <div className="px-5 py-6">
        {/* Email Section */}
        <div className="mb-2">
          <h3 className="text-gray-800 font-pretendard text-base font-semibold mb-4">
            이메일(아이디)
          </h3>
          <div className="flex gap-4">
            <Input
              type="text"
              variant={isVerificationCompleted ? "disabled" : "placeholder"}
              placeholder="이메일을 입력해주세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              inputMode="email"
              autoComplete="email"
            />
            {!isVerificationCompleted && (
              <Button
                kind="auth"
                onClick={handleSendVerificationCode}
                disabled={resendTimer > 0}
                state="active"
                style={{ minWidth: '113px', maxWidth: 'none' }}
              >
                {resendTimer > 0 ? `${resendTimer}초` : (isVerificationSent ? '재발송' : '인증코드 받기')}
              </Button>
            )}
          </div>
        </div>

        {/* Verification Code Section */}
        <div className="mb-6">
          <div className="flex gap-4">
            <Input
              type="text"
              variant={isVerificationCompleted ? "disabled" : "placeholder"}
              placeholder="인증코드를 입력해주세요"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
            />
            <Button
              kind="auth"
              onClick={isVerificationCompleted ? () => {} : handleVerifyCode}
              disabled={isVerifying}
              state={isVerificationCompleted ? 'success' : (isVerifying ? 'loading' : 'default')}
              style={{ minWidth: '113px', maxWidth: 'none' }}
            >
              {isVerificationCompleted ? '인증완료' : (isVerifying ? '인증 중...' : '인증하기')}
            </Button>
          </div>
        </div>

        {/* Password Section */}
        <div className="mb-6">
          <h3 className="text-gray-800 font-pretendard text-base font-semibold leading-[19.2px] mb-4">
            비밀번호
          </h3>
          <div className="space-y-2">
            <div className="relative">
              <Input
                type={isPasswordVisible ? 'text' : 'password'}
                variant={passwordFocused ? "focus" : "placeholder"}
                placeholder="비밀번호를 입력해주세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
              <button
                type="button"
                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                aria-label="비밀번호 표시 토글"
              >
                <Image 
                  src={isPasswordVisible ? '/images/common/pw_open.svg' : '/images/common/pw_close.svg'} 
                  alt="Toggle Password Visibility" 
                  width={20} 
                  height={20} 
                />
              </button>
            </div>
            <div className="relative">
              <Input
                type={isConfirmPasswordVisible ? 'text' : 'password'}
                variant={confirmPasswordFocused ? "focus" : "placeholder"}
                placeholder="비밀번호를 다시 입력해주세요"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={() => setConfirmPasswordFocused(true)}
                onBlur={() => setConfirmPasswordFocused(false)}
              />
              <button
                type="button"
                onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                aria-label="비밀번호 확인 표시 토글"
              >
                <Image 
                  src={isConfirmPasswordVisible ? '/images/common/pw_open.svg' : '/images/common/pw_close.svg'} 
                  alt="Toggle Confirm Password Visibility" 
                  width={20} 
                  height={20} 
                />
              </button>
            </div>
            {confirmPassword && (
              <div className="flex items-center gap-1 mt-8">
                {passwordMatch ? (
                  <Check size={16} className="text-semantic-success" />
                ) : (
                  <Image src="/images/common/error.svg" alt="error" width={16} height={16} />
                )}
                <span className={`font-pretendard text-sm ${passwordMatch ? 'text-semantic-success' : 'text-semantic-error'}`}>
                  {passwordMatch ? '비밀번호가 일치해요' : '비밀번호가 일치하지 않아요'}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 mt-4">
            {passwordValid ? (
              <Check size={16} className="text-semantic-success" />
            ) : (
              <Image src="/images/common/error.svg" alt="error" width={16} height={16} />
            )}
            <span className={`font-pretendard text-sm ${passwordValid ? 'text-semantic-success' : 'text-semantic-error'}`}>
              영문, 숫자, 특수문자 조합 8자리 이상
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="w-255px h-px bg-gray-200 my-10 -mx-5" style={{ height: '8px' }}></div>

        {/* Name Section */}
        <div className="mb-7">
          <h3 className="text-gray-800 font-pretendard text-base font-semibold leading-[19.2px] mb-4">
            이름
          </h3>
          <Input
            type="text"
            variant="placeholder"
            placeholder="이름을 입력해주세요"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Gender and Age Section */}
        <div className="mb-7">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-gray-800 font-pretendard text-base font-semibold leading-[19.2px] mb-4">
                성별
              </h3>
              <Dropdown
                options={[
                  { value: '남자', label: '남자' },
                  { value: '여자', label: '여자' }
                ]}
                value={gender}
                onChange={setGender}
                placeholder="성별을 선택해주세요"
              />
            </div>
            <div>
              <h3 className="text-gray-800 font-pretendard text-base font-semibold leading-[19.2px] mb-4">
                연령대
              </h3>
              <Dropdown
                options={[
                  { value: '10세~19세', label: '10세~19세' },
                  { value: '20세~29세', label: '20세~29세' },
                  { value: '30세~39세', label: '30세~39세' },
                  { value: '40세~49세', label: '40세~49세' },
                  { value: '50세 이상', label: '50세 이상' }
                ]}
                value={ageRange}
                onChange={setAgeRange}
                placeholder="연령대를 선택해주세요"
              />
            </div>
          </div>
        </div>

        {/* Phone Section */}
        <div className="mb-7">
          <h3 className="text-gray-800 font-pretendard text-base font-semibold leading-[19.2px] mb-4">
            연락처
          </h3>
          <Input
            type="text"
            variant="placeholder"
            placeholder="-없이 입력해주세요"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            autoComplete="tel"
          />
        </div>

        {/* Privacy Agreement */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setPrivacyAgreed(!privacyAgreed)}
              className={`w-5 h-5 bg-white rounded-full border border-gray-300 flex items-center justify-center flex-shrink-0 ${
                privacyAgreed ? 'border-brand-500 bg-brand-50' : 'hover:border-gray-400'
              }`}
            >
              {privacyAgreed && (
                <Image 
                  src="/images/common/checkbox.svg"
                  alt="checked"
                  width={16}
                  height={16}
                />
              )}
            </button>
            <div className="flex-1 flex items-center">
              <p className="text-gray-700 text-sm font-pretendard font-normal">
                개인정보 수집 및 활용에 동의합니다.{' '}
                <a 
                  href="https://reflective-brush-deb.notion.site/26e096f283e2800c9bf5f45e92fcd669?pvs=74" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-brand-500 underline hover:text-brand-600"
                >
                  [약관보기]
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Signup Button */}
        <Button
          kind="functional"
          styleType="fill"
          tone="brand"
          fullWidth
          onClick={handleSignup}
        >
          가입하기
        </Button>
      </div>
    </div>
  );
}
