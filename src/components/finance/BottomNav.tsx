import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowLeftRight,
  LineChart,
  Landmark,
  Zap,
  Target,
  MoreHorizontal,
  User,
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const PRIMARY_NAV_ITEMS = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Transactions', url: '/transactions', icon: ArrowLeftRight },
  { title: 'Insights', url: '/insights', icon: LineChart },
  { title: 'Focus', url: '/focus', icon: Target },
]

const MORE_NAV_ITEMS = [
  { title: 'Loans', url: '/loans', icon: Landmark },
  { title: 'Automations', url: '/automations', icon: Zap },
  { title: 'Profile', url: '/profile', icon: User },
]

/** Primary navigation on phones — this is the app's only nav now (no desktop
 * sidebar). Capped at 5 tabs for one-thumb reach; anything past the first 4
 * destinations lives behind "More". */
export function BottomNav() {
  const location = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)

  const isMoreActive = MORE_NAV_ITEMS.some((item) => location.pathname.startsWith(item.url))

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="grid grid-cols-5">
          {PRIMARY_NAV_ITEMS.map((item) => {
            const isActive =
              item.url === '/' ? location.pathname === '/' : location.pathname.startsWith(item.url)
            return (
              <Link
                key={item.title}
                to={item.url}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex h-14 flex-col items-center justify-center gap-0.5 text-2xs font-medium transition-transform duration-100 active:scale-95 active:bg-muted motion-reduce:active:scale-100',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <item.icon className="size-5" />
                {item.title}
              </Link>
            )
          })}
          <button
            type="button"
            aria-current={isMoreActive ? 'page' : undefined}
            onClick={() => setMoreOpen(true)}
            className={cn(
              'flex h-14 flex-col items-center justify-center gap-0.5 text-2xs font-medium transition-transform duration-100 active:scale-95 active:bg-muted motion-reduce:active:scale-100',
              isMoreActive ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <MoreHorizontal className="size-5" />
            More
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <SheetHeader>
            <SheetTitle>More</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 px-4">
            {MORE_NAV_ITEMS.map((item) => {
              const isActive = location.pathname.startsWith(item.url)
              return (
                <Link
                  key={item.title}
                  to={item.url}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    'flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors active:bg-muted',
                    isActive ? 'text-primary' : 'text-foreground',
                  )}
                >
                  <item.icon className="size-5" />
                  {item.title}
                </Link>
              )
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
