import { AuthLayout } from '../components/auth/AuthLayout'
import { SignupForm } from '../components/auth/SignupForm'

export function SignupPage() {
  return (
    <AuthLayout
      title="Criar conta"
      description="Comece sua jornada de revisão visual de notas."
    >
      <SignupForm />
    </AuthLayout>
  )
}
