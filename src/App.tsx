import { lazy, Suspense } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { useIsFetching, useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { AppSidebar } from '@/components/finance/AppSidebar'
import { BottomNav } from '@/components/finance/BottomNav'
import { Toaster } from '@/components/ui/sonner'
import Login from '@/routes/Login'
import { useAuth } from '@/lib/auth-context'
import { formatFullDate } from '@/lib/format'

const Dashboard = lazy(() => import('@/routes/Dashboard'))
const Transactions = lazy(() => import('@/routes/Transactions'))
const Insights = lazy(() => import('@/routes/Insights'))
const Loans = lazy(() => import('@/routes/Loans'))
const Automations = lazy(() => import('@/routes/Automations'))
const ReceiptCapture = lazy(() => import('@/routes/ReceiptCapture'))

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/transactions': 'Transactions',
  '/insights': 'Insights',
  '/loans': 'Loans',
  '/automations': 'Automations',
  '/automations/receipt': 'Add from Receipt',
}

function App() {
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] ?? 'Spendcheck'
  const { session, loading } = useAuth()
  const queryClient = useQueryClient()
  const isFetching = useIsFetching() > 0

  if (loading) return null

  if (!session) return <Login />

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1 hidden md:flex" />
          <Separator orientation="vertical" className="mr-2 hidden h-4 md:flex" />
          <h1 className="text-sm font-medium">{title}</h1>
          <span className="ml-auto text-xs text-muted-foreground">{formatFullDate(new Date())}</span>
          {/* Installed to the home screen there's no browser reload UI — this
           * is the only way to force fresh data in standalone mode. */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Refresh data"
            onClick={() => queryClient.invalidateQueries()}
          >
            <RefreshCw className={isFetching ? 'animate-spin' : undefined} />
          </Button>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:p-6">
          <Suspense fallback={<Skeleton className="h-72 w-full" />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/loans" element={<Loans />} />
              <Route path="/automations" element={<Automations />} />
              <Route path="/automations/receipt" element={<ReceiptCapture />} />
            </Routes>
          </Suspense>
        </div>
        <BottomNav />
      </SidebarInset>
      <Toaster position="top-center" />
    </SidebarProvider>
  )
}

export default App
