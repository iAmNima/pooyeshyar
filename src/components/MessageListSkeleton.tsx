import React from 'react';

interface MessageListSkeletonProps {
  count?: number;
}

const MessageListSkeleton: React.FC<MessageListSkeletonProps> = ({ count = 6 }) => {
  return (
    <div className="flex flex-col flex-1 overflow-y-auto p-4 space-y-3">
      {Array.from({ length: count }).map((_, index) => {
        const isOwn = index % 2 === 0; // Alternate sides
        return (
          <div
            key={index}
            className={`p-3 rounded-lg shadow-sm max-w-xs break-words flex flex-col ${
              isOwn ? 'bg-gray-300 self-end' : 'bg-primary/70 self-start'
            }`}
          >
            <div className="shimmer h-3 w-48 rounded mb-1"></div>
            <div className="shimmer h-3 w-36 rounded mb-1"></div>
            <div className="shimmer h-2 w-24 rounded mt-1"></div>
          </div>
        );
      })}
    </div>
  );
};

export default MessageListSkeleton;