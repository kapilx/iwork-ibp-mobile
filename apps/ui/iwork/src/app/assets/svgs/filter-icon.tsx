const FilterIcon = ({ color = "#0A73E9" }: { color?: string }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M18 3H2L8.4 10.2877V15.3259L11.6 16.8667V10.2877L18 3Z"
      stroke={color}
      strokeWidth="1.06667"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <g clipPath="url(#clip0)">
      <path d="M-10 20L-20 30H0L-10 20Z" fill="white" />
    </g>
    <defs>
      <clipPath id="clip0">
        <rect width="20" height="20" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

export default FilterIcon;
