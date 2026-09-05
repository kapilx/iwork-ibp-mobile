// SearchIcon.tsx
import React from "react";

const SearchIcon = ({ color = "white" }: { color?: string }) => (
  <svg
    width="24"
    height="25"
    viewBox="0 0 24 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10.8 18.5001C14.7764 18.5001 18 15.2765 18 11.3001C18 7.32365 14.7764 4.1001 10.8 4.1001C6.82353 4.1001 3.59998 7.32365 3.59998 11.3001C3.59998 15.2765 6.82353 18.5001 10.8 18.5001Z"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M20.3999 19.7001L16.7999 16.1001"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <g clipPath="url(#clip0)">
      <path d="M-2.5 22.5L-12.5 32.5H7.5L-2.5 22.5Z" fill={color} />
    </g>
    <defs>
      <clipPath id="clip0">
        <rect
          width="20"
          height="20"
          fill="white"
          transform="translate(2 2.5)"
        />
      </clipPath>
    </defs>
  </svg>
);

export default SearchIcon;
