import React from 'react';

interface TicketListSkeletonProps {
  count?: number;
  height?: 'h-24' | 'h-28';
  showButton?: boolean;
}

const TicketListSkeleton: React.FC<TicketListSkeletonProps> = ({
  count = 5,
  height = 'h-24',
  showButton = false
}) => {
  return (
    <ul>
      {Array.from({ length: count }).map((_, index) => (
        <li
          key={index}
          className={`p-4 border-b border-gray-200 ${height} flex flex-col`}
        >
          <div className="shimmer h-4 w-3/4 rounded mb-2"></div>
          <div className="shimmer h-3 w-1/2 rounded mb-1"></div>
          <div className="shimmer h-3 w-1/4 rounded mt-auto"></div>
          {showButton && (
            <div className="mt-2 flex justify-end">
              <div className="shimmer h-6 w-16 rounded"></div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
};

export default TicketListSkeleton;