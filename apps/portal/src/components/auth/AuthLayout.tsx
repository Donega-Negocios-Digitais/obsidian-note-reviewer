import type { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
  title: string
  description?: string
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side - Branding */}
      <div className="hidden lg:flex flex-col justify-between bg-muted p-12">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">Obsidian Note Reviewer</h1>
          <p className="text-lg text-muted-foreground">
            Revisão visual de markdown com integração perfeita ao Claude Code
          </p>
        </div>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Colabore em tempo real, adicione anotações visuais, e muito mais.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
