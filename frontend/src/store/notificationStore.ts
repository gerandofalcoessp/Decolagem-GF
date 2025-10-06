import { create } from 'zustand';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  actions?: {
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary';
  }[];
}

export interface ConfirmationDialog {
  id: string;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

interface NotificationStore {
  notifications: Notification[];
  confirmationDialog: ConfirmationDialog | null;
  
  // Notification methods
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Convenience methods
  showSuccess: (title: string, message?: string, duration?: number) => string;
  showError: (title: string, message?: string, duration?: number) => string;
  showWarning: (title: string, message?: string, duration?: number) => string;
  showInfo: (title: string, message?: string, duration?: number) => string;
  
  // Confirmation dialog methods
  showConfirmation: (dialog: Omit<ConfirmationDialog, 'id'>) => Promise<boolean>;
  hideConfirmation: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  confirmationDialog: null,
  
  addNotification: (notification) => {
    const id = generateId();
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000,
    };
    
    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));
    
    // Auto remove after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, newNotification.duration);
    }
    
    return id;
  },
  
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
  
  clearNotifications: () => {
    set({ notifications: [] });
  },
  
  showSuccess: (title, message, duration) => {
    return get().addNotification({
      type: 'success',
      title,
      message,
      duration,
    });
  },
  
  showError: (title, message, duration) => {
    return get().addNotification({
      type: 'error',
      title,
      message,
      duration: duration ?? 8000, // Errors stay longer
    });
  },
  
  showWarning: (title, message, duration) => {
    return get().addNotification({
      type: 'warning',
      title,
      message,
      duration,
    });
  },
  
  showInfo: (title, message, duration) => {
    return get().addNotification({
      type: 'info',
      title,
      message,
      duration,
    });
  },
  
  showConfirmation: (dialog) => {
    return new Promise<boolean>((resolve) => {
      const id = generateId();
      const confirmationDialog: ConfirmationDialog = {
        ...dialog,
        id,
        confirmText: dialog.confirmText ?? 'Confirmar',
        cancelText: dialog.cancelText ?? 'Cancelar',
        onConfirm: () => {
          dialog.onConfirm();
          get().hideConfirmation();
          resolve(true);
        },
        onCancel: () => {
          dialog.onCancel?.();
          get().hideConfirmation();
          resolve(false);
        },
      };
      
      set({ confirmationDialog });
    });
  },
  
  hideConfirmation: () => {
    set({ confirmationDialog: null });
  },
}));