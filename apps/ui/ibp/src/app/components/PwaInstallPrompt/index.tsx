import { useEffect, useRef, useState } from "react";
import { Alert, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Snackbar } from "@mui/material";
import GetAppRoundedIcon from "@mui/icons-material/GetAppRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import SystemUpdateAltRoundedIcon from "@mui/icons-material/SystemUpdateAltRounded";
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
 * Handles PWA installability/update UX:
 *  - A persistent status chip (bottom-right, above BottomNav on mobile) that
 *    always reflects the current state — "Install App" / "Installed" /
 *    "Update Available" — instead of relying solely on the browser's one-shot
 *    beforeinstallprompt banner, which may never fire (dismissed once,
 *    browser engagement heuristics not met, or a browser that doesn't
 *    support it at all).
 *  - One-time dismissible Snackbar banners for first-time install nudges.
 *  - Manual install instructions for iOS Safari and any other browser that
 *    doesn't fire beforeinstallprompt.
 */
const PwaInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showIosBanner, setShowIosBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showManualInstructions, setShowManualInstructions] = useState(false);
  const [checkingForUpdate, setCheckingForUpdate] = useState(false);
  const [showUpToDate, setShowUpToDate] = useState(false);
  const {
    isSupported,
    offlineReady,
    updateAvailable,
    reloadForUpdate,
    dismissOfflineReady,
    checkForUpdate,
  } = usePwaServiceWorker();

  // handleCheckForUpdate's setTimeout needs the *latest* updateAvailable, not
  // the value closed over when the check started (updateAvailable can flip
  // to true during the 2.5s window, which is exactly what we're checking for).
  const updateAvailableRef = useRef(updateAvailable);
  useEffect(() => {
    updateAvailableRef.current = updateAvailable;
  }, [updateAvailable]);

  useEffect(() => {
    setIsInstalled(isStandaloneDisplayMode());

    const onAppInstalled = () => setIsInstalled(true);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => window.removeEventListener("appinstalled", onAppInstalled);
  }, []);

  useEffect(() => {
    if (!isSupported || isStandaloneDisplayMode()) return;

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      if (!isDismissed()) setShowInstallBanner(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    if (isIos() && !isDismissed()) setShowIosBanner(true);

    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, [isSupported]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      setShowManualInstructions(true);
      return;
    }
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowInstallBanner(false);
    if (outcome === "accepted") setIsInstalled(true);
  };

  const handleDismissInstall = () => {
    dismissForNow();
    setShowInstallBanner(false);
    setShowIosBanner(false);
  };

  const handleCheckForUpdate = async () => {
    setCheckingForUpdate(true);
    await checkForUpdate();
    // registration.update() gives no direct "no update found" signal — if
    // updateAvailable hasn't flipped shortly after, tell the user they're current.
    window.setTimeout(() => {
      setCheckingForUpdate(false);
      if (!updateAvailableRef.current) setShowUpToDate(true);
    }, 2500);
  };

  const handleStatusChipClick = () => {
    if (updateAvailable) {
      reloadForUpdate();
      return;
    }
    if (isInstalled) {
      handleCheckForUpdate();
      return;
    }
    handleInstall();
  };

  if (!isSupported) return null;

  const chipProps = updateAvailable
    ? {
        icon: <SystemUpdateAltRoundedIcon fontSize="small" />,
        label: "Update Available",
        color: "warning" as const,
      }
    : isInstalled
    ? {
        icon: <CheckCircleRoundedIcon fontSize="small" />,
        label: checkingForUpdate ? "Checking…" : "Installed",
        color: "success" as const,
      }
    : {
        icon: <GetAppRoundedIcon fontSize="small" />,
        label: "Install App",
        color: "primary" as const,
      };

  return (
    <>
      <Chip
        icon={chipProps.icon}
        label={chipProps.label}
        color={chipProps.color}
        onClick={handleStatusChipClick}
        disabled={checkingForUpdate}
        sx={{
          position: "fixed",
          right: 16,
          bottom: 16,
          zIndex: 105,
          boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.2)",
          fontWeight: 600,
          "@media (max-width: 768px)": {
            bottom: 76, // clear the BottomNav
          },
        }}
      />

      <Snackbar
        open={showInstallBanner}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="info"
          variant="filled"
          onClose={handleDismissInstall}
          action={
            <Button color="inherit" size="small" onClick={handleInstall}>
              Install
            </Button>
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

      <Snackbar
        open={showUpToDate}
        autoHideDuration={3000}
        onClose={() => setShowUpToDate(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" variant="filled" onClose={() => setShowUpToDate(false)}>
          You're on the latest version of IBP.
        </Alert>
      </Snackbar>

      <Dialog open={showManualInstructions} onClose={() => setShowManualInstructions(false)}>
        <DialogTitle>Install IBP</DialogTitle>
        <DialogContent>
          {isIos()
            ? 'Tap the Share icon in Safari, then choose "Add to Home Screen".'
            : 'Your browser didn\'t offer a one-tap install. Look for an install icon in the address bar, or check your browser menu for "Install app" / "Add to Home Screen".'}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowManualInstructions(false)}>Got it</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PwaInstallPrompt;
