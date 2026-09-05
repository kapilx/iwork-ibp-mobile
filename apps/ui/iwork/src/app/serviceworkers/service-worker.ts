/// <reference lib="webworker" />
/// <reference lib="es2015" />

const CACHE_NAME = "app-cache-v1";

self.addEventListener("install", async () => {
    const cache = await caches.open("static-cache");
    const response = await fetch("/asset-manifest.json"); // Fetch dynamic asset list
    const manifest = await response.json();
    const urlsToCache = Object.values(manifest); // Get asset URLs
    await cache.addAll(urlsToCache as RequestInfo[]);
});


// once integration in project done i will remove this
const ASSETS_TO_CACHE = [
    "/",
    "/index.html",
    "/offline.html",
    "/manifest.json",
    "/logo192.png",
    "/logo512.png",
    "/vite.svg"
];

// Type assertion for service worker scope
const sw = self as unknown as ServiceWorkerGlobalScope;

// Check if URL is suitable for caching
const shouldCache = (url: string): boolean => {
    const parsedUrl = new URL(url);
    // Only cache same-origin requests
    if (parsedUrl.origin !== sw.location.origin) return false;
    // Only cache http(s) requests
    if (!url.startsWith('http')) return false;
    // Don't cache chrome-extension requests
    if (url.startsWith('chrome-extension://')) return false;
    // Always cache assets directory
    if (url.includes('/assets/')) return true;
    return true;
}

// Install Event - Cache Assets
sw.addEventListener("install", ((event) => {
    console.log('Service Worker: Installing');
    const extendableEvent = event as ExtendableEvent;
    extendableEvent.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            console.log('Service Worker: Caching Files');
            try {
                await cache.addAll(ASSETS_TO_CACHE);
                console.log('Static assets cached');

                const response = await fetch('/');
                if (response.ok) {
                    await cache.put('/', response.clone());
                    const text = await response.text();
                    const buildAssets = [...text.matchAll(/\/assets\/[^"']*\.(js|css)/g)].map(match => match[0]);

                    console.log('Found build assets:', buildAssets);
                    await Promise.all(buildAssets.map(async (url) => {
                        try {
                            const assetResponse = await fetch(url);
                            if (assetResponse.ok) {
                                await cache.put(url, assetResponse);
                                console.log('Cached build asset:', url);
                            }
                        } catch (error) {
                            console.error('Failed to cache build asset:', url, error);
                        }
                    }));
                }
            } catch (error) {
                console.error('Cache failed:', error);
            }
        })
    );
    sw.skipWaiting();
}) as EventListener);

// Activate Event - Clean up old caches
sw.addEventListener("activate", ((event) => {
    console.log('🔵 Service Worker: Activated');
    const extendableEvent = event as ExtendableEvent;
    extendableEvent.waitUntil(
        caches.keys().then((keys) => {
            console.log('🧹 Service Worker: Cleaning Old Caches');
            return Promise.all(
                keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : null))
            );
        })
    );
    sw.clients.claim();
}) as EventListener);

// IndexedDB setup for storing failed requests
const DB_NAME = 'OfflineRequestsDB';
const STORE_NAME = 'failedRequests';

// Open IndexedDB
const openDB = async (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

// Store failed request
const storeFailedRequest = async (request: Request): Promise<void> => {
    try {
        const db = await openDB();
        const clone = request.clone();
        
        // Convert headers to a plain object
        const headers: Record<string, string> = {};
        clone.headers.forEach((value, key) => {
            headers[key] = value;
        });

        const serializedRequest = {
            url: clone.url,
            method: clone.method,
            headers,
            body: await clone.text(),
            timestamp: Date.now()
        };

        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        await new Promise((resolve, reject) => {
            const request = store.add(serializedRequest);
            request.onsuccess = () => resolve(undefined);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Failed to store request:', error);
    }
}

// Get failed requests
const getFailedRequests = async (): Promise<{ url: string; options: RequestInit }[]> => {
    try {
        const db = await openDB();
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => {
                const failedRequests = request.result.map(item => ({
                    url: item.url,
                    options: {
                        method: item.method,
                        headers: item.headers,
                        body: item.body
                    }
                }));
                resolve(failedRequests);
            };
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Failed to get failed requests:', error);
        return [];
    }
}

// Remove synced request
const removeFailedRequest = async (id: number): Promise<void> => {
    try {
        const db = await openDB();
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        await new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve(undefined);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Failed to remove request:', error);
    }
}

// Enhanced sync data function
const syncData = async (): Promise<void> => {
    console.log("🔄 Syncing data in the background...");
    const failedRequests = await getFailedRequests();
    
    for (const request of failedRequests) {
        try {
            const response = await fetch(request.url, request.options);
            if (response.ok) {
                await removeFailedRequest((request as unknown as { id: number }).id);
                console.log('Successfully synced request:', request.url);
            } else {
                console.error('Failed to sync request:', request.url);
            }
        } catch (error) {
            console.error('Error syncing request:', error);
        }
    }
}

// Enhanced fetch event handler
sw.addEventListener("fetch", ((event) => {
    const fetchEvent = event as FetchEvent;
    const requestUrl = fetchEvent.request.url;

    // Handle Google Fonts requests when offline
    if (requestUrl.includes('fonts.googleapis.com') || requestUrl.includes('fonts.gstatic.com')) {
        fetchEvent.respondWith(
            fetch(fetchEvent.request)
                .catch(() => new Response('', {
                    status: 200,
                    statusText: 'OK',
                    headers: new Headers({
                        'Content-Type': 'text/css',
                    })
                }))
        );
        return;
    }

    // Handle all GET requests
    if (fetchEvent.request.method === 'GET') {
        fetchEvent.respondWith(
            caches.match(fetchEvent.request)
                .then(async (cachedResponse) => {
                    if (cachedResponse) {
                        console.log('Using cached:', requestUrl);
                        return cachedResponse;
                    }

                    try {
                        const networkResponse = await fetch(fetchEvent.request);
                        if (networkResponse.ok && shouldCache(requestUrl)) {
                            const cache = await caches.open(CACHE_NAME);
                            await cache.put(fetchEvent.request, networkResponse.clone());
                            console.log('Cached new resource:', requestUrl);
                        }
                        return networkResponse;
                    } catch (fetchError) {
                        console.error('Fetch failed:', requestUrl);
                        
                        // For HTML requests, return the offline page
                        if (fetchEvent.request.headers.get('accept')?.includes('text/html')) {
                            const offlineResponse = await caches.match('/offline.html');
                            if (offlineResponse) return offlineResponse;
                        }

                        // For JavaScript files, return a working empty module
                        if (requestUrl.endsWith('.js')) {
                            return new Response(
                                'window.addEventListener("load", function() { console.log("Offline mode - Module loaded"); });',
                                {
                                    status: 200,
                                    headers: new Headers({
                                        'Content-Type': 'application/javascript',
                                        'Cache-Control': 'no-store'
                                    })
                                }
                            );
                        }

                        // For CSS files, return minimal required styles
                        if (requestUrl.endsWith('.css')) {
                            return new Response(
                                `body { font-family: system-ui, -apple-system, sans-serif; }`,
                                {
                                    status: 200,
                                    headers: new Headers({
                                        'Content-Type': 'text/css',
                                        'Cache-Control': 'no-store'
                                    })
                                }
                            );
                        }

                        // For other requests, return a basic error response
                        return new Response('Offline content not available', {
                            status: 200, // Changed from 503 to 200 to prevent error states
                            headers: new Headers({
                                'Content-Type': 'text/plain',
                                'Cache-Control': 'no-store'
                            })
                        });
                    }
                })
        );
        return;
    }

    // Handle API requests that need background sync
    if (requestUrl.includes('/api/')) {
        if (!navigator.onLine) {
            fetchEvent.respondWith(
                storeFailedRequest(fetchEvent.request)
                    .then(() => new Response('Request stored for background sync', { 
                        status: 503,
                        headers: new Headers({
                            'Content-Type': 'application/json'
                        })
                    }))
            );
            return;
        }
    }
}) as EventListener);

// Enhanced background sync handler
sw.addEventListener("sync", ((event) => {
    const syncEvent = event as ExtendableEvent;
    if ('tag' in syncEvent && syncEvent.tag === "sync-data") {
        console.log('🔄 Background sync triggered');
        syncEvent.waitUntil(syncData());
    }
}) as EventListener);

// Push Notifications
sw.addEventListener("push", ((event) => {
    const pushEvent = event as PushEvent;
    const data = pushEvent.data?.json() || { 
        title: "New Notification", 
        message: "You have a new update!" 
    };

    pushEvent.waitUntil(
        sw.registration.showNotification(data.title, {
            body: data.message,
            icon: "/logo192.png",
            badge: "/badge.png"
        })
    );
}) as EventListener);

// Handle notification clicks
((self as unknown) as ServiceWorkerGlobalScope).addEventListener('notificationclick', ((event) => {
    const notification = event as NotificationEvent;
    notification.notification.close();

    if (notification.action === 'open') {
        ((self as unknown) as ServiceWorkerGlobalScope).clients.openWindow('/');
    }
}) as EventListener);