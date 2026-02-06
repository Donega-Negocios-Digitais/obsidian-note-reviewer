/**
 * Breakpoint Preview Component
 *
 * Preview content at different breakpoints for comparison.
 */

import React from 'react';
import { useBreakpointPreview, type BreakpointSize, type PreviewMode } from '../hooks/useBreakpointPreview';

export interface BreakpointPreviewProps {
  children: React.ReactNode;
}

/**
 * Breakpoint preview container with toolbar
 */
export function BreakpointPreview({ children }: BreakpointPreviewProps) {
  const {
    mode,
    setMode,
    activeBreakpoint,
    setActiveBreakpoint,
    visibleBreakpoints,
    toggleMode,
    cycleBreakpoint,
    isPreviewActive,
    activatePreview,
    deactivatePreview,
  } = useBreakpointPreview();

  if (!isPreviewActive) {
    return (
      <>
        {children}
        <PreviewToggleButton onClick={activatePreview} />
      </>
    );
  }

  return (
    <div className="breakpoint-preview fixed inset-0 z-50 bg-gray-100 dark:bg-gray-900 flex flex-col">
      {/* Toolbar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-wrap">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Breakpoint Preview
            </h2>

            {/* Mode Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <ModeButton
                mode="single"
                current={mode}
                onClick={() => setMode('single')}
                label="Single"
              />
              <ModeButton
                mode="split"
                current={mode}
                onClick={() => setMode('split')}
                label="Split"
              />
              <ModeButton
                mode="all"
                current={mode}
                onClick={() => setMode('all')}
                label="All"
              />
            </div>

            {/* Breakpoint Selector */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <BreakpointButton
                bp="mobile"
                current={activeBreakpoint}
                onClick={() => setActiveBreakpoint('mobile')}
                label="📱 Mobile"
              />
              <BreakpointButton
                bp="tablet"
                current={activeBreakpoint}
                onClick={() => setActiveBreakpoint('tablet')}
                label="📱 Tablet"
              />
              <BreakpointButton
                bp="desktop"
                current={activeBreakpoint}
                onClick={() => setActiveBreakpoint('desktop')}
                label="🖥️ Desktop"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={cycleBreakpoint}
              className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              title="Cycle breakpoints"
            >
              Cycle
            </button>
            <button
              onClick={deactivatePreview}
              className="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Preview Frames */}
      <div className="flex-1 p-6 overflow-auto">
        <div className={`
          flex gap-6 items-start justify-center h-full flex-wrap
        `}>
          {visibleBreakpoints.map((bp) => (
            <BreakpointFrame
              key={bp.name}
              breakpoint={bp}
              showLabel={mode === 'all'}
            >
              {children}
            </BreakpointFrame>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ModeButtonProps {
  mode: PreviewMode;
  current: PreviewMode;
  onClick: () => void;
  label: string;
}

function ModeButton({ mode, current, onClick, label }: ModeButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 text-xs font-medium rounded-md transition-colors
        ${current === mode
          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        }
      `}
    >
      {label}
    </button>
  );
}

interface BreakpointButtonProps {
  bp: 'mobile' | 'tablet' | 'desktop' | 'all';
  current: string;
  onClick: () => void;
  label: string;
}

function BreakpointButton({ bp, current, onClick, label }: BreakpointButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 text-xs font-medium rounded-md transition-colors
        ${current === bp
          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        }
      `}
    >
      {label}
    </button>
  );
}

/**
 * Individual breakpoint frame
 */
export interface BreakpointFrameProps {
  breakpoint: BreakpointSize;
  showLabel?: boolean;
  children: React.ReactNode;
}

export function BreakpointFrame({ breakpoint, showLabel, children }: BreakpointFrameProps) {
  return (
    <div className="flex flex-col items-center flex-shrink-0">
      {showLabel && (
        <div className="mb-2 px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 shadow-sm">
          {breakpoint.icon} {breakpoint.label} ({breakpoint.width}×{breakpoint.height})
        </div>
      )}
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-auto border border-gray-200 dark:border-gray-700"
        style={{
          width: breakpoint.width,
          height: breakpoint.height,
          maxWidth: '100%',
        }}
      >
        <div className="w-full h-full">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Toggle button for activating preview
 */
interface PreviewToggleButtonProps {
  onClick: () => void;
}

function PreviewToggleButton({ onClick }: PreviewToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg transition-colors"
      title="Open breakpoint preview"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      <span className="text-sm font-medium">Preview</span>
    </button>
  );
}

export default BreakpointPreview;
