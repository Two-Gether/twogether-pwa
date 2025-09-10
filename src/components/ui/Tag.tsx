'use client';

import React, { forwardRef } from 'react';

type TagType = 'review' | 'category'; // 추후 다른 타입들 추가 가능
type TagVariant = 'default' | 'selected';

interface TagProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: TagType;
  variant?: TagVariant;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const Tag = forwardRef<HTMLDivElement, TagProps>(function Tag(
  props,
  ref
) {
  const {
    type = 'review',
    variant = 'default',
    children,
    className = '',
    onClick,
    ...rest
  } = props;

  const base = 'inline-flex items-center justify-center font-pretendard text-sm leading-[19.6px] px-4 py-3 rounded-lg';

  // 태그 타입별 스타일 정의
  const tagStyles: Record<TagType, Record<TagVariant, string>> = {
    review: {
      default: 'bg-gray-100 border border-gray-300 text-gray-700 font-normal',
      selected: 'bg-gray-100 border border-brand-500 text-brand-500 font-semibold',
    },
    category: {
      default: 'bg-white border border-gray-300 text-gray-700 font-normal',
      selected: 'bg-white border border-brand-500 text-brand-500 font-semibold',
    },
  };

  const styleClass = tagStyles[type][variant];

  return (
    <div
      ref={ref}
      className={[base, styleClass, className].join(' ')}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      {...rest}
    >
      {children}
    </div>
  );
});

Tag.displayName = 'Tag';

export default Tag;
