declare global {
    interface ServiceWorkerGlobalScopeEventMap {
        install: ExtendableEvent;
        activate: ExtendableEvent;
        fetch: FetchEvent;
        push: PushEvent;
        sync: SyncEvent;
    }

    interface ExtendableEvent extends Event {
        waitUntil(f: Promise<void>): void;
    }

    class FetchEvent extends ExtendableEvent {
        readonly request: Request;
        respondWith(response: Response | Promise<Response>): void;
    }

    interface PushMessageData {
        json(): { title: string; message: string };
    }

    class PushEvent extends ExtendableEvent {
        readonly data: PushMessageData | null;
    }

    class SyncEvent extends ExtendableEvent {
        readonly tag: string;
        readonly lastChance: boolean;
    }

    interface ServiceWorkerGlobalScope extends WorkerGlobalScope {
        readonly registration: ServiceWorkerRegistration;
        readonly clients: Clients;
        skipWaiting(): Promise<void>;
        addEventListener<K extends keyof ServiceWorkerGlobalScopeEventMap>(
            type: K,
            listener: (this: ServiceWorkerGlobalScope, ev: ServiceWorkerGlobalScopeEventMap[K]) => void,
            options?: boolean | AddEventListenerOptions
        ): void;
    }

    interface Clients {
        claim(): Promise<void>;
    }

    interface ServiceWorkerRegistration {
        showNotification(title: string, options?: NotificationOptions): Promise<void>;
    }

    interface NotificationOptions {
        actions?: Array<{
            action: string;
            title: string;
            icon?: string;
        }>;
    }
}

export { };
