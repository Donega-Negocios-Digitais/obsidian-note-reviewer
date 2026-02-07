import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@obsidian-note-reviewer/security/auth'
import EditorApp from '@obsidian-note-reviewer/editor'
import { LoginPage } from './pages/login'
import { SignupPage } from './pages/signup'
import { CallbackPage } from './pages/callback'
import { ForgotPasswordPage } from './pages/forgot-password'
import { ResetPasswordPage } from './pages/reset-password'
import { WelcomePage } from './pages/welcome'
import { SharedDocument } from './pages/SharedDocument'

/**
 * Protected Route Component
 * TEMPORARILY DISABLED - allows access without authentication
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // Auth temporarily disabled - allow direct access
  return <>{children}</>
}

/**
 * Public Route Component
 * TEMPORARILY DISABLED - allows access without authentication
 */
function PublicRoute({ children }: { children: React.ReactNode }) {
  // Auth temporarily disabled - show page directly
  return <>{children}</>
}

/**
 * Main App Component with Router
 */
export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route
            path="/auth/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/auth/signup"
            element={
              <PublicRoute>
                <SignupPage />
              </PublicRoute>
            }
          />
          <Route
            path="/auth/forgot-password"
            element={
              <PublicRoute>
                <ForgotPasswordPage />
              </PublicRoute>
            }
          />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/callback" element={<CallbackPage />} />

          {/* Protected routes */}
          <Route
            path="/editor"
            element={
              <ProtectedRoute>
                <EditorApp />
              </ProtectedRoute>
            }
          />
          <Route
            path="/welcome"
            element={
              <ProtectedRoute>
                <WelcomePage />
              </ProtectedRoute>
            }
          />

          {/* Redirect legacy routes to /editor */}
          <Route path="/dashboard" element={<Navigate to="/editor" replace />} />
          <Route path="/settings" element={<Navigate to="/editor" replace />} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/editor" replace />} />

          {/* Public shared document route - no auth required */}
          <Route path="/shared/:slug" element={<SharedDocument />} />

          {/* Catch all - redirect to editor */}
          <Route path="*" element={<Navigate to="/editor" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
