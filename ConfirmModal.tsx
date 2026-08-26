import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  showReasonInput?: boolean;
  onConfirm: (reason?: string) => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Voltar',
  isDestructive = false,
  showReasonInput = false,
  onConfirm,
  onClose,
}) => {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(reason);
    setReason('');
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        {/* Modal Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white p-6 shadow-2xl z-10 border border-slate-100"
        >
          <button
            id="btn-close-modal"
            onClick={handleClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-xl shrink-0 ${
                isDestructive ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
              }`}
            >
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1 pr-4">
              <h3 className="text-lg font-bold text-slate-900 leading-snug">{title}</h3>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">{description}</p>
            </div>
          </div>

          {showReasonInput && (
            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Motivo do cancelamento (opcional):
              </label>
              <input
                id="input-cancel-reason"
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Imprevisto de trabalho, chuva..."
                className="w-full text-sm px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
          )}

          <div className="mt-6 flex gap-2.5">
            <button
              id="btn-cancel-action"
              onClick={handleClose}
              className="flex-1 py-2.5 px-4 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors active:scale-98"
            >
              {cancelLabel}
            </button>
            <button
              id="btn-confirm-action"
              onClick={handleConfirm}
              className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-xl transition-colors active:scale-98 shadow-sm ${
                isDestructive
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
