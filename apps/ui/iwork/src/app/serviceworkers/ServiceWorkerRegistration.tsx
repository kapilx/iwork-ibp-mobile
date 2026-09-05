export const registerServiceWorker = () => {
    if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
            navigator.serviceWorker
                .register("/service-worker.js")
                .then(async registration => {
                    console.log("SW registered: ", registration);
                    
                    registration.addEventListener("updatefound", () => {
                        const newWorker = registration.installing;
                        console.log("SW update found!", newWorker);
                    });

                    // Request Notification Permission
                    const permission = await Notification.requestPermission();
                    if (permission === "granted") {
                        console.log("Notification Permission Granted");
                        // showTestNotification(); // Send a test notification
                        await subscribeUserToPush(registration);
                    } else {
                        console.warn("Notification Permission Denied");
                    }
                })
                .catch(registrationError => {
                    console.log("SW registration failed: ", registrationError);
                });
        });
    }
}
// Unregister the service worker
export const unregisterServiceWorker = () => {
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.ready
            .then(registration => {
                registration.unregister();
            })
            .catch(error => {
                console.error(error.message);
            });
    }
}

// Send the subscription to the server
export const sendSubscriptionToServer = async (subscription: PushSubscription) => {
    await fetch('/api/save-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
    });
    console.log('📩 Subscription sent to server');
}

// Subscribe the user to push notifications
//VAPID (Voluntary Application Server Identification for Web Push) is a standard that allows your server to authenticate and send push notifications 
// securely to users through a push service (like Firebase Cloud Messaging or Web Push API).

export const subscribeUserToPush = async (registration: ServiceWorkerRegistration) => {
    try {
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlB64ToUint8Array('<Your-VAPID-Public-Key>')
        });
        console.log('User is subscribed:', subscription);
        sendSubscriptionToServer(subscription);
        // Send subscription to your server to store it
    } catch (error) {
        console.error('Failed to subscribe the user:', error);
    }
}

// Convert a base64 string to a Uint8Array
export const urlB64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}