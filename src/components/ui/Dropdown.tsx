'use client';

import React, { forwardRef, useState } from 'react';
import Image from 'next/image';

interface BaseDropdownProps {
  className?: string;
  fullWidth?: boolean;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  openUpward?: boolean;
  style?: React.CSSProperties;
}

const Dropdown = forwardRef<HTMLDivElement, BaseDropdownProps>(function Dropdown(
  props,
  ref
) {
  const {
    className = '',
    // fullWidth = true,
    options,
    value,
    onChange,
    placeholder = '선택해주세요',
    openUpward = false,
    style
  } = props;

  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const selectedOption = options.find(option => option.value === value);
  const displayValue = selectedOption ? selectedOption.label : placeholder;

  const handleToggle = () => {
    setIsOpen(!isOpen);
    setIsFocused(!isOpen);
  };

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setIsFocused(false);
  };

  const handleBlur = () => {
    // 약간의 지연을 두어 옵션 클릭이 가능하도록
    setTimeout(() => {
      setIsOpen(false);
      setIsFocused(false);
    }, 150);
  };

  return (
    <div className="relative" ref={ref} onBlur={handleBlur}>
      {/* Options (Only visible when open) - 위로 열림 */}
      {isOpen && openUpward && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-white rounded-lg border border-gray-300 shadow-lg max-h-48 overflow-y-auto z-10">
          {options.map((option, index) => (
            <div
              key={option.value}
              className={`px-4 py-3 cursor-pointer transition-colors duration-200 ${
                index < options.length - 1 ? 'border-b border-gray-200' : ''
              } ${
                option.value === value 
                  ? 'bg-gray-50 text-brand-500' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => handleOptionClick(option.value)}
            >
              <div className="font-pretendard text-sm leading-[19.6px]">
                {option.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Integrated Selector with Options */}
      <div
        className={`w-[168px] bg-white rounded-lg border transition-all duration-200 overflow-hidden ${
          isFocused 
            ? 'border-brand-500 shadow-[2px_4px_8px_rgba(0,0,0,0.08)]' 
            : 'border-gray-300'
        } ${className}`}
        style={{
          ...(isFocused ? { outline: '1px text-brand-500 solid', outlineOffset: '-1px' } : {}),
          ...style
        }}
      >
        {/* Selected Option (Always visible) */}
        <div
          className="h-[52px] px-4 py-3 flex justify-between items-center cursor-pointer"
          onClick={handleToggle}
          tabIndex={0}
        >
          <div className="font-pretendard text-sm leading-[19.6px] text-gray-700">
            {displayValue}
          </div>
          <Image 
            src="/images/common/arrowTop.svg"
            alt="arrow"
            width={12}
            height={12}
            style={{transform: 'rotate(180deg)'}}
          />
        </div>

        {/* Options (Only visible when open) - 아래로 열림 */}
        {isOpen && !openUpward && options.map((option, index) => (
          <div
            key={option.value}
            className={`px-4 py-3 cursor-pointer transition-colors duration-200 ${
              index < options.length - 1 ? 'border-t border-gray-200' : ''
            } ${
              option.value === value 
                ? 'bg-gray-50 text-brand-500' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => handleOptionClick(option.value)}
          >
            <div className="font-pretendard text-sm leading-[19.6px]">
              {option.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

Dropdown.displayName = 'Dropdown';

export default Dropdown;
