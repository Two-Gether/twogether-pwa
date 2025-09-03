import React from 'react';
import { X } from 'lucide-react';

interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info' | 'default';
  variant?: 'toast' | 'close' | 'text';
  children: React.ReactNode;
  actionText?: string;
  onClose?: () => void;
  onAction?: () => void;
  className?: string;
}

const Notification: React.FC<NotificationProps> = ({
  type,
  variant = 'toast',
  children,
  actionText,
  onClose,
  onAction,
  className = ''
}) => {
  const typeConfig = {
    default: {
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700',
      borderColor: 'border border-gray-300'
    },
    success: {
      bgColor: 'bg-semantic-success',
      textColor: 'text-white',
      borderColor: 'border border-semantic-success'
    },
    error: {
      bgColor: 'bg-semantic-error',
      textColor: 'text-white',
      borderColor: 'border border-semantic-error'
    },
    warning: {
      bgColor: 'bg-semantic-caution',
      textColor: 'text-gray-700',
      borderColor: 'border border-semantic-caution'
    },
    info: {
      bgColor: 'bg-semantic-info',
      textColor: 'text-white',
      borderColor: 'border border-semantic-info'
    }
  };

  const config = typeConfig[type];

  const renderClose = () => (
    <div className="w-4 h-4 relative overflow-hidden">
      <X className="w-[16px] h-[16px] absolute left-[2.67px] top-[2.67px] text-current" />
    </div>
  );

  const renderText = () => (
    <div className={`font-pretendard text-xs font-normal leading-[16.8px] ${config.textColor}`}>
      {actionText}
    </div>
  );

  // Toast Bar (기본)
  if (variant === 'toast') {
    return (
      <div className={`w-full h-[52px] px-4 py-3 ${config.bgColor} ${config.textColor} ${config.borderColor} shadow-[0px_1px_3px_rgba(0,0,0,0.12)] rounded-lg font-pretendard text-sm leading-[19.6px] flex justify-start items-center ${className}`}>
        {children}
      </div>
    );
  }

  // Snack Bar (close 또는 text)
  return (
    <div className={`w-full h-[52px] px-4 py-3 ${config.bgColor} ${config.textColor} ${config.borderColor} shadow-[0px_1px_3px_rgba(0,0,0,0.12)] rounded-lg flex justify-between items-center ${className}`}>
      <div className="font-pretendard text-sm leading-[19.6px]">
        {children}
      </div>
      {variant === 'close' && onClose && (
        <button onClick={onClose} className="flex items-center justify-center">
          {renderClose()}
        </button>
      )}
      {variant === 'text' && actionText && (
        <button onClick={onAction} className="flex items-center justify-center">
          {renderText()}
        </button>
      )}
    </div>
  );
};

export default Notification;
