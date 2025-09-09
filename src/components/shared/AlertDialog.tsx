
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AlertDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  theme: 'light' | 'dark';
}

const AlertDialog: React.FC<AlertDialogProps> = ({ 
    isOpen, 
    title, 
    message, 
    onConfirm, 
    onCancel, 
    confirmText = 'OK', 
    cancelText = 'Отмена',
    theme
}) => {

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    exit: { opacity: 0, scale: 0.9 },
  };
  
  const bgClass = theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
  const confirmBg = theme === 'dark' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-500 hover:bg-blue-400';
  const cancelBg = theme === 'dark' ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300';
  const cancelTextCol = theme === 'dark' ? 'text-white' : 'text-gray-800';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={backdropVariants}
        >
          <motion.div
            className={`rounded-xl shadow-2xl p-6 w-full max-w-sm ${bgClass}`}
            variants={modalVariants}
          >
            <h2 className="text-xl font-bold mb-4">{title}</h2>
            <p className="mb-6 text-base">{message}</p>
            <div className="flex justify-end gap-4">
              {onCancel && (
                <button onClick={onCancel} className={`py-2 px-5 rounded-lg font-semibold transition-colors ${cancelBg} ${cancelTextCol}`}>
                  {cancelText}
                </button>
              )}
              <button onClick={onConfirm} className={`py-2 px-5 rounded-lg font-semibold text-white transition-colors ${confirmBg}`}>
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AlertDialog;
