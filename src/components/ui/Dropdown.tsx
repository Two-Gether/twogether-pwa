'use client';

import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

type DropdownType = 'selector' | 'option' | 'dropdown';

interface BaseDropdownProps {
  type?: DropdownType;
  className?: string;
  fullWidth?: boolean;
}

interface SelectorProps extends BaseDropdownProps {
  type: 'selector';
  children: React.ReactNode;
  onClick?: () => void;
}

interface OptionProps extends BaseDropdownProps {
  type: 'option';
  children: React.ReactNode;
  onClick?: () => void;
}

interface DropdownProps extends BaseDropdownProps {
  type: 'dropdown';
  children: React.ReactNode;
}

type DropdownComponentProps = SelectorProps | OptionProps | DropdownProps;

const Dropdown = forwardRef<HTMLDivElement, DropdownComponentProps>(function Dropdown(
  props,
  ref
) {
  const {
    type = 'selector',
    className = '',
    fullWidth = true,
    ...rest
  } = props;

  const base = 'font-pretendard text-sm leading-[19.6px] text-gray-700';

  /** selector 계열 */
  const renderSelector = (p: SelectorProps) => {
    const { children, onClick, ...selectorProps } = p;

    return (
      <div
        ref={ref}
        className={`w-[168px] h-[52px] px-4 py-3 bg-white rounded-lg border border-gray-300 flex justify-between items-center ${className}`}
        onClick={onClick}
        {...selectorProps}
      >
        <div className={base}>
          {children}
        </div>
        <ChevronDown className="w-4 h-4 text-gray-700" />
      </div>
    );
  };

  /** option 계열 */
  const renderOption = (p: OptionProps) => {
    const { children, onClick, ...optionProps } = p;
    return (
      <div
        ref={ref}
        className={`w-[168px] h-[52px] px-4 py-3 bg-white border-b border-gray-300 flex justify-start items-center ${className}`}
        onClick={onClick}
        {...optionProps}
      >
        <div className={base}>
          {children}
        </div>
      </div>
    );
  };

  /** dropdown 계열 */
  const renderDropdown = (p: DropdownProps) => {
    const { children, ...dropdownProps } = p;
    return (
      <div
        ref={ref}
        className={`w-[168px] shadow-lg overflow-hidden rounded-lg border border-brand-500 flex flex-col justify-start items-start ${className}`}
        {...dropdownProps}
      >
        {children}
      </div>
    );
  };

  if (type === 'selector') return renderSelector(props as SelectorProps);
  if (type === 'option') return renderOption(props as OptionProps);
  return renderDropdown(props as DropdownProps);
});

Dropdown.displayName = 'Dropdown';

export default Dropdown;
