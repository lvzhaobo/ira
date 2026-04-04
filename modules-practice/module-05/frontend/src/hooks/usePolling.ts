import { useState, useEffect, useCallback } from 'react';

/**
 * 轮询Hook
 * @param callback 轮询执行的回调函数
 * @param delay 轮询间隔（毫秒）
 * @param immediate 是否立即执行
 */
export const usePolling = (
  callback: () => Promise<void>,
  delay: number,
  immediate: boolean = true
) => {
  const [isPolling, setIsPolling] = useState(false);

  const stop = useCallback(() => {
    setIsPolling(false);
  }, []);

  const start = useCallback(() => {
    setIsPolling(true);
  }, []);

  useEffect(() => {
    if (!isPolling) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    let isCancelled = false;

    const poll = async () => {
      try {
        await callback();
      } catch (error) {
        console.error('Polling error:', error);
      }

      if (!isCancelled && isPolling) {
        timeoutId = setTimeout(poll, delay);
      }
    };

    if (immediate) {
      poll();
    } else {
      timeoutId = setTimeout(poll, delay);
    }

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [callback, delay, immediate, isPolling]);

  return { isPolling, start, stop };
};
