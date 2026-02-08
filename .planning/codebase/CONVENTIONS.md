# Coding Conventions

**Analysis Date:** 2025-02-08

## Naming Patterns

**Files:**
- PascalCase for React components: `ConfirmationDialog.tsx`, `DocumentWorkspace.tsx`, `AnnotationPanel.tsx`
- camelCase for hooks: `useDocumentTabs.ts`, `useTheme.ts`, `useCopyFeedback.ts`, `useBreakpoint.ts`
- camelCase for utilities and API files: `subscription.ts`, `cors.ts`, `vaultIntegration.ts`, `pathValidation.ts`
- kebab-case for configuration: `vite.config.ts`, `eslint.config.cjs`
- `index.ts` for barrel exports in directories
- Test files: `Component.test.tsx` or `Component.spec.tsx` (co-located with source)

**Functions:**
- camelCase for all functions: `getUserSubscription`, `handleKeyDown`, `addTab`, `getAllowedOrigins`
- Prefix event handlers with `handle`: `handleKeyDown`, `handleCopy`, `handleAnnotationUpdate`, `handleFocus`
- Prefix boolean-returning functions with `is/has/can/should`: `isUserPro`, `isCurrentUser`, `isMobile`, `isAuthenticated`, `isOriginAllowed`
- Hook functions start with `use`: `useDocumentTabs`, `useTheme`, `useResponsive`, `useCopyFeedback`
- Underscore prefix for intentionally private functions: `_validatePath()`

**Variables:**
- camelCase for all variables: `const activeTab`, `const maxTabs`, `const timeoutRef`, `filePath`, `noteContent`
- Use `is` prefix for booleans: `isOpen`, `isMobile`, `isDark`, `isAuthenticated`
- Use `_` prefix for intentionally unused parameters: `argsIgnorePattern: '^_'` (ESLint rule)
- Array naming plural: `tabs`, `annotations`, `globalComments`, `sortedAnnotations`
- UPPER_CASE for constants: `DEFAULT_ALLOWED_ORIGINS`, `TEMP_DIR`, `PERSIST_KEY`
- UPPER_SNAKE_CASE for environment variables: `ALLOWED_ORIGINS`, `VITE_SUPABASE_URL`

**Types:**
- PascalCase for interfaces: `DocumentTab`, `AnnotationPanelProps`, `LayoutProps`, `PanelProps`, `CSPDirectives`
- PascalCase for type aliases: `AnnotationType`, `CopyState`, `SortOption`, `BreakpointValue`
- PascalCase for enums: `AnnotationType`, `AnnotationStatus`, `EditorMode`, `SubscriptionTier`
- Append `Props` to component prop interfaces: `ConfirmationDialogProps`, `DocumentWorkspaceProps`
- Append `Options` to hook option interfaces: `UseDocumentTabsOptions`, `CopyFeedbackOptions`
- Append `Return` to hook return interfaces: `UseDocumentTabsReturn`, `UseCopyFeedbackResult`
- Append `Request`/`Response` to API types: `CreateSubscriptionRequest`, `VersionListResponse`

## Code Style

**Formatting:**
- ESLint with TypeScript support (eslint.config.cjs)
- Prettier configured but not explicitly visible
- Key ESLint rules enforced:
  - `@typescript-eslint/no-unused-vars`: error (with `_` prefix allowed via `argsIgnorePattern`)
  - `@typescript-eslint/no-explicit-any`: warn
  - `@typescript-eslint/no-non-null-assertion`: warn
  - `react-hooks/rules-of-hooks`: error
  - `react-hooks/exhaustive-deps`: warn
  - `no-console`: warn (allow: `warn`, `error`)
  - `no-debugger`: error
  - `no-alert`: error

**Linting:**
- TypeScript ESLint parser with latest ECMAScript support
- React and React Hooks plugins enabled
- Security plugin enabled for vulnerability detection
- Lint-staged with Husky for pre-commit checks
- Max warnings set to 0: `bun run lint`
- Security rules: detect-object-injection, detect-unsafe-regex, detect-eval-with-expression

**Import Organization:**
1. External dependencies (React, third-party libraries): `import React from 'react';`
2. Internal workspace dependencies (`@obsidian-note-reviewer/*`): `import { MarkdownRenderer } from '@obsidian-note-reviewer/ui/markdown';`
3. Relative imports (`../components/*`, `./types`): `import { validatePath } from './pathValidation';`
4. Type-only imports grouped separately when needed

**Path Aliases:**
```typescript
'@': '/src'
'@obsidian-note-reviewer/ui': '/packages/ui'
'@obsidian-note-reviewer/core': '/packages/core'
'@obsidian-note-reviewer/collaboration': '/packages/collaboration'
'@obsidian-note-reviewer/annotation': '/packages/annotation'
'@/components': alias for app components
```

**Workspace Imports:**
Use workspace references for cross-package imports:
```typescript
// UI components
import { MarkdownRenderer } from '@obsidian-note-reviewer/ui/markdown';
import { AnnotationExport } from '@obsidian-note-reviewer/ui/annotation';

// Security/Auth
import { useAuth } from '@obsidian-note-reviewer/security/auth';
import { supabase } from '@obsidian-note-reviewer/security/supabase/client';

// Collaboration
import type { UserSubscription } from '@obsidian-note-reviewer/collaboration/types/tier';

// External
import { createClient } from '@supabase/supabase-js';
import React, { useEffect, useCallback } from 'react';
```

## Error Handling

**Patterns:**
- Try-catch blocks for async operations in API functions
- Check `error` property from Supabase responses
- Console.error with descriptive messages
- Return `null` on error for functions that return data
- Throw errors in hooks for caller to handle
- Use Error instances, not strings: `new Error('Failed to copy to clipboard')`
- Graceful degradation for non-critical failures

**Example from `subscription.ts`:**
```typescript
export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }

  return data as UserSubscription | null;
}
```

**Hook Error Pattern from `useCopyFeedback.ts`:**
```typescript
const handleCopy = useCallback(async (text: string) => {
  clearExistingTimeout();
  setState('copying');

  try {
    await navigator.clipboard.writeText(text);
    setState('copied');
    onSuccess?.();
  } catch (error) {
    setState('idle');
    const err = error instanceof Error ? error : new Error('Failed to copy to clipboard');
    onError?.(err);
  }
}, [successDuration, onSuccess, onError, clearExistingTimeout]);
```

**API Error Handling:**
```typescript
try {
  const { data, error } = await supabase.from('notes').select('*');
  if (error) throw error;
  return data;
} catch (error) {
  logger.error('Failed to fetch notes:', error);
  throw createError(500, 'Failed to fetch notes');
}
```

## Logging

**Framework:** Pino for structured logging (`@obsidian-note-reviewer/core/logger`)

**Patterns:**
- Use Pino logger from core package: `import { createLogger } from '@obsidian-note-reviewer/core/logger';`
- Log levels: debug, info, warn, error, fatal
- Development: pino-pretty for readable colored output
- Production: JSON format for log aggregation
- Tests: silent level to reduce noise
- Component-scoped loggers using `createLogger(component)`

**Structured Logging:**
```typescript
import { createLogger } from '@obsidian-note-reviewer/core/logger';

const log = createLogger('MyComponent');

log.debug('Processing document', { id: docId });
log.info('Document saved successfully');
log.warn('Rate limit approaching', { requests: 95 });
log.error('Failed to fetch data', error);
```

**Auth Logging Pattern (from `context.tsx`):**
```typescript
console.log('🔐 [Auth] Inicializando auth...');
console.log('🔐 [Auth] Sessão inicial:', !!session, 'Usuário:', session?.user?.email || 'nenhum');
console.log('🔄 [Auth] Estado mudou:', event, 'Usuário:', session?.user?.email || 'nenhum');
console.error('❌ [Auth] Erro ao inicializar:', error);
```

**Security/Path Validation Logging:**
```typescript
log.error('Failed to validate path', { error: pathError.message, path: userPath });
log.info('Note approved', { noteId, userId });
```

## Comments

**When to Comment:**
- File headers with purpose description (JSDoc style)
- Complex algorithm explanations
- Public API documentation (JSDoc/TSDoc)
- Component prop interfaces
- Hook usage examples
- Security-sensitive validation logic
- Non-obvious side effects
- External API integration patterns

**JSDoc/TSDoc:**
- Use JSDoc for exported functions and components
- Document parameters with `@param`
- Document return types with `@returns`
- Include usage examples with `@example`
- Mark deprecated methods with `@deprecated`

**Example from `useCopyFeedback.ts`:**
```typescript
/**
 * Hook for managing copy-to-clipboard functionality with animation feedback
 *
 * Provides:
 * - Clipboard write with error handling
 * - Copy state management (idle, copying, copied)
 * - Animation class names for visual feedback
 * - Configurable success display duration
 * - Reduced motion preference awareness
 *
 * @example
 * ```tsx
 * const { copied, handleCopy, animationClass } = useCopyFeedback();
 * return <button onClick={() => handleCopy(text)}>{copied ? 'Copied!' : 'Copy'}</button>;
 * ```
 */
export function useCopyFeedback(options: CopyFeedbackOptions = {}): UseCopyFeedbackResult {
  // ...
}
```

**Component Documentation Pattern:**
```typescript
/**
 * Confirmation Dialog Component
 *
 * A reusable modal dialog for confirming destructive or important actions.
 * Follows the modal pattern established in GlobalCommentInput.tsx and ExportModal.tsx.
 */

/**
 * Theme Provider Component
 *
 * Provides theme context to React tree.
 */
```

**Security Validation Documentation:**
```typescript
/**
 * Validates a file path against allowed directories to prevent path traversal attacks
 * @param userPath - The path to validate
 * @returns true if path is safe, false otherwise
 * @throws {Error} If path contains null bytes or other malicious input
 */
function validatePath(userPath: string): boolean {
  // Implementation
}
```

## Function Design

**Size:** Keep functions focused and under 50 lines when possible. Large functions should be split into smaller helpers. Prefer small, focused functions (< 20 lines for simple logic).

**Parameters:**
- Use options object for 3+ parameters: `useDocumentTabs(options: UseDocumentTabsOptions)`
- Destructure parameters in function signature
- Provide default values in destructuring: `confirmLabel = 'Confirmar'`
- Keep parameter count <= 4
- Use interfaces for complex parameter objects
- Avoid optional boolean parameters (use options object instead)

**Return Values:**
- Always return typed values
- Return `null` for "not found" cases (not undefined)
- Return empty arrays `[]` for "no items" (not null/undefined)
- Use union types for error/success: `Promise<UserSubscription | null>`
- Consistent return types across function overloads

**Async Functions:**
- Always return Promise with explicit type
- Handle errors internally or throw for caller
- Use `async/await` syntax (not `.then()`)
- Check for error property in database responses

## Module Design

**Exports:**
- Named exports for functions and components: `export function useTheme()`
- Default export for main component in file
- Type exports co-located with implementation
- Barrel exports in `index.ts` files

**Barrel Files:**
- Re-export commonly used items
- Organize by category in packages
- Use in packages for public API: `packages/ui/index.ts`
- No barrel files in apps directory (prefer direct imports)

**Example from hooks:**
```typescript
// hooks/index.ts
export { useBreakpoint } from './useBreakpoint';
export { useTheme } from './useTheme';
export { useResponsive } from './useResponsive';

// Type re-exports
export type { DocumentTab, UseDocumentTabsOptions, UseDocumentTabsReturn } from './useDocumentTabs';
```

**Package Exports (package.json):**
```json
{
  "exports": {
    "./markdown": "./components/MarkdownRenderer.tsx",
    "./annotation": "./lib/annotation.ts",
    "./hooks/*": "./hooks/*.ts",
    "./types": "./types.ts",
    "./auth": "./src/auth/context.tsx"
  }
}
```

## Component Patterns

**HOCs (Higher-Order Components):**
- Use for authentication guards: `withAuth(Component)` (from `@obsidian-note-reviewer/security/auth`)
- Minimal usage - prefer composition and hooks
- Example from auth context:
```typescript
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function AuthProtectedComponent(props: P) {
    const isAuthenticated = useIsAuthenticated();
    if (!isAuthenticated) return null;
    return React.createElement(Component, props);
  }
}
```

**Contexts:**
- Create with `createContext<T | null>(null)`
- Throw error in hook if context is null
- Export provider component and custom hook
- Use for shared state: auth, theme, collaboration

**Context Pattern from `ThemeProvider.tsx`:**
```typescript
const ThemeContext = React.createContext<{
  mode: 'light' | 'dark' | 'system';
  isDark: boolean;
  setMode: (mode: 'light' | 'dark' | 'system') => void;
  toggle: () => void;
} | null>(null);

export function ThemeProvider({ children }: ThemeProviderProps) {
  const value = React.useMemo(() => ({ mode, isDark, setMode, toggle }), [mode, isDark, setMode, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
```

**Hooks:**
- Always prefix with `use`
- Return object for multiple values (not tuple unless appropriate)
- Use `useCallback` for event handlers
- Use `useMemo` for expensive computations
- Include JSDoc with usage examples
- Export hook-specific types
- Separate state and effects logic

**Hook Return Pattern:**
```typescript
export interface UseDocumentTabsReturn {
  tabs: DocumentTab[];
  activeTab: DocumentTab | null;
  activeTabId: string | null;
  addTab: (document: Omit<DocumentTab, 'id' | 'position'>) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  moveTab: (tabId: string, newPosition: number) => void;
  updateTab: (tabId: string, updates: Partial<DocumentTab>) => void;
}
```

**Component Structure:**
- Use functional components with hooks
- Separate concerns: container vs presentational
- Implement proper error boundaries
- Destructure props in parameter list
- Use early returns for conditional rendering

**Component Props Pattern:**
```typescript
export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
}) => { /* ... */ };
```

## State Management Patterns

**Local State:**
- Use `useState` for component-specific data
- Boolean state with `is` prefix: `const [isOpen, setIsOpen] = useState(false)`
- Complex state with objects: `const [tabs, setTabs] = useState<DocumentTab[]>([])`

**Context State:**
- Auth state: `AuthProvider` from `@obsidian-note-reviewer/security/auth`
- Theme state: `ThemeProvider` with dark/light/system modes
- Collaboration state: `CollaborationRoom` from Liveblocks
- Presence state: Shared via Liveblocks hooks

**Global State:**
- Zustand available in dependencies (`zustand`: ^5.0.9)
- Used for complex state that spans multiple components

**State Update Patterns:**
```typescript
// Direct update
setState('copied');

// Functional updates for derived state
setTabs(prev => [...prev, newTab]);

// Partial updates for objects
updateTab(tabId, { modified: true });

// Cleanup in effects
useEffect(() => {
  // Setup
  return () => {
    // Cleanup
  };
}, [dependencies]);
```

## TypeScript Conventions

**Type Annotations:**
- Always annotate function parameters
- Always annotate return types for exported functions
- Use `React.FC` for functional components with props
- Use type aliases for complex return types
- Use inline types for simple cases

**Component Props:**
```typescript
export interface DocumentWorkspaceProps {
  initialDocuments?: Document[];
  onDocumentChange?: (document: Document) => void;
  onAnnotationUpdate?: (tabId: string, annotations: Annotation[]) => void;
  compactTabs?: boolean;
  className?: string;
}
```

**Type Safety:**
- Avoid `any` - use `unknown` for truly unknown types
- Use type guards for runtime checks: `error instanceof Error`
- Use enum for fixed sets of values: `AnnotationType`, `AnnotationStatus`, `SubscriptionTier`
- Use discriminated unions for variant types
- Mark unused params with `_` prefix: `argsIgnorePattern: '^_'`
- Use strict null checks
- Use `as Type` sparingly - prefer proper typing
- Use optional chaining: `session?.user?.email`
- Use nullish coalescing: `value ?? defaultValue`

**Generic Patterns:**
```typescript
export type BreakpointValue<T> = T | {
  mobile?: T;
  tablet?: T;
  desktop?: T;
};

export function useBreakpoint<T>(values: BreakpointValue<T>): T {
  const { breakpoint } = useResponsive();
  return getValueForBreakpoint(values, breakpoint);
}
```

**Enum Usage:**
```typescript
export enum AnnotationType {
  DELETION = 'DELETION',
  INSERTION = 'INSERTION',
  REPLACEMENT = 'REPLACEMENT',
  COMMENT = 'COMMENT',
  GLOBAL_COMMENT = 'GLOBAL_COMMENT',
  IMAGE_COMMENT = 'IMAGE_COMMENT',
}

export enum AnnotationStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
}
```

## React Patterns

**Component Structure:**
- Functional components only (no class components)
- Destructure props in parameter list
- Use early returns for conditional rendering
- Keep JSX close to component logic
- Separate container and presentational components when complex

**Effect Patterns:**
- Always return cleanup function from `useEffect`
- Include all dependencies in dependency array
- Use `useCallback` for functions passed to effects
- Check condition before adding event listeners

**Example from `ConfirmationDialog.tsx`:**
```typescript
useEffect(() => {
  if (isOpen) {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }
}, [isOpen, handleKeyDown]);
```

**Event Handlers:**
- Prefix with `handle` for internal handlers
- Prefix with `on` for props (e.g., `onClose`, `onConfirm`)
- Use `useCallback` to maintain referential equality
- Stop propagation when needed: `e.stopPropagation()`
- Prevent default when needed: `e.preventDefault()`

**Conditional Rendering:**
- Early returns preferred: `if (!isOpen) return null;`
- Ternary for simple conditions: `copied ? 'Copied' : 'Copy'`
- Logical AND for optional display: `{showPreview && <Preview />}`

**Keyboard Handling:**
```typescript
const handleKeyDown = useCallback((e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    e.preventDefault();
    onClose();
  }
  if (e.key === 'Enter') {
    e.preventDefault();
    onConfirm();
  }
}, [onClose, onConfirm]);
```

## Async Patterns

**Async Functions:**
- Use `async/await` syntax
- Always annotate return type as Promise
- Handle errors in try-catch or check error response
- Return `null` on error for getter functions
- Throw errors for validation failures

**API Response Pattern:**
```typescript
const { data, error } = await supabase
  .from('subscriptions')
  .select('*')
  .eq('user_id', userId)
  .maybeSingle();

if (error) {
  console.error('Error fetching subscription:', error);
  return null;
}

return data as UserSubscription | null;
```

**Loading States:**
- Include `loading` in hook returns for async operations
- Use boolean for simple loading: `loading: true`
- Use enum for complex states: `'idle' | 'loading' | 'success' | 'error'`

**State Pattern Example:**
```typescript
export type CopyState = 'idle' | 'copying' | 'copied';

const [state, setState] = useState<CopyState>('idle');
```

**Sequential Async Operations:**
```typescript
// Get current subscription
const current = await getUserSubscription(userId);
const fromTier = current?.tier || 'free';

// Update subscription
const updated = await updateUserSubscription(userId, { tier: 'pro' });

// Record in history
if (updated) {
  await recordSubscriptionHistory(userId, fromTier, 'pro', 'upgraded');
}
```

## Testing Patterns

**Test Framework:**
- Vitest with jsdom environment (vitest.config.ts)
- Testing Library for React components
- Happy DOM for global browser polyfills
- Bun test runner also available

**Test File Location:**
- Co-located: `Component.test.tsx` next to `Component.tsx`
- Or in `__tests__` directory: `__tests__/path-validation.test.ts`
- Test files follow same naming as source with `.test.ts` or `.spec.ts` suffix

**Test Structure:**
```typescript
import { describe, test, expect, mock } from 'bun:test';
import { render, screen, fireEvent } from '@testing-library/react';

describe('ComponentName', () => {
  test('description in Portuguese (lowercase)', () => {
    // Arrange
    const props = { /* ... */ };

    // Act
    render(<ComponentName {...props} />);

    // Assert
    expect(screen.getByText('Expected Text')).toBeDefined();
  });
});
```

**Mock Patterns:**
- Use `mock()` from `bun:test` for function mocks
- Use `fireEvent` for user interactions
- Query elements by text content: `getByText`, `queryByText`
- Use `data-testid` for non-text elements

**Coverage:**
- Target: 70% statements, branches, functions, lines (vitest.config.ts)
- Exclude: types, configs, dist files, test files
- Run with: `bun test --coverage`

**Test Example from `ConfirmationDialog.test.tsx`:**
```typescript
test('chama onConfirm ao clicar no botao de confirmar', () => {
  const mockOnConfirm = mock(() => {});
  render(<ConfirmationDialog {...defaultProps} onConfirm={mockOnConfirm} />);

  const confirmButton = screen.getByText('Confirmar');
  fireEvent.click(confirmButton);

  expect(mockOnConfirm).toHaveBeenCalledTimes(1);
});
```

## Styling Conventions

**Styling Approach:**
- Tailwind CSS v4 with inline theme configuration
- CSS variables for theming (oklch color space)
- Utility-first classes in JSX
- Component-specific styles in shared `packages/editor/index.css`
- No separate CSS module files (`.module.css`)

**Color System:**
- oklch color space for better perceptual uniformity
- Semantic color variables: `--primary`, `--secondary`, `--accent`, `--destructive`
- Dark mode as default, light mode with `.light` class
- Custom properties for component colors
- Consistent color tokens across components

**Tailwind Usage:**
- Use `@apply` for component-specific style groups (in CSS files)
- Use inline utility classes for layout: `flex items-center gap-4`
- Use semantic color tokens: `bg-primary`, `text-muted-foreground`
- Use spacing scale: `gap-2`, `p-4`, `mt-6`, `mb-3`
- Use responsive prefixes: `md:`, `lg:` for breakpoint-specific styles

**Animation:**
- CSS animations defined in `index.css`
- Respect `prefers-reduced-motion` for accessibility
- Use descriptive animation names: `copy-pulse`, `annotation-flash`, `copy-success-glow`
- Accessibility: Disable animations via `@media (prefers-reduced-motion: reduce)`

**Example Styling Pattern:**
```tsx
<div className="flex items-center justify-between gap-4 p-4 border border-border rounded-lg">
  <button className="px-4 py-2 rounded-md hover:bg-muted transition-colors">
    Click me
  </button>
</div>

// Complex conditional classes
<div className={`
  group relative p-2.5 rounded-lg border cursor-pointer transition-all
  ${isSelected
    ? 'bg-primary/5 border-primary/30 shadow-sm'
    : 'border-transparent hover:bg-muted/50 hover:border-border/50'
  }
`}>
```

**Theming:**
- Dark mode default: `:root` defines dark theme colors
- Light mode: `.light` class overrides
- Automatic theme switching via ThemeProvider
- CSS custom properties for all colors
- Consistent border, background, foreground tokens

---

*Convention analysis: 2025-02-08*
