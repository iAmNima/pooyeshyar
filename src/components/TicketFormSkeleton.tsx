import React from 'react';

interface TicketFormSkeletonProps {
  inline?: boolean;
}

const TicketFormSkeleton: React.FC<TicketFormSkeletonProps> = ({ inline = false }) => {
  return (
    <div className={inline ? "bg-white p-4 rounded-lg shadow-soft w-full" : "min-h-screen flex items-center justify-center bg-gray-100 p-4"}>
      <div className={inline ? "w-full" : "bg-white p-8 rounded-lg shadow-soft w-full max-w-md"}>
        <div className="shimmer h-6 w-1/2 rounded mb-6 mx-auto"></div>
        <div className="mb-4">
          <div className="shimmer h-4 w-1/4 rounded mb-2"></div>
          <div className="shimmer h-24 w-full rounded"></div>
        </div>
        <div className="flex items-center justify-center">
          <div className="shimmer h-10 w-20 rounded"></div>
        </div>
      </div>
    </div>
  );
};

export default TicketFormSkeleton;