import { lazy, Suspense } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { AppSidebar } from '@/components/finance/AppSidebar'
import Login from '@/routes/Login'
import { useAuth } from '@/lib/auth-context'
import { formatFullDate } from '@/lib/format'

const Dashboard = lazy(() => import('@/routes/Dashboard'))
const Transactions = lazy(() => import('@/routes/Transactions'))
const Insights = lazy(() => import('@/routes/Insights'))
const Loans = lazy(() => import('@/routes/Loans'))

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/transactions': 'Transactions',
  '/insights': 'Insights',
  '/loans': 'Loans',
}

function App() {
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] ?? 'Spendcheck'
  const { session, loading } = useAuth()

  if (loading) return null

  if (!session) return <Login />

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-sm font-medium">{title}</h1>
          <span className="ml-auto text-xs text-muted-foreground">{formatFullDate(new Date())}</span>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          <Suspense fallback={<Skeleton className="h-72 w-full" />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/loans" element={<Loans />} />
            </Routes>
          </Suspense>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default App
