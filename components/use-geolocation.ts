'use client';

import { useState, useCallback } from 'react';

export interface UseGeolocationReturn {
  position: { lat: number; lng: number } | null;
  error: string | null;
  isLoading: boolean;
  requestLocation: () => void;
  clearError: () => void;
}

export function useGeolocation(): UseGeolocationReturn {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('您的浏览器不支持定位功能');
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setIsLoading(false);
      },
      (err) => {
        setIsLoading(false);
        if (err.code === 1) {
          setError('定位权限被拒绝，请手动输入地址');
        } else {
          setError('无法获取位置，请手动输入地址');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    position,
    error,
    isLoading,
    requestLocation,
    clearError,
  };
}
