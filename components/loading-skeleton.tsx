'use client';

import React from 'react';

interface LoadingSkeletonProps {
  count?: number;
  type?: 'card' | 'list';
}

export function LoadingSkeleton({ count = 3, type = 'card' }: LoadingSkeletonProps) {
  if (type === 'list') {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: count }).map((_, index) => (
          <SkeletonListItem key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="skeleton-card flex-shrink-0 w-[calc(100%-32px)] max-w-[320px] snap-start">
      {/* Header: Category tag + Rating */}
      <div className="flex justify-between items-start mb-3">
        <div className="skeleton skeleton-line w-16 h-5 rounded-full" />
        <div className="skeleton skeleton-circle w-10 h-10" />
      </div>

      {/* Restaurant name */}
      <div className="skeleton skeleton-line w-3/4 h-5 mb-2" />

      {/* Address + Distance */}
      <div className="skeleton skeleton-line w-1/2 h-4 mb-3" />

      {/* Reason block */}
      <div className="skeleton w-full h-16 rounded-lg" />

      <style jsx>{`
        .skeleton-card {
          padding: 16px;
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06);
        }

        .skeleton {
          background: linear-gradient(
            90deg,
            #F5F0EB 25%,
            #EDE6DF 50%,
            #F5F0EB 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 6px;
        }

        .skeleton-circle {
          border-radius: 9999px;
        }

        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
}

function SkeletonListItem() {
  return (
    <div className="skeleton-list-item">
      <div className="flex gap-3">
        <div className="skeleton skeleton-image w-16 h-16 rounded-lg flex-shrink-0" />
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <div className="skeleton skeleton-line w-2/3 h-4" />
            <div className="skeleton skeleton-line w-12 h-4" />
          </div>
          <div className="skeleton skeleton-line w-1/2 h-3 mb-1" />
          <div className="skeleton skeleton-line w-1/3 h-3" />
        </div>
      </div>

      <style jsx>{`
        .skeleton-list-item {
          padding: 12px 16px;
          background-color: white;
          border-bottom: 1px solid #F5F0EB;
        }

        .skeleton-list-item:last-child {
          border-bottom: none;
        }

        .skeleton {
          background: linear-gradient(
            90deg,
            #F5F0EB 25%,
            #EDE6DF 50%,
            #F5F0EB 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 4px;
        }

        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
}

export default LoadingSkeleton;
