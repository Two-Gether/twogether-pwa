'use client';

import React, { forwardRef } from 'react';

type FunctionalTone = 'brand' | 'gray' | 'sub';
type AuthState = 'default' | 'loading' | 'active' | 'success';

interface BaseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
}

/** functional 전용 */
interface FunctionalProps extends BaseProps {
  kind: 'functional';
  styleType?: 'fill' | 'outline';
  tone?: FunctionalTone;
  /** functional만 보통 꽉 채움 옵션 */
  fullWidth?: boolean;
}

/** auth 전용 */
interface AuthProps extends BaseProps {
  kind: 'auth';
  state?: AuthState; // 4종류
}

type ButtonProps = FunctionalProps | AuthProps;

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  props,
  ref
) {
  const {
    loading = false,
    icon,
    iconPosition = 'left',
    className = '',
    disabled,
    children,
    // ...rest
  } = props as ButtonProps;

  const base =
    'inline-flex items-center justify-center rounded-lg font-pretendard transition-colors select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm';

  /** functional 계열 (고정 높이 52px) */
  const renderFunctional = (p: FunctionalProps) => {
    const { styleType = 'fill', tone = 'brand', fullWidth, ...btnProps } = p;

    const size = 'h-[52px] px-5'; // 고정
    const width = fullWidth ? 'w-full' : '';

    const fill: Record<FunctionalTone, string> = {
      brand:
        'bg-brand-500 text-white font-semibold hover:bg-brand-600 active:bg-brand-700',
      gray:
        'bg-gray-200 text-gray-700 font-normal hover:bg-gray-300 active:bg-gray-400',
      sub: 'bg-gray-300 text-gray-500 font-normal hover:bg-gray-400 active:bg-gray-500',
    };

    const outline: Record<FunctionalTone, string> = {
      brand:
        'bg-gray-100 border border-brand-500 text-brand-500 font-semibold hover:bg-brand-50 active:bg-brand-100',
      gray:
        'bg-white border border-[#CCCCCC] text-gray-700 font-normal hover:bg-gray-50 active:bg-gray-100',
      sub: 'bg-gray-300 border border-gray-400 text-gray-500 font-normal hover:bg-gray-300 active:bg-gray-400',
    };

    const toneClass = styleType === 'fill' ? fill[tone] : outline[tone];

    return (
      <button
        ref={ref}
        className={[base, size, width, toneClass, className].join(' ')}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...btnProps}
      >
        {loading ? <Spinner /> : icon && iconPosition === 'left' ? <span className="mr-2">{icon}</span> : null}
        {children}
        {!loading && icon && iconPosition === 'right' ? (
          <span className="ml-2">{icon}</span>
        ) : null}
      </button>
    );
  };

  /** auth 계열 (디자인 고정 w/h: 113x52) */
  const renderAuth = (p: AuthProps) => {
    const { state = 'default', ...btnProps } = p;

    const fixed = 'w-[113px] h-[52px]';

    const byState: Record<AuthState, string> = {
      default: 'bg-gray-200 border border-gray-200 text-gray-700 font-normal hover:bg-gray-50',
      loading: 'bg-white text-gray-700 font-normal',
      active:
        'bg-brand-500 text-white font-bold hover:bg-brand-600 active:bg-brand-700',
      success:
        'bg-semantic-success text-white font-bold',
    };

    const currentState = state || 'default';
    const stateClass = byState[currentState];

    return (
      <button
        ref={ref}
        className={[base, fixed, stateClass, className].join(' ')}
        disabled={disabled || currentState === 'loading' || loading}
        aria-busy={loading || currentState === 'loading' || undefined}
        {...btnProps}
      >
        {loading || currentState === 'loading' ? <Spinner /> : null}
        {children}
      </button>
    );
  };

  if (props.kind === 'functional') return renderFunctional(props);
  return renderAuth(props as AuthProps);
});

function Spinner() {
  return (
    <svg
      className="animate-spin -ml-1 mr-2 w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export default Button;
