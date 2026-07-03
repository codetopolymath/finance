import { formatDistanceToNow } from 'date-fns'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowLeftRight,
  LineChart,
  Landmark,
  LogOut,
  Wallet,
  PlayCircle,
  Loader2,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useAuth } from '@/lib/auth-context'
import { useTransactions } from '@/lib/queries'
import { useTriggerSpendcheck } from '@/lib/spendcheck'

const NAV_ITEMS = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Transactions', url: '/transactions', icon: ArrowLeftRight },
  { title: 'Insights', url: '/insights', icon: LineChart },
  { title: 'Loans', url: '/loans', icon: Landmark },
]

export function AppSidebar() {
  const location = useLocation()
  const { session, signOut } = useAuth()
  const { dataUpdatedAt } = useTransactions()
  const spendcheck = useTriggerSpendcheck()

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <Wallet className="size-5" />
                <span className="font-medium">Spendcheck</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.url === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {dataUpdatedAt > 0 && (
          <p className="truncate px-2 text-xs text-sidebar-foreground/50">
            Synced {formatDistanceToNow(dataUpdatedAt, { addSuffix: true })}
          </p>
        )}
        {session?.user.email && (
          <p className="truncate px-2 text-xs text-sidebar-foreground/70">{session.user.email}</p>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => spendcheck.mutate()}
              disabled={spendcheck.isPending}
            >
              {spendcheck.isPending ? <Loader2 className="animate-spin" /> : <PlayCircle />}
              <span>{spendcheck.isPending ? 'Starting…' : 'Run spendcheck now'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {spendcheck.isSuccess && (
          <p className="truncate px-2 text-xs text-sidebar-foreground/50">
            Started — check Claude for results
          </p>
        )}
        {spendcheck.isError && (
          <p className="truncate px-2 text-xs text-destructive">
            {spendcheck.error instanceof Error ? spendcheck.error.message : 'Failed to start'}
          </p>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut}>
              <LogOut />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
