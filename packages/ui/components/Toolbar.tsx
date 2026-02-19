import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AnnotationType } from '../types';
import { createPortal } from 'react-dom';

interface ToolbarProps {
  highlightElement: HTMLElement | null;
  onAnnotate: (type: AnnotationType, text?: string) => void;
  onClose: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ highlightElement, onAnnotate, onClose }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<'menu' | 'input'>('menu');
  const [activeType, setActiveType] = useState<AnnotationType | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (step === 'input') inputRef.current?.focus();
  }, [step]);

  useEffect(() => {
    setStep('menu');
    setActiveType(null);
    setInputValue('');
    setIsSubmitting(false);
  }, [highlightElement]);

  // Update position on scroll/resize
  useEffect(() => {
    if (!highlightElement) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      const rect = highlightElement.getBoundingClientRect();
      const toolbarTop = rect.top - 48;

      // If selection scrolled out of viewport, close the toolbar
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        onClose();
        return;
      }

      setPosition({
        top: toolbarTop,
        left: rect.left + rect.width / 2,
      });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [highlightElement, onClose]);

  if (!highlightElement || !position) return null;

  const { top, left } = position;

  const handleTypeSelect = (type: AnnotationType) => {
    if (type === AnnotationType.DELETION) {
      onAnnotate(type);
    } else {
      setActiveType(type);
      setStep('input');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeType && inputValue.trim() && !isSubmitting) {
      setIsSubmitting(true);
      setTimeout(() => {
        onAnnotate(activeType, inputValue);
      }, 200);
    }
  };

  return createPortal(
    <div
      className="annotation-toolbar fixed z-[100] bg-popover border border-border rounded-xl shadow-2xl transform -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 duration-150"
      style={{ top, left }}
      onMouseDown={e => e.stopPropagation()}
    >
      {step === 'menu' ? (
        <div className="flex items-center p-1 gap-0.5">
          <ToolbarButton
            onClick={() => handleTypeSelect(AnnotationType.DELETION)}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            }
            label={t('toolbar.delete')}
            className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
          />
          <ToolbarButton
            onClick={() => handleTypeSelect(AnnotationType.COMMENT)}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            }
            label={t('toolbar.comment')}
            className="text-muted-foreground hover:text-accent hover:bg-accent/10"
          />
          <div className="w-px h-5 bg-border mx-0.5" />
          <ToolbarButton
            onClick={onClose}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            }
            label={t('toolbar.cancel')}
            className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
          />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col w-72">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
            <span className="text-sm font-medium text-foreground">{t('toolbar.comment')}</span>
            <button
              type="button"
              onClick={() => setStep('menu')}
              aria-label={t('toolbar.backToMenu')}
              className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="px-4 py-3">
            <textarea
              ref={inputRef}
              rows={3}
              className="w-full text-sm bg-muted border border-border/60 rounded-lg px-3 py-2.5 placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
              placeholder={t('toolbar.addComment')}
              aria-label={t('toolbar.addCommentAria')}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Escape') setStep('menu');
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (inputValue.trim() && !isSubmitting) handleSubmit(e as unknown as React.FormEvent);
                }
                // Shift+Enter: default behavior (new line)
              }}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 pb-3">
            <span className="text-xs text-muted-foreground opacity-60">{t('toolbar.submitHint')}</span>
            <button
              type="submit"
              disabled={!inputValue.trim() || isSubmitting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {isSubmitting && (
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {t('toolbar.save')}
            </button>
          </div>
        </form>
      )}
    </div>,
    document.body
  );
};

const ToolbarButton: React.FC<{
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  className: string;
}> = ({ onClick, icon, label, className }) => (
  <button
    onClick={onClick}
    title={label}
    className={`p-1.5 rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${className}`}
  >
    {icon}
  </button>
);
