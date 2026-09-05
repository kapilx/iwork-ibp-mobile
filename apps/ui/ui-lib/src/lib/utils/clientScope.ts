const CLIENT_SCOPE_STORAGE_KEY = "clientScopeId";

const safeGetSessionStorage = (): Storage | null => {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

const generateScopeId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
};

export const getOrCreateClientScopeId = (): string => {
  if (typeof window === "undefined") return "";
  const storage = safeGetSessionStorage();
  if (!storage) return "";

  const existing = storage.getItem(CLIENT_SCOPE_STORAGE_KEY);
  if (existing) return existing;

  const scopeId = generateScopeId();
  storage.setItem(CLIENT_SCOPE_STORAGE_KEY, scopeId);
  return scopeId;
};

export const CLIENT_SCOPE_KEY = CLIENT_SCOPE_STORAGE_KEY;
