/**
 * Cursor Tracking Hook
 *
 * Tracks cursor position and manages inactivity timeout.
 * Per CONTEXT.md: "Comportamento quando inativo: Esconder cursor apos X segundos de inatividade"
 * Claude's discretion (per RESEARCH.md): 5 seconds
 */

import { useEffect, useRef } from "react";
import { useMyPresence } from "@liveblocks/react";

const INACTIVE_TIMEOUT = 5000; // 5 seconds per RESEARCH.md recommendation

export function useCursorTracking() {
  const [, updateMyPresence] = useMyPresence();
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Update cursor position
      updateMyPresence({
        cursor: {
          x: e.clientX,
          y: e.clientY,
        },
      });

      // Set new timeout for inactivity
      timeoutRef.current = setTimeout(() => {
        updateMyPresence({
          cursor: null,
        });
      }, INACTIVE_TIMEOUT);
    };

    // Add event listener
    window.addEventListener("mousemove", handleMouseMove);

    // Cleanup
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Clear cursor on unmount
      updateMyPresence({
        cursor: null,
      });
    };
  }, [updateMyPresence]);
}

/**
 * Hook for tracking text selection
 */
export function useSelectionTracking() {
  const [, updateMyPresence] = useMyPresence();

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rects = range.getClientRects();

        if (rects.length > 0) {
          const firstRect = rects[0];
          const lastRect = rects[rects.length - 1];

          updateMyPresence({
            selection: {
              start: { x: firstRect.left, y: firstRect.top },
              end: { x: lastRect.right, y: lastRect.bottom },
            },
          });
        }
      } else {
        updateMyPresence({ selection: null });
      }
    };

    document.addEventListener("selectionchange", handleSelection);

    return () => {
      document.removeEventListener("selectionchange", handleSelection);
    };
  }, [updateMyPresence]);
}
