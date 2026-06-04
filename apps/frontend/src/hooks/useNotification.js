import { useState, useCallback } from 'react';

export const useNotification = () => {
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  const showSuccess = useCallback((message) => {
    setNotification({ open: true, message, severity: 'success' });
  }, []);

  const showError = useCallback((message) => {
    setNotification({ open: true, message, severity: 'error' });
  }, []);

  const showWarning = useCallback((message) => {
    setNotification({ open: true, message, severity: 'warning' });
  }, []);

  const close = useCallback(() => {
    setNotification((prev) => ({ ...prev, open: false }));
  }, []);

  return { notification, showSuccess, showError, showWarning, close };
};
