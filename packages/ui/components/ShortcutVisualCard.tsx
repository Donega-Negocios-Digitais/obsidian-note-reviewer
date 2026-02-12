/**
 * Shortcut Visual Card
 *
 * Displays a keyboard shortcut with an animated visual demonstration
 * of the key press sequence. Each key is shown as a visual keyboard key
 * with press animations.
 */

import React, { useState, useEffect } from 'react';
import type { Shortcut } from '../utils/shortcuts';
import { isMac } from '../utils/shortcuts';
import { BaseModal } from './BaseModal';

interface ShortcutVisualCardProps {
  shortcut: Shortcut;
  onClose?: () => void;
  showCloseButton?: boolean;
  onEdit?: () => void;
}

interface KeyPart {
  label: string;
  isModifier: boolean;
}

export const ShortcutVisualCard: React.FC<ShortcutVisualCardProps> = ({
  shortcut,
  onClose,
  showCloseButton = true,
  onEdit,
}) => {
  const [animationStep, setAnimationStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Parse the shortcut into individual key parts
  const getKeyParts = (): KeyPart[] => {
    const parts: KeyPart[] = [];

    if (shortcut.modCtrl) {
      parts.push({ label: isMac() ? '⌘' : 'Ctrl', isModifier: true });
    }
    if (shortcut.modAlt) {
      parts.push({ label: isMac() ? '⌥' : 'Alt', isModifier: true });
    }
    if (shortcut.modShift) {
      parts.push({ label: isMac() ? '⇧' : 'Shift', isModifier: true });
    }

    // The main key
    parts.push({ label: shortcut.key, isModifier: false });

    return parts;
  };

  const keyParts = getKeyParts();

  // Start animation when component mounts
  useEffect(() => {
    setIsAnimating(true);
    setAnimationStep(0);

    const interval = setInterval(() => {
      setAnimationStep((prev) => {
        if (prev >= keyParts.length - 1) {
          setIsAnimating(false);
          return prev;
        }
        return prev + 1;
      });
    }, 400); // 400ms per key press

    return () => clearInterval(interval);
  }, [shortcut.id, keyParts.length]);

  // Restart animation on click
  const handleReplay = () => {
    setIsAnimating(true);
    setAnimationStep(0);
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm mx-auto overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-accent/10 to-accent/5 p-4 border-b border-border">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-semibold text-base text-foreground">
              {shortcut.label}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {shortcut.description}
            </p>
          </div>
          {showCloseButton && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0 ml-2"
              title="Fechar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Visual Key Demonstration */}
      <div className="p-6">
        {/* Keyboard visualization */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {keyParts.map((part, index) => (
            <React.Fragment key={index}>
              {/* Key */}
              <div
                className={`
                  relative min-w-[3rem] h-14 px-4 flex items-center justify-center
                  rounded-lg border-2 font-mono font-bold text-lg
                  transition-all duration-300 ease-out
                  ${getActiveKeyClass(index, animationStep, isAnimating)}
                `}
              >
                <span className="relative z-10">{part.label}</span>
              </div>

              {/* Plus separator between keys */}
              {index < keyParts.length - 1 && (
                <span className="text-muted-foreground/60 font-semibold text-lg">+</span>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Animation indicator */}
        <div className="mt-6 flex items-center justify-center gap-2">
          {isAnimating ? (
            <>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-accent animate-pulse"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">Demonstrando...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-xs text-muted-foreground">Concluído!</span>
            </>
          )}
        </div>
      </div>

      {/* Footer with replay button */}
      <div className="p-4 bg-muted/30 border-t border-border">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            💡 Pressione as teclas na ordem mostrada
          </p>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => { onClose?.(); onEdit(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar
              </button>
            )}
            <button
              onClick={handleReplay}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/10 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Repetir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Get the appropriate styling class for a key based on animation state
 */
function getActiveKeyClass(
  index: number,
  animationStep: number,
  isAnimating: boolean
): string {
  const baseClasses = "bg-card text-foreground border-border";
  const activeClasses = "bg-accent text-accent-foreground border-accent scale-105 shadow-lg shadow-accent/30";
  const completedClasses = "bg-accent/20 text-accent border-accent/50";

  if (!isAnimating) {
    return completedClasses;
  }

  if (index === animationStep) {
    return activeClasses;
  }

  if (index < animationStep) {
    return completedClasses;
  }

  return baseClasses;
}

/**
 * Modal wrapper for ShortcutVisualCard
 */
export const ShortcutVisualCardModal: React.FC<{
  shortcut: Shortcut | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
}> = ({ shortcut, isOpen, onClose, onEdit }) => {
  if (!isOpen || !shortcut) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onRequestClose={onClose}
      closeOnBackdropClick={true}
      overlayClassName="z-[105]"
    >
      <div>
        <ShortcutVisualCard shortcut={shortcut} onClose={onClose} showCloseButton={true} onEdit={onEdit} />
      </div>
    </BaseModal>
  );
};
