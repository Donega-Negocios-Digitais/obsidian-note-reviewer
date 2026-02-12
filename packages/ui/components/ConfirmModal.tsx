/**
 * Generic Confirmation Modal Component
 * Reusable modal for confirmation dialogs across the app
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, Power, AlertTriangle, Info } from 'lucide-react';
import { BaseModal } from './BaseModal';

export type ConfirmActionType = 'delete' | 'deactivate' | 'activate' | 'warning' | 'info';

interface ConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  type?: ConfirmActionType;
  confirmLabel?: string;
  cancelLabel?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  type = 'warning',
  confirmLabel,
  cancelLabel,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const getIconAndColor = () => {
    switch (type) {
      case 'delete':
        return {
          icon: <Trash2 className="w-5 h-5 text-destructive" />,
          bgColor: 'bg-destructive/10',
          buttonColor: 'bg-destructive hover:bg-destructive/90',
        };
      case 'deactivate':
        return {
          icon: <Power className="w-5 h-5 text-orange-500" />,
          bgColor: 'bg-orange-500/10',
          buttonColor: 'bg-orange-500 hover:bg-orange-600',
        };
      case 'activate':
        return {
          icon: <Power className="w-5 h-5 text-green-500" />,
          bgColor: 'bg-green-500/10',
          buttonColor: 'bg-green-500 hover:bg-green-600',
        };
      case 'info':
        return {
          icon: <Info className="w-5 h-5 text-blue-500" />,
          bgColor: 'bg-blue-500/10',
          buttonColor: 'bg-blue-500 hover:bg-blue-600',
        };
      case 'warning':
      default:
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
          bgColor: 'bg-amber-500/10',
          buttonColor: 'bg-amber-500 hover:bg-amber-600',
        };
    }
  };

  const { icon, bgColor, buttonColor } = getIconAndColor();

  return (
    <BaseModal
      isOpen={isOpen}
      onRequestClose={onCancel}
      closeOnBackdropClick={false}
      overlayClassName="z-[120]"
      contentClassName="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm p-6 animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      <div>
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bgColor}`}>
            {icon}
          </div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        </div>

        {/* Message */}
        <p className="text-sm text-muted-foreground mb-6">{message}</p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors text-sm font-medium"
          >
            {cancelLabel || t('settings.actions.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${buttonColor}`}
          >
            {confirmLabel || t('common.confirm')}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};
