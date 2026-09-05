export const CalendarBadge: React.FC<{ month: string; date: number }> = ({ month, date }) => {

  return (
    <svg width="45" height="45" viewBox="0 0 80 90" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="90" rx="12" fill="#F5F5F5" />
      <rect width="80" height="25" fill="#1976D2" />
      <text x="40" y="17" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="sans-serif">
        {month}
      </text>
      <text x="40" y="65" textAnchor="middle" fill="#333" fontSize="36" fontWeight="bold" fontFamily="sans-serif">
        {date}
      </text>
    </svg>
  );
};
