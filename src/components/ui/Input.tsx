'use client';

import React, { forwardRef } from 'react';
import Image from 'next/image';

type InputType = 'text' | 'icon' | 'password';
type TextVariant = 'placeholder' | 'disabled' | 'default' | 'textarea' | 'textareaDisabled' | 'focus';
type IconVariant = 'placeholder' | 'default' | 'disabled' | 'focus';

interface BaseInputProps {
  type?: InputType;
  className?: string;
  fullWidth?: boolean;
}

interface TextInputProps extends BaseInputProps, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  type: 'text' | 'password';
  variant?: TextVariant;
  helperText?: string;
  label?: string;
  rows?: number;
}

interface IconInputProps extends BaseInputProps, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  type: 'icon';
  variant?: IconVariant;
  icon?: React.ReactNode;
  iconType?: 'search' | 'close';
  helperText?: string;
  label?: string;
  onIconClick?: () => void;
}

type InputProps = TextInputProps | IconInputProps;

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  props,
  ref
) {
  const {
    type = 'text',
    className = '',
    fullWidth = true,
    // ...rest
  } = props;

  const base = 'font-pretendard text-sm leading-[19.6px] px-4 h-[52px] rounded-lg border transition-colors focus:outline-none text-sm';
  const widthClass = fullWidth ? 'w-full' : '';

  /** text 계열 */
  const renderText = (p: TextInputProps) => {
    const { variant = 'default', helperText, label, rows = 4, ...textProps } = p;

    const textVariants: Record<TextVariant, string> = {
      placeholder: 'bg-gray-100 border border-gray-300 text-gray-500 placeholder:text-gray-500',
      disabled: 'bg-gray-200 border border-gray-300 text-gray-700 cursor-not-allowed placeholder:text-gray-500',
      default: 'bg-gray-100 border border-gray-300 text-gray-700 placeholder:text-gray-700',
      textarea: 'bg-gray-100 border border-gray-300 text-gray-500 min-h-[120px] h-auto py-4 resize-none placeholder:text-gray-500',
      textareaDisabled: 'bg-gray-200 border border-gray-300 text-gray-700 cursor-not-allowed min-h-[120px] h-auto py-4 resize-none placeholder:text-gray-500',
      focus: 'bg-gray-100 border border-brand-500 text-gray-700 placeholder:text-gray-700',
    };

    const isTextarea = variant === 'textarea' || variant === 'textareaDisabled';
    const isDisabled = variant === 'disabled' || variant === 'textareaDisabled';

    return (
      <div className={`${widthClass}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2 font-pretendard">
            {label}
          </label>
        )}
        {isTextarea ? (
          <textarea
            rows={rows}
            className={[base, textVariants[variant], widthClass, className].join(' ')}
            disabled={isDisabled}
            {...(textProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            ref={ref}
            className={[base, textVariants[variant], widthClass, className].join(' ')}
            disabled={isDisabled}
            {...textProps}
          />
        )}
        {helperText && (
          <p className="mt-1 text-sm text-gray-600 font-pretendard">
            {helperText}
          </p>
        )}
      </div>
    );
  };

  /** icon 계열 */
  const renderIcon = (p: IconInputProps) => {
    const { variant = 'default', helperText, label, onIconClick, iconType = 'search', ...iconProps } = p;

    const iconVariants: Record<IconVariant, string> = {
      placeholder: 'bg-gray-100 border border-gray-300 text-gray-500 placeholder:text-gray-500',
      default: 'bg-gray-100 border border-gray-300 text-gray-700 placeholder:text-gray-700',
      disabled: 'bg-gray-200 border border-gray-300 text-gray-700 cursor-not-allowed placeholder:text-gray-500',
      focus: 'bg-gray-100 border border-brand-500 text-gray-700 placeholder:text-gray-700',
    };

    const isDisabled = variant === 'disabled';
    const iconColor = isDisabled ? 'text-gray-500' : 'text-gray-700';

    return (
      <div className={`${widthClass}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2 font-pretendard">
            {label}
          </label>
        )}
      <div className="relative">
        <input
          ref={ref}
            className={[base, iconVariants[variant], widthClass, 'pr-12', className].join(' ')}
            disabled={isDisabled}
            {...iconProps}
          />
          <div 
            className={`absolute inset-y-0 right-0 flex items-center pr-4 ${iconColor} ${onIconClick ? 'cursor-pointer' : ''}`}
            onClick={onIconClick}
          >
            <Image 
              src={iconType === 'close' ? "/images/common/close.svg" : "/images/common/search.svg"} 
              alt={iconType === 'close' ? "Close" : "Search"} 
              width={14}
              height={14}
              className="w-3.5 h-3.5" 
            />
          </div>
        </div>
        {helperText && (
          <p className="mt-1 text-sm text-gray-600 font-pretendard">
            {helperText}
          </p>
        )}
      </div>
    );
  };

  if (type === 'text' || type === 'password') return renderText(props as TextInputProps);
  return renderIcon(props as IconInputProps);
});

Input.displayName = 'Input';

export default Input;
