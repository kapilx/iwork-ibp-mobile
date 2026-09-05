import { useCallback, useEffect, useRef } from "react";

type GetTimeoutMinutes = () => number | null | undefined;

export interface InactivityTimeoutOptions {
  /** Called when the inactivity timer elapses. */
  onTimeout: () => void;
  /** Fixed timeout (in minutes) if available at mount time. */
  timeoutMinutes?: number | null;
  /** Optional resolver for dynamic/config-driven timeout minutes. */
  getTimeoutMinutes?: GetTimeoutMinutes;
  /** Storage key to read from when using localStorage-driven values. */
  storageKey?: string | null;
  /** Window events that should reset the timer on user activity. */
  events?: (keyof WindowEventMap)[];
}

const DEFAULT_INACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  "mousemove",
  "keydown",
  "scroll",
  "click",
  "touchstart",
];

export const useInactivityTimeout = ({
  onTimeout,
  timeoutMinutes,
  getTimeoutMinutes,
  storageKey = "sessionTimeoutMinutes",
  events = DEFAULT_INACTIVITY_EVENTS,
}: InactivityTimeoutOptions) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resolveTimeoutMinutes = useCallback((): number | null => {
    const fromGetter = getTimeoutMinutes?.();
    if (typeof fromGetter === "number" && !Number.isNaN(fromGetter)) {
      return fromGetter;
    }

    if (typeof timeoutMinutes === "number" && !Number.isNaN(timeoutMinutes)) {
      return timeoutMinutes;
    }

    if (storageKey) {
      const storedValue = Number(localStorage.getItem(storageKey));
      if (!Number.isNaN(storedValue)) {
        return storedValue;
      }
    }

    return null;
  }, [getTimeoutMinutes, timeoutMinutes, storageKey]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();

    const minutes = resolveTimeoutMinutes();
    if (!minutes || minutes <= 0) {
      return;
    }

    timerRef.current = setTimeout(onTimeout, minutes * 60 * 1000);
  }, [clearTimer, resolveTimeoutMinutes, onTimeout]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    startTimer();
    const activityHandler = () => startTimer();
    const storageHandler = (event: StorageEvent) => {
      if (event.key === storageKey) {
        startTimer();
      }
    };

    events.forEach((event) =>
      window.addEventListener(event, activityHandler, { passive: true })
    );

    window.addEventListener("storage", storageHandler);

    return () => {
      clearTimer();
      events.forEach((event) =>
        window.removeEventListener(event, activityHandler)
      );
      window.removeEventListener("storage", storageHandler);
    };
  }, [clearTimer, events, startTimer, storageKey]);

  return { resetTimer: startTimer, clearTimer };
};
