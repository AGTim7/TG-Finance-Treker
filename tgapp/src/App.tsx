import './index.css'
import { Routes, Route } from 'react-router';
import RootLayout from './layouts/RootLayout';
import MainPage from './pages/MainPage'
import AnalysisPage from './pages/AnalysisPage';
import HistoryPage from './pages/HistoryPage';
import UsefulPage from './pages/UsefulPage';
import SettingsPage from './pages/SettingsPage';


function App() {

  window.Telegram?.WebApp?.ready()

  return (
      <Routes>
        {/* Главный родительский роут, который отрисует меню на всех страницах */}
        <Route path="/" element={<RootLayout />}>
          {/* index означает, что этот компонент откроется по дефолту на "/" */}
          <Route index element={<MainPage />} />
          <Route path="analysis" element={<AnalysisPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="useful" element={<UsefulPage />} />
          <Route path="settings" element={<SettingsPage />} />
  
          <Route path="*" element={<MainPage />} />
        </Route>
      </Routes>
  )
}

export default App
