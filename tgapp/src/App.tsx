import './index.css'
import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes } from 'react-router'

import RootLayout from './layouts/RootLayout'
import MainPage from './pages/MainPage'
import { Spinner } from './components/ui/spinner'

const AnalysisPage = lazy(() => import('./pages/AnalysisPage'))
const HistoryPage = lazy(() => import('./pages/HistoryPage'))
const UsefulPage = lazy(() => import('./pages/UsefulPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

function App() {
  useEffect(() => {
    window.Telegram?.WebApp?.ready()
    window.Telegram?.WebApp?.expand()
  }, [])

  return (
    <Suspense
      fallback={(
        <div className="flex min-h-screen items-center justify-center bg-tg-bg text-tg-text">
          <Spinner className="size-6" />
        </div>
      )}
    >
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<MainPage />} />
          <Route path="analysis" element={<AnalysisPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="useful" element={<UsefulPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<MainPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App
