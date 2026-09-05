export interface LogData {
  traceId?: string;
  userId?: number;
  status: 'success' | 'failure';
  location: string;
  method: string;
  payload?: unknown;
  messageData?: unknown;
}

export const buildLogMessage = (logData: LogData): string => {
  return JSON.stringify(logData).replace(/\\n/g, '\n');
};

// Error.message/.stack are non-enumerable, so JSON.stringify(error) (as
// buildLogMessage does to messageData) silently produces "{}" for a raw
// Error — use this to flatten it into a plain object first.
export const serializeError = (error: unknown): unknown => {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return error;
};
