import { useCallback, useEffect, useRef, useState } from "react";

const SW_URL = "/sw.js";

/**
 * Manually registers the service worker emitted by vite-plugin-pwa
 * (registerType: "prompt", injectRegister: false in vite.config.ts) and
 * exposes update/offline-ready state so the UI can surface its own prompt
 * instead of the plugin's default one.
 *
 * No-ops entirely when the app wasn't built with VITE_PWA=true (e.g. the
 * Module Federation remote build), since no service worker file exists there.
 */
export function usePwaServiceWorker() {
  const [offlineReady, setOfflineReady] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const pwaEnabled = import.meta.env.VITE_PWA === "true";
    if (!pwaEnabled || !("serviceWorker" in navigator)) return;

    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    navigator.serviceWorker
      .register(SW_URL)
      .then((registration) => {
        registrationRef.current = registration;

        if (registration.waiting && navigator.serviceWorker.controller) {
          setUpdateAvailable(true);
        }

        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state !== "installed") return;
            if (navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
            } else {
              setOfflineReady(true);
            }
          });
        });
      })
      .catch((error) => {
        console.error("Service worker registration failed:", error);
      });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  const reloadForUpdate = useCallback(() => {
    registrationRef.current?.waiting?.postMessage({ type: "SKIP_WAITING" });
  }, []);

  const dismissOfflineReady = useCallback(() => setOfflineReady(false), []);

  return { offlineReady, updateAvailable, reloadForUpdate, dismissOfflineReady };
}

export default usePwaServiceWorker;
