import { ToastData } from '@/components/Toast/Toast';
import { useContext, createContext } from 'react';

export interface ToastContextType {
  toasts: ToastData[];
  showToast: (toast: Omit<ToastData, 'id'>) => string;
  hideToast: (id: string) => void;
  hideAllToasts: () => void;
  updateToast: (id: string, updates: Partial<ToastData>) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
