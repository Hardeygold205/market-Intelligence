import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Extension Africa Logo"
    >
      {/* Background circle badge */}
      <rect width="48" height="48" rx="10" fill="#B3C03E" />
      {/* Stylized African continent and agricultural sprout in Forest Green and White */}
      <path
        d="M24 8C19 8 13 14 13 22C13 30 20 37 24 40C28 37 35 30 35 22C35 14 29 8 24 8Z"
        fill="#206542"
      />
      {/* Leaf / seedling motif representing Extension Africa growth */}
      <path
        d="M24 14C24 14 27 18 27 23C27 26 25 28 24 30C23 28 21 26 21 23C21 18 24 14 24 14Z"
        fill="#FFFFFF"
      />
      <circle cx="24" cy="22" r="2.5" fill="#B3C03E" />
      <path
        d="M17 21C19 23 21 25 24 25"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M31 21C29 23 27 25 24 25"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
};
