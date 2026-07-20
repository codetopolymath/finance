import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, ArrowLeftRight, LineChart, Landmark, Zap, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Transactions', url: '/transactions', icon: ArrowLeftRight },
  { title: 'Insights', url: '/insights', icon: LineChart },
  { title: 'Loans', url: '/loans', icon: Landmark },
  { title: 'Automations', url: '/automations', icon: Zap },
  { title: 'Focus', url: '/focus', icon: Target },
]

/** Primary navigation on phones — the offcanvas sidebar stays for account
 * actions only now (see AppSidebar). Hidden from md: up where the sidebar is
 * the primary nav. */
export function BottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="grid grid-cols-6">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.url === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.url)
          return (
            <Link
              key={item.title}
              to={item.url}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-transform duration-100 active:scale-95 active:bg-muted motion-reduce:active:scale-100',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <item.icon className="size-5" />
              {item.title}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
