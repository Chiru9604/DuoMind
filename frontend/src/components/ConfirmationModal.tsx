import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  mode: 'normal' | 'pro';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  mode
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className={`
        relative w-full max-w-md mx-4 rounded-xl shadow-2xl border
        ${mode === 'pro'
          ? 'bg-gray-800 border-purple-500/30 text-white'
          : 'bg-white border-gray-200 text-gray-900'
        }
      `}>
        {/* Header */}
        <div className={`
          flex items-center justify-between p-6 border-b
          ${mode === 'pro'
            ? 'border-gray-700'
            : 'border-gray-200'
          }
        `}>
          <div className="flex items-center gap-3">
            <div className={`
              p-2 rounded-full
              ${mode === 'pro'
                ? 'bg-red-500/20 text-red-400'
                : 'bg-red-100 text-red-600'
              }
            `}>
              <AlertTriangle size={20} />
            </div>
            <h3 className={`
              text-lg font-semibold
              ${mode === 'pro' ? 'text-white' : 'text-gray-900'}
            `}>
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`
              p-1 rounded-lg transition-colors
              ${mode === 'pro'
                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }
            `}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className={`
            text-sm leading-relaxed
            ${mode === 'pro' ? 'text-gray-300' : 'text-gray-600'}
          `}>
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className={`
          flex gap-3 p-6 border-t
          ${mode === 'pro'
            ? 'border-gray-700'
            : 'border-gray-200'
          }
        `}>
          <button
            onClick={onClose}
            className={`
              flex-1 px-4 py-2 rounded-lg font-medium transition-colors
              ${mode === 'pro'
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white border border-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              }
            `}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`
              flex-1 px-4 py-2 rounded-lg font-medium transition-colors
              ${mode === 'pro'
                ? 'bg-red-600 text-white hover:bg-red-700 border border-red-500'
                : 'bg-red-600 text-white hover:bg-red-700 border border-red-600'
              }
            `}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;