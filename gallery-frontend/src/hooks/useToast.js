import { useState, useCallback } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showSuccess = useCallback((title, message) => {
    return addToast({ type: 'success', title, message });
  }, [addToast]);

  const showError = useCallback((title, message) => {
    return addToast({ type: 'error', title, message });
  }, [addToast]);

  const showWarning = useCallback((title, message) => {
    return addToast({ type: 'warning', title, message });
  }, [addToast]);

  const showInfo = useCallback((title, message) => {
    return addToast({ type: 'info', title, message });
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
}
