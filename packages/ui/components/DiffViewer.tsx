/**
 * DiffViewer component for side-by-side document comparison
 */

import React, { useMemo, useState } from 'react';
import ReactDiffViewer, { ReactDiffViewerStylesOverride } from 'react-diff-viewer-continued';
import { isDocumentTooLarge } from '../utils/diffGenerator';
import { Loader2, AlertTriangle } from 'lucide-react';

interface DiffViewerProps {
  /** Old document content */
  oldContent: string;
  /** New document content */
  newContent: string;
  /** Type of diff view */
  splitView?: boolean;
  /** Enable dark theme */
  useDarkTheme?: boolean;
  /** Hide line numbers */
  hideLineNumbers?: boolean;
  /** Show only changed lines */
  showDiffOnly?: boolean;
  /** Optional title for old content */
  oldTitle?: string;
  /** Optional title for new content */
  newTitle?: string;
  /** Extra CSS classes */
  className?: string;
}

/**
 * Warning for documents that are too large for efficient diff viewing
 */
function DocumentSizeWarning({ lineCount }: { lineCount: number }) {
  return (
    <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-2">
      <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
      <div className="text-sm">
        <p className="font-medium text-yellow-800 dark:text-yellow-200">
          Document is very large ({lineCount.toLocaleString()} lines)
        </p>
        <p className="text-yellow-700 dark:text-yellow-300 mt-1">
          Diff rendering may be slow. Consider exporting to a file for comparison.
        </p>
      </div>
    </div>
  );
}

/**
 * Custom dark theme styles for the diff viewer
 */
const darkThemeStyles: ReactDiffViewerStylesOverride = {
  variables: {
    dark: {
      diffViewerBackground: '#1e1e1e',
      diffViewerColor: '#d4d4d4',
      addedBackground: '#0d4d25',
      addedColor: '#b4f8b0',
      removedBackground: '#5c1818',
      removedColor: '#ffb4b4',
      wordAddedBackground: '#1a6b32',
      wordRemovedBackground: '#7c2323',
      addedGutterBackground: '#0a3d1e',
      removedGutterBackground: '#461313',
      gutterBackground: '#2d2d2d',
      gutterBackgroundDark: '#252525',
      highlightBackground: '#2d2d2d',
      highlightGutterBackground: '#3a3a3a',
      codeFoldGutterBackground: '#2d2d2d',
      codeFoldBackground: '#252525',
      emptyLineBackground: '#2d2d2d',
      gutterColor: '#858585',
      addedGutterColor: '#b4f8b0',
      removedGutterColor: '#ffb4b4',
      codeFoldContentColor: '#858585',
      diffViewerTitleBackground: '#2d2d2d',
      diffViewerTitleColor: '#d4d4d4',
      diffViewerTitleBorderColor: '#3a3a3a',
    },
  },
};

/**
 * Custom light theme styles for the diff viewer
 */
const lightThemeStyles: ReactDiffViewerStylesOverride = {
  variables: {
    light: {
      diffViewerBackground: '#ffffff',
      diffViewerColor: '#24292e',
      addedBackground: '#e6ffec',
      addedColor: '#24292e',
      removedBackground: '#ffebe9',
      removedColor: '#24292e',
      wordAddedBackground: '#acf2bd',
      wordRemovedBackground: '#ffb8b8',
      addedGutterBackground: '#cdffd8',
      removedGutterBackground: '#ffd7d5',
      gutterBackground: '#f6f8fa',
      gutterBackgroundDark: '#f3f5f8',
      highlightBackground: '#fff8c5',
      highlightGutterBackground: '#fffbdd',
      codeFoldGutterBackground: '#f6f8fa',
      codeFoldBackground: '#f3f5f8',
      emptyLineBackground: '#fafbfc',
      gutterColor: '#babbbd',
      addedGutterColor: '#22863a',
      removedGutterColor: '#cb2431',
      codeFoldContentColor: '#babbbd',
      diffViewerTitleBackground: '#f6f8fa',
      diffViewerTitleColor: '#24292e',
      diffViewerTitleBorderColor: '#d1d5da',
    },
  },
};

export const DiffViewer: React.FC<DiffViewerProps> = ({
  oldContent,
  newContent,
  splitView = true,
  useDarkTheme: useDarkThemeProp = true,
  hideLineNumbers = false,
  showDiffOnly = false,
  oldTitle = 'Original',
  newTitle = 'Modified',
  className = '',
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  // Detect dark mode from system/class if not explicitly set
  const useDarkTheme = useMemo(() => {
    if (useDarkThemeProp !== undefined) {
      return useDarkThemeProp;
    }
    return document.documentElement.classList.contains('dark');
  }, [useDarkThemeProp]);

  // Check document size
  const isTooLarge = useMemo(() => {
    return isDocumentTooLarge(newContent, 10000) || isDocumentTooLarge(oldContent, 10000);
  }, [oldContent, newContent]);

  const lineCount = useMemo(() => {
    return Math.max(oldContent.split('\n').length, newContent.split('\n').length);
  }, [oldContent, newContent]);

  // Render the diff viewer
  const renderDiffViewer = () => {
    return (
      <ReactDiffViewer
        oldValue={oldContent}
        newValue={newContent}
        splitView={splitView}
        useDarkTheme={useDarkTheme}
        hideLineNumbers={hideLineNumbers}
        showDiffOnly={showDiffOnly}
        compareMethod={DiffMethod.WORDS}
        styles={useDarkTheme ? darkThemeStyles : lightThemeStyles}
        onLineNumberClick={(number: number) => {
          console.log('Clicked line:', number);
        }}
        leftTitle={oldTitle}
        rightTitle={newTitle}
        extraLinesSurroundingDiff={3}
      />
    );
  };

  return (
    <div className={`diff-viewer ${className}`}>
      {isGenerating && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            Generating diff...
          </span>
        </div>
      )}

      {!isGenerating && isTooLarge && <DocumentSizeWarning lineCount={lineCount} />}

      {!isGenerating && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {renderDiffViewer()}
        </div>
      )}
    </div>
  );
};

// Export the DiffMethod enum for type safety
export const DiffMethod = {
  CHARS: 'chars' as const,
  WORDS: 'words' as const,
  LINES: 'lines' as const,
};

export default DiffViewer;
