import React from "react";

interface ChatBotIconProps {
  className?: string;
  size?: number;
}

const ChatBotIcon: React.FC<ChatBotIconProps> = ({ className = "size-5 relative z-10", size = 24 }) => {
  return (
    <svg 
      viewBox="0 0 64 64" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      width={size}
      height={size}
      style={{
        transition: 'transform 0.2s ease',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      {/* Orange rounded square background */}
      <rect 
        x="0" 
        y="0" 
        width="64" 
        height="64" 
        rx="12" 
        ry="12" 
        fill="#ff6f00d8" 
        stroke="#ff6f00ff"
        strokeWidth="1"
      />
      <path 
        d="M32 16C24.06 16 18 21.16 18 28C18 30.4 18.7 32.64 19.84 34.56L18.6 40L23.44 38.76C25.36 39.6 27.6 40 30 40H32C39.94 40 46 34.84 46 28C46 21.16 39.94 16 32 16Z" 
        stroke="white" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        fill="none"
      />
      <g>
        <path 
          d="M32 24 L33.4 28.6 L38 30 L33.4 31.4 L32 36 L30.6 31.4 L26 30 L30.6 28.6 Z" 
          fill="white" 
          stroke="white" 
          strokeWidth="0.6" 
          strokeLinejoin="round"
        />
        <circle cx="27" cy="25" r="1.2" fill="white" />
        <circle cx="37" cy="25" r="1.2" fill="white" />
        <circle cx="37" cy="34" r="1.2" fill="white" />
      </g>
    </svg>
  );
};

export default ChatBotIcon;