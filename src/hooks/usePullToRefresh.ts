import { useRef, useState, useCallback } from 'react';

interface PullToRefreshConfig {
  onRefresh: () => Promise<void> | void;
  pullThreshold?: number;
  maxPullDistance?: number;
}

export const usePullToRefresh = ({
  onRefresh,
  pullThreshold = 80,
  maxPullDistance = 120
}: PullToRefreshConfig) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (isRefreshing) return;

    const touch = e.touches[0];
    setStartY(touch.clientY);
    setIsPulling(true);
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || isRefreshing) return;

    const touch = e.touches[0];
    const currentY = touch.clientY;
    const deltaY = currentY - startY;

    // Only allow pull down when at the top of the scrollable area
    if (containerRef.current && containerRef.current.scrollTop > 0) {
      return;
    }

    // Only handle downward pulls
    if (deltaY > 0) {
      const distance = Math.min(deltaY * 0.5, maxPullDistance);
      setPullDistance(distance);
    }
  }, [isPulling, startY, maxPullDistance, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || isRefreshing) return;

    setIsPulling(false);

    if (pullDistance >= pullThreshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
  }, [isPulling, pullDistance, pullThreshold, onRefresh, isRefreshing]);

  const getTransformStyle = useCallback(() => {
    if (!isPulling && !isRefreshing) return {};

    const translateY = isRefreshing ? pullThreshold : pullDistance;
    return {
      transform: `translateY(${translateY}px)`,
      transition: isRefreshing ? 'none' : 'transform 0.2s ease-out'
    };
  }, [isPulling, isRefreshing, pullDistance, pullThreshold]);

  return {
    containerRef,
    isRefreshing,
    pullDistance,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    getTransformStyle
  };
};