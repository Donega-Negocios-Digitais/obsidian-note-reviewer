import { AuthLayout } from '../components/auth/AuthLayout'
import { LoginForm } from '../components/auth/LoginForm'

export function LoginPage() {
  return (
    <AuthLayout
      title="Entrar"
      description="Bem-vindo de volta! Faça login para continuar."
    >
      <LoginForm />
    </AuthLayout>
  )
}
