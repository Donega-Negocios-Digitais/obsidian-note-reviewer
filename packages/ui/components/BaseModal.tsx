import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface BaseModalProps {
  isOpen: boolean;
  onRequestClose?: () => void;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  overlayClassName?: string;
  contentClassName?: string;
  contentProps?: React.HTMLAttributes<HTMLDivElement>;
  children: React.ReactNode;
}

function joinClasses(...classes: Array<string | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onRequestClose,
  closeOnBackdropClick = false,
  closeOnEscape = true,
  overlayClassName,
  contentClassName,
  contentProps,
  children,
}) => {
  useEffect(() => {
    if (!isOpen || !closeOnEscape || !onRequestClose) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      onRequestClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onRequestClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!closeOnBackdropClick || !onRequestClose) return;
    if (event.target !== event.currentTarget) return;
    onRequestClose();
  };

  return createPortal(
    <div
      className={joinClasses(
        'fixed inset-0 z-[70] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm',
        overlayClassName,
      )}
      onClick={handleBackdropClick}
    >
      <div
        className={contentClassName}
        onClick={(event) => event.stopPropagation()}
        {...contentProps}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
};
