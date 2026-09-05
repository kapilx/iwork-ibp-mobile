import { useEffect, useState } from "react";

const DEFAULT_DURATION = 1500;

const getPrecision = (value: number) => {
  const parts = value.toString().split(".");
  return parts[1]?.length ?? 0;
};

export const useAnimatedNumber = (
  value: number,
  delay = 0,
  duration = DEFAULT_DURATION
) => {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    let frameId = 0;
    let timeoutId = 0;

    timeoutId = window.setTimeout(() => {
      const start = performance.now();

      const step = (timestamp: number) => {
        const progress = Math.min((timestamp - start) / duration, 1);
        const easedProgress = 1 - (1 - progress) ** 3;
        setAnimatedValue(Number((value * easedProgress).toFixed(precision)));

        if (progress < 1) {
          frameId = window.requestAnimationFrame(step);
        }
      };

      const precision = getPrecision(value);
      frameId = window.requestAnimationFrame(step);
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
      window.cancelAnimationFrame(frameId);
    };
  }, [delay, duration, value]);

  return animatedValue;
};
