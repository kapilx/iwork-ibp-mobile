import { configureStore, Middleware } from "@reduxjs/toolkit";
import userReducer from "./slice";
import permissionsReducer from "./permissionSlice";
import policyReducer from "./policiesSlice";
import nl2sqlChatReducer from "./nl2sqlChatSlice";
import passwordProtectionConfigReducer from "./passwordProtectionConfigSlice";
import exportsReducer from "./exportsSlice";

// IndexedDB helper functions
const DB_NAME = "nl2sqlChatDB";
const DB_VERSION = 1;
const STORE_NAME = "chatState";

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

const saveToIndexedDB = async (key: string, value: any) => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.put(value, key);

    return new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
    });
  } catch (error) {
    console.error("Failed to save to IndexedDB:", error);
  }
};

const loadFromIndexedDB = async (key: string): Promise<any> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        db.close();
        resolve(request.result);
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch (error) {
    console.error("Failed to load from IndexedDB:", error);
    return undefined;
  }
};

// Debounce helper to prevent too frequent saves
let saveTimeout: NodeJS.Timeout | null = null;

// IndexedDB persistence middleware for nl2sqlChat
const nl2sqlChatPersistenceMiddleware: Middleware =
  (store) => (next) => (action) => {
    const result = next(action);
    // Only persist nl2sqlChat state
    if ((action as { type?: string }).type?.startsWith("nl2sqlChat/")) {
      const state = store.getState();

      // Debounce saves to avoid blocking UI on rapid updates
      if (saveTimeout) clearTimeout(saveTimeout);

      saveTimeout = setTimeout(() => {
        const dataToStore = {
          messages: state.nl2sqlChat.messages,
          lastUserMessage: state.nl2sqlChat.lastUserMessage,
          isLoading: false,
        };

        // Save asynchronously - won't block UI
        saveToIndexedDB("nl2sqlChatState", dataToStore).then(() => {
          console.log("✅ Chat saved to IndexedDB");
        });
      }, 500); // Save 500ms after last action
    }

    return result;
  };

// Load persisted state from IndexedDB
const loadPersistedState = async () => {
  try {
    const state = await loadFromIndexedDB("nl2sqlChatState");
    return state;
  } catch (error) {
    console.error("Failed to load persisted state:", error);
    return undefined;
  }
};

// Create store without preloaded state initially
const store = configureStore({
  reducer: {
    user: userReducer,
    permissions: permissionsReducer,
    policyData: policyReducer,
    nl2sqlChat: nl2sqlChatReducer,
    passwordProtectionConfig: passwordProtectionConfigReducer,
    exports: exportsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(nl2sqlChatPersistenceMiddleware),
});

// Load persisted state asynchronously and update store
loadPersistedState().then((persistedState) => {
  if (persistedState) {
    store.dispatch({
      type: "nl2sqlChat/restoreState",
      payload: {
        messages: persistedState.messages || [],
        lastUserMessage: persistedState.lastUserMessage || "",
        isLoading: false,
      },
    });
    console.log("✅ Chat history restored from IndexedDB");
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
