import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

function Toast({ toast, onClose }) {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info
  };

  const colors = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-600',
      text: 'text-green-800'
    },
    error: {
      bg: 'bg-red-50', 
      border: 'border-red-200',
      icon: 'text-red-600',
      text: 'text-red-800'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200', 
      icon: 'text-yellow-600',
      text: 'text-yellow-800'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600', 
      text: 'text-blue-800'
    }
  };

  const Icon = icons[toast.type];
  const colorScheme = colors[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  return (
    <div className={`flex items-center p-4 rounded-lg border shadow-sm ${colorScheme.bg} ${colorScheme.border}`}>
      <Icon className={`w-5 h-5 ${colorScheme.icon} mr-3 flex-shrink-0`} />
      <div className="flex-1">
        <p className={`font-medium ${colorScheme.text}`}>{toast.title}</p>
        {toast.message && (
          <p className={`text-sm ${colorScheme.text} opacity-80 mt-1`}>{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className={`ml-3 p-1 hover:bg-black hover:bg-opacity-10 rounded ${colorScheme.text}`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function ToastContainer({ toasts, onRemoveToast }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={onRemoveToast} />
      ))}
    </div>
  );
}

export default ToastContainer;
