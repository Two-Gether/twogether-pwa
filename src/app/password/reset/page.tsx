"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import Image from 'next/image';
import { Header, Input, Button } from '@/components/ui';
import Notification from '@/components/ui/Notification';
import { forgotPasswordApi, verifyPasswordResetCodeApi, resetPasswordApi } from '@/api/auth';
import { PASSWORD_RULE } from '@/utils/validation';

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'default';

export default function PasswordResetPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [resetTicket, setResetTicket] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const [toast, setToast] = useState<{ type: ToastType; message: string; visible: boolean }>({ type: 'default', message: '', visible: false });
  const toastTimerRef = useRef<number | null>(null);

  const showToast = (type: ToastType, message: string, durationMs = 2000) => {
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    setToast({ type, message, visible: true });
    toastTimerRef.current = window.setTimeout(() => setToast(prev => ({ ...prev, visible: false })), durationMs);
  };

  useEffect(() => () => {
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setInterval(() => setResendTimer(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [resendTimer]);

  const isVerified = resetTicket !== null;

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (isCodeSent) {
      setIsCodeSent(false);
      setVerificationCode('');
      setResendTimer(0);
    }
  };

  const restartFlow = () => {
    setResetTicket(null);
    setIsCodeSent(false);
    setVerificationCode('');
    setResendTimer(0);
    setPassword('');
    setConfirmPassword('');
  };
  const passwordValid = PASSWORD_RULE.test(password);
  const passwordMatch = confirmPassword.length > 0 && password === confirmPassword;

  const handleSendCode = async () => {
    if (!email.trim()) {
      showToast('warning', '이메일을 입력해주세요.');
      return;
    }
    setIsSending(true);
    try {
      await forgotPasswordApi(email.trim());
      setIsCodeSent(true);
      setResendTimer(60);
      showToast('success', '인증 코드가 전송되었습니다.');
    } catch {
      showToast('error', '발송에 실패했습니다. 가입된 이메일인지 확인해주세요.');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      showToast('warning', '인증코드를 입력해주세요.');
      return;
    }
    setIsVerifying(true);
    try {
      const ticket = await verifyPasswordResetCodeApi(email.trim(), verificationCode.trim());
      setResetTicket(ticket);
      showToast('success', '이메일 인증이 완료되었습니다.');
    } catch {
      showToast('error', '인증에 실패했습니다. 코드를 다시 확인해주세요.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetTicket) {
      showToast('warning', '이메일 인증을 먼저 완료해주세요.');
      return;
    }
    if (!passwordValid) {
      showToast('warning', '비밀번호 형식을 확인해주세요.');
      return;
    }
    if (!passwordMatch) {
      showToast('warning', '비밀번호가 일치하지 않습니다.');
      return;
    }
    setIsSubmitting(true);
    try {
      await resetPasswordApi(email.trim(), resetTicket, password);
      showToast('success', '비밀번호가 변경되었습니다. 다시 로그인해주세요.');
      window.setTimeout(() => router.replace('/login'), 1500);
    } catch {
      showToast('error', '비밀번호 변경에 실패했습니다. 처음부터 다시 시도해주세요.');
      restartFlow();
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {toast.visible && (
        <div className="fixed top-4 left-0 right-0 z-50 px-5">
          <Notification type={toast.type} variant="toast">{toast.message}</Notification>
        </div>
      )}
      <Header title="비밀번호 찾기" showBackButton={true} />

      <div className="px-5 py-6">
        <div className="mb-2">
          <h3 className="text-gray-800 font-pretendard text-base font-semibold mb-4">
            가입한 이메일
          </h3>
          <div className="flex gap-4">
            <Input
              type="text"
              variant={isVerified ? 'disabled' : 'placeholder'}
              placeholder="이메일을 입력해주세요"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              inputMode="email"
              autoComplete="email"
            />
            {!isVerified && (
              <Button
                kind="auth"
                onClick={handleSendCode}
                disabled={resendTimer > 0 || isSending}
                state={isSending ? 'loading' : 'active'}
                style={{ minWidth: '113px', maxWidth: 'none' }}
              >
                {resendTimer > 0 ? `${resendTimer}초` : (isCodeSent ? '재발송' : '인증코드 받기')}
              </Button>
            )}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex gap-4">
            <Input
              type="text"
              variant={isVerified ? 'disabled' : 'placeholder'}
              placeholder="인증코드를 입력해주세요"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
            />
            <Button
              kind="auth"
              onClick={handleVerifyCode}
              disabled={isVerified || isVerifying || !isCodeSent}
              state={isVerified ? 'success' : (isVerifying ? 'loading' : 'default')}
              style={{ minWidth: '113px', maxWidth: 'none' }}
            >
              {isVerified ? '인증완료' : (isVerifying ? '인증 중...' : '인증하기')}
            </Button>
          </div>
        </div>

        {isVerified && (
          <div className="mb-6">
            <h3 className="text-gray-800 font-pretendard text-base font-semibold leading-[19.2px] mb-4">
              새 비밀번호
            </h3>
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type={isPasswordVisible ? 'text' : 'password'}
                  variant={passwordFocused ? 'focus' : 'placeholder'}
                  placeholder="새 비밀번호를 입력해주세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  autoComplete="new-password"
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
                  variant={confirmPasswordFocused ? 'focus' : 'placeholder'}
                  placeholder="새 비밀번호를 다시 입력해주세요"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setConfirmPasswordFocused(true)}
                  onBlur={() => setConfirmPasswordFocused(false)}
                  autoComplete="new-password"
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
            {confirmPassword && (
              <div className="flex items-center gap-1 mt-2">
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
        )}

        <Button
          kind="functional"
          styleType="fill"
          tone="brand"
          fullWidth
          onClick={handleResetPassword}
          disabled={!isVerified || !passwordValid || !passwordMatch || isSubmitting}
          loading={isSubmitting}
        >
          비밀번호 변경
        </Button>
      </div>
    </div>
  );
}
