import { KeyRound, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'

export default function Login() {
  const { signInWithGitHub } = useAuth()

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-4">
      <div className="flex flex-col items-center gap-2">
        <Wallet className="size-8" />
        <h1 className="text-lg font-medium">Spendcheck</h1>
        <p className="text-sm text-muted-foreground">Sign in to view your finance data</p>
      </div>
      <Button onClick={signInWithGitHub} size="lg">
        <KeyRound />
        Sign in with GitHub
      </Button>
    </div>
  )
}
