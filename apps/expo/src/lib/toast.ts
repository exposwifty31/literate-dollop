/**
 * Toast seam — replaces the web `sonner` dependency.
 *
 * Ported hooks call `toast.error(...)` etc. for user feedback. The default
 * implementation is a no-op; the app wires a real RN toast (e.g. a Snackbar)
 * via `setToastHandler`. Keeping this behind a seam avoids a hard dependency
 * on any particular RN toast library at the logic layer.
 */
export interface ToastOptions {
  description?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

export interface ToastHandler {
  success(message: string, options?: ToastOptions): void;
  error(message: string, options?: ToastOptions): void;
  warning(message: string, options?: ToastOptions): void;
  info(message: string, options?: ToastOptions): void;
}

const noopHandler: ToastHandler = {
  success: () => {},
  error: () => {},
  warning: () => {},
  info: () => {},
};

let handler: ToastHandler = noopHandler;

export function setToastHandler(next: Partial<ToastHandler>): void {
  handler = { ...noopHandler, ...next };
}

export const toast: ToastHandler = {
  success: (message, options) => handler.success(message, options),
  error: (message, options) => handler.error(message, options),
  warning: (message, options) => handler.warning(message, options),
  info: (message, options) => handler.info(message, options),
};
