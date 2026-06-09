import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

const { subscribe, update } = writable<Toast[]>([]);

export const toasts = { subscribe };

export function addToast(message: string, type: ToastType = 'info'): string {
  const id = crypto.randomUUID();
  update((list) => [...list, { id, message, type }]);

  if (type === 'success') {
    setTimeout(() => dismissToast(id), 3000);
  }

  return id;
}

export function dismissToast(id: string): void {
  update((list) => list.filter((t) => t.id !== id));
}
