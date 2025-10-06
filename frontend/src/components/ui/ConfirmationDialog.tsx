import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';

export const ConfirmationDialog: React.FC = () => {
  const { confirmationDialog, hideConfirmation } = useNotificationStore();

  if (!confirmationDialog) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      confirmationDialog.onCancel?.();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              {confirmationDialog.title}
            </h3>
          </div>
          <button
            onClick={confirmationDialog.onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-gray-800 text-base mb-6 leading-relaxed">
          {confirmationDialog.message}
        </p>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={confirmationDialog.onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            {confirmationDialog.cancelText}
          </button>
          <button
            onClick={confirmationDialog.onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
          >
            {confirmationDialog.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};