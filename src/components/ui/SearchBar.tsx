import React, { forwardRef } from 'react';

interface SearchBarProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  placeholder?: string;
  variant?: 'default' | 'error' | 'success' | 'disabled';
  onSearch?: (value: string) => void;
  onChange?: (value: string) => void;
  helperText?: string;
  label?: string;
}

const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  ({ 
    placeholder = "장소를 검색하세요.", 
    variant = 'default', 
    onSearch,
    onChange,
    helperText,
    label,
    className = '', 
    ...props 
  }, ref) => {
    const baseClasses = `w-full h-[52px] px-4 py-3 bg-white shadow-lg rounded-lg font-pretendard text-sm leading-[19.6px] transition-colors focus:outline-none focus:ring-0 focus:border-0`;
    
    const variantClasses = {
      default: "text-gray-500 placeholder:text-gray-500",
      error: "text-semantic-error placeholder:text-semantic-error border border-brand-500",
      success: "text-semantic-success placeholder:text-semantic-success",
      disabled: "text-gray-500 placeholder:text-gray-500 cursor-not-allowed"
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.value);
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        onSearch?.(e.currentTarget.value);
      }
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2 font-pretendard">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type="text"
            placeholder={placeholder}
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            disabled={variant === 'disabled'}
            {...props}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-700">
            <img src="/images/common/search.svg" alt="Search" className="w-3.5 h-3.5" />
          </div>
        </div>
        {helperText && (
          <p className={`mt-1 text-sm ${variant === 'error' ? 'text-semantic-error' : variant === 'success' ? 'text-semantic-success' : 'text-gray-600'} font-pretendard`}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

SearchBar.displayName = 'SearchBar';

export default SearchBar;
