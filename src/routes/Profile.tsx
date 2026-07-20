import { Globe, Mail, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CurrentAgeCard } from '@/components/finance/CurrentAgeCard'
import { PROFILE } from '@/lib/constants'

export default function Profile() {
  const { fullName, email, portfolio } = PROFILE.user

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
    </div>
  )
}
