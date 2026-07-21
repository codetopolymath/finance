import { lazy, Suspense } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { useIsFetching, useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
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
const Profile = lazy(() => import('@/routes/Profile'))
const Focus = lazy(() => import('@/routes/Focus'))

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/transactions': 'Transactions',
  '/insights': 'Insights',
  '/loans': 'Loans',
  '/automations': 'Automations',
  '/automations/receipt': 'Add from Receipt',
  '/profile': 'Profile',
  '/focus': 'Focus',
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
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
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
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
        <Suspense fallback={<Skeleton className="h-72 w-full" />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/loans" element={<Loans />} />
            <Route path="/automations" element={<Automations />} />
            <Route path="/automations/receipt" element={<ReceiptCapture />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/focus" element={<Focus />} />
          </Routes>
        </Suspense>
      </div>
      <BottomNav />
      <Toaster position="top-center" />
    </div>
  )
}

export default App
