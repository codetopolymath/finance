import { formatDistanceToNow } from 'date-fns'
import { Globe, LogOut, Mail, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CurrentAgeCard } from '@/components/finance/CurrentAgeCard'
import { useAuth } from '@/lib/auth-context'
import { useTransactions } from '@/lib/queries'
import { PROFILE } from '@/lib/constants'

export default function Profile() {
  const { fullName, email, portfolio } = PROFILE.user
  const { session, signOut } = useAuth()
  const { dataUpdatedAt } = useTransactions()

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm">
            <User className="size-4 text-muted-foreground" />
            <span className="capitalize">{fullName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="size-4 text-muted-foreground" />
            <span className="truncate text-muted-foreground">{email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Globe className="size-4 text-muted-foreground" />
            <a
              href={portfolio}
              target="_blank"
              rel="noreferrer"
              className="truncate text-muted-foreground underline-offset-2 hover:underline"
            >
              {portfolio}
            </a>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CurrentAgeCard />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          {dataUpdatedAt > 0 && (
            <p className="text-xs text-muted-foreground">
              Synced {formatDistanceToNow(dataUpdatedAt, { addSuffix: true })}
            </p>
          )}
          {session?.user.email && (
            <p className="truncate text-xs text-muted-foreground">Signed in as {session.user.email}</p>
          )}
          <Button variant="outline" className="h-11" onClick={signOut}>
            <LogOut />
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
