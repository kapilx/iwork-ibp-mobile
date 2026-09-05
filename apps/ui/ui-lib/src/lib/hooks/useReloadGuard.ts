import { useCallback, useEffect, useRef, useState } from "react";

type MaybeNavigateEvent = Event & {
  navigationType?: string;
  canIntercept?: boolean;
  intercept?: (options?: { handler?: () => void | Promise<void> }) => void;
};

export interface UseReloadGuardOptions {
  shouldGuard: boolean;
}

export interface UseReloadGuardReturn {
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  confirmReload: () => void;
}

const useReloadGuard = ({
  shouldGuard,
}: UseReloadGuardOptions): UseReloadGuardReturn => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const allowReloadRef = useRef(false);
  const shouldGuardRef = useRef(shouldGuard);

  useEffect(() => {
    shouldGuardRef.current = shouldGuard;
    if (!shouldGuard) {
      allowReloadRef.current = false;
      setIsModalOpen(false);
    }
  }, [shouldGuard]);

  // Handle reload shortcuts (F5, Ctrl+R, Cmd+R)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const isReloadShortcut = (event: KeyboardEvent) => {
      const key = event.key?.toLowerCase();
      return key === "f5" || (key === "r" && (event.metaKey || event.ctrlKey));
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!shouldGuardRef.current || allowReloadRef.current) return;
      if (!isReloadShortcut(event)) return;

      event.preventDefault();
      event.stopPropagation();
      setIsModalOpen(true);
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, []);

  // Handle browser navigation API (Chrome only for now)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const navigation = (window as Window & { navigation?: any }).navigation;
    if (!navigation || typeof navigation.addEventListener !== "function")
      return;

    const abortController =
      typeof AbortController !== "undefined"
        ? new AbortController()
        : undefined;

    const handleNavigate = (event: Event) => {
      const navigateEvent = event as MaybeNavigateEvent;

      if (!shouldGuardRef.current || allowReloadRef.current) return;
      if (navigateEvent.navigationType !== "reload") return;

      if (navigateEvent.cancelable) {
        navigateEvent.preventDefault();
      }

      if (
        navigateEvent.canIntercept &&
        typeof navigateEvent.intercept === "function"
      ) {
        try {
          navigateEvent.intercept({ handler: () => undefined });
        } catch {
          // ignore interception errors
        }
      }

      setIsModalOpen(true);
    };

    try {
      navigation.addEventListener(
        "navigate",
        handleNavigate as EventListener,
        abortController ? { signal: abortController.signal } : undefined
      );
    } catch {
      navigation.addEventListener("navigate", handleNavigate as EventListener);
    }

    return () => {
      if (abortController) {
        abortController.abort();
      } else {
        navigation.removeEventListener(
          "navigate",
          handleNavigate as EventListener
        );
      }
    };
  }, []);

  // Fallback: beforeunload (covers Safari, Firefox, tab close)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (shouldGuardRef.current && !allowReloadRef.current) {
        e.preventDefault();
        e.returnValue = ""; // standard way to trigger browser native confirm
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const confirmReload = useCallback(() => {
    allowReloadRef.current = true;
    setIsModalOpen(false);

    if (typeof window !== "undefined") {
      setTimeout(() => {
        window.location.reload();
      }, 50);
    }
  }, []);

  const closeModal = useCallback(() => {
    allowReloadRef.current = false;
    setIsModalOpen(false);
  }, []);

  const openModal = useCallback(() => {
    if (shouldGuardRef.current) {
      setIsModalOpen(true);
    }
  }, []);

  return {
    isModalOpen,
    openModal,
    closeModal,
    confirmReload,
  };
};

export default useReloadGuard;
