import React from 'react';

interface CalendarIconProps {
  className?: string;
  width?: number;
  height?: number;
}

const CalendarIcon: React.FC<CalendarIconProps> = ({ className = '', width = 24, height = 24 }) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path 
        d="M3 10H21V6C21 5.46957 20.7893 4.96086 20.4142 4.58579C20.0391 4.21071 19.5304 4 19 4H5C4.46957 4 3.96086 4.21071 3.58579 4.58579C3.21071 4.96086 3 5.46957 3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H12" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M8 2V6" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M16 2V6" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M21.2902 14.7C20.9494 14.3609 20.5158 14.1305 20.044 14.038C19.5723 13.9454 19.0838 13.9948 18.6402 14.18C18.3402 14.3 18.0702 14.48 17.8402 14.71L17.5002 15.05L17.1502 14.71C16.8105 14.3692 16.3774 14.137 15.9056 14.0426C15.4339 13.9483 14.9447 13.9961 14.5002 14.18C14.2002 14.3 13.9402 14.48 13.7102 14.71C12.7602 15.65 12.7102 17.24 13.9102 18.45L17.5002 22L21.1002 18.45C22.3002 17.24 22.2402 15.65 21.2902 14.71V14.7Z" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default CalendarIcon;
