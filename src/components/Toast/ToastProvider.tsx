import { useState, useCallback } from 'react';
import { ToastData, ToastContainer } from './Toast';
import { ToastContext, ToastContextType } from './useToast';

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback((toastData: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const newToast: ToastData = {
      ...toastData,
      id,
    };

    setToasts(prev => [...prev, newToast]);
    return id;
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const hideAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const updateToast = useCallback((id: string, updates: Partial<ToastData>) => {
    setToasts(prev => prev.map(toast => (toast.id === id ? { ...toast, ...updates } : toast)));
  }, []);

  const contextValue: ToastContextType = {
    toasts,
    showToast,
    hideToast,
    hideAllToasts,
    updateToast,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
};
