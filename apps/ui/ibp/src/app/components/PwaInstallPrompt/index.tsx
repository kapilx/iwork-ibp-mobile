import { useEffect, useState } from "react";
import { Alert, Button, Snackbar, Stack } from "@mui/material";
import usePwaServiceWorker from "../../hooks/usePwaServiceWorker";

const DISMISS_STORAGE_KEY = "ibp_pwa_install_dismissed_until";
const DISMISS_DAYS = 14;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandaloneDisplayMode() {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isDismissed() {
  const until = Number(localStorage.getItem(DISMISS_STORAGE_KEY) || 0);
  return Date.now() < until;
}

function dismissForNow() {
  const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
  localStorage.setItem(DISMISS_STORAGE_KEY, String(until));
}

/**
 * Handles both PWA-installability surfaces the app needs:
 *  - The Chromium `beforeinstallprompt` install banner (Android/desktop Chrome/Edge).
 *  - A manual "Add to Home Screen" instruction banner for iOS Safari, which never
 *    fires `beforeinstallprompt`.
 * Also surfaces the "offline ready" / "update available" service-worker states
 * from usePwaServiceWorker via the same Snackbar pattern used elsewhere in the app.
 */
const PwaInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showIosBanner, setShowIosBanner] = useState(false);
  const { offlineReady, updateAvailable, reloadForUpdate, dismissOfflineReady } =
    usePwaServiceWorker();

  useEffect(() => {
    if (import.meta.env.VITE_PWA !== "true" || isStandaloneDisplayMode() || isDismissed()) {
      return;
    }

    if (isIos()) {
      setShowIosBanner(true);
      return;
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setShowInstallBanner(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const handleDismissInstall = () => {
    dismissForNow();
    setShowInstallBanner(false);
    setShowIosBanner(false);
  };

  return (
    <>
      <Snackbar
        open={showInstallBanner}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="info"
          variant="filled"
          onClose={handleDismissInstall}
          action={
            <Stack direction="row" spacing={1}>
              <Button color="inherit" size="small" onClick={handleInstall}>
                Install
              </Button>
            </Stack>
          }
        >
          Install IBP for quick, offline-friendly access from your home screen.
        </Alert>
      </Snackbar>

      <Snackbar
        open={showIosBanner}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="info" variant="filled" onClose={handleDismissInstall}>
          Install IBP: tap the Share icon, then "Add to Home Screen".
        </Alert>
      </Snackbar>

      <Snackbar
        open={updateAvailable}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="info"
          variant="filled"
          action={
            <Button color="inherit" size="small" onClick={reloadForUpdate}>
              Reload
            </Button>
          }
        >
          A new version of IBP is available.
        </Alert>
      </Snackbar>

      <Snackbar
        open={offlineReady}
        autoHideDuration={4000}
        onClose={dismissOfflineReady}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" variant="filled" onClose={dismissOfflineReady}>
          IBP is ready to work offline.
        </Alert>
      </Snackbar>
    </>
  );
};

export default PwaInstallPrompt;
