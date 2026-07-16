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

function isDarkColor(value?: string) {
  if (!value || !/^#[0-9a-f]{6}$/i.test(value)) return false

  const red = Number.parseInt(value.slice(1, 3), 16)
  const green = Number.parseInt(value.slice(3, 5), 16)
  const blue = Number.parseInt(value.slice(5, 7), 16)
  return (red * 299 + green * 587 + blue * 114) / 1000 < 128
}

function applyTelegramTheme() {
  const webApp = window.Telegram?.WebApp
  const previewTheme = import.meta.env.DEV
    ? new URLSearchParams(window.location.search).get('theme')
    : null
  const isDark = previewTheme === 'dark'
    || (previewTheme !== 'light' && (
      webApp?.colorScheme === 'dark'
      || (!webApp?.colorScheme && isDarkColor(webApp?.themeParams?.bg_color))
      || (!webApp && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ))

  document.documentElement.classList.toggle('dark', isDark)
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
}

function App() {
  useEffect(() => {
    const webApp = window.Telegram?.WebApp
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')

    applyTelegramTheme()
    webApp?.ready()
    webApp?.expand()
    webApp?.onEvent?.('themeChanged', applyTelegramTheme)
    systemTheme.addEventListener?.('change', applyTelegramTheme)

    return () => {
      webApp?.offEvent?.('themeChanged', applyTelegramTheme)
      systemTheme.removeEventListener?.('change', applyTelegramTheme)
    }
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
