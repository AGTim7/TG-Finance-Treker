import { useState } from 'react';
import './index.css'
import MainPage from './pages/MainPage'
import { triggerHaptic } from './utils/triggerHaptic';
import { 
  Home, BarChart3, ListTodo, Lightbulb, Settings, 
} from 'lucide-react';

function App() {

  const [activeTab, setActiveTab] = useState('main');
  window.Telegram?.WebApp?.ready()

  return (
    <div className="bg-tg-bg">
      <MainPage/>
      
      <nav className="fixed bottom-0 left-0 right-0 h-18 pb-safe border-t border-tg-hint/10 bg-tg-secondary-bg flex justify-around items-center z-50 px-2 shadow-sm">
        <button 
          onClick={() => { setActiveTab('main'); triggerHaptic('selection'); }}
          className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all ${activeTab === 'main' ? 'text-emerald-500 font-semibold' : 'text-tg-hint'}`}
        >
          <Home size={22} className={activeTab === 'main' ? 'scale-105 text-emerald-500' : ''} />
          <span className="text-[10px]">Главное</span>
        </button>
        
        <button 
          onClick={() => { setActiveTab('analysis'); triggerHaptic('selection'); }}
          className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all ${activeTab === 'analysis' ? 'text-emerald-500 font-semibold' : 'text-tg-hint'}`}
        >
          <BarChart3 size={22} className={activeTab === 'analysis' ? 'scale-105 text-emerald-500' : ''} />
          <span className="text-[10px]">Анализ</span>
        </button>
        
        <button 
          onClick={() => { setActiveTab('history'); triggerHaptic('selection'); }}
          className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all ${activeTab === 'history' ? 'text-emerald-500 font-semibold' : 'text-tg-hint'}`}
        >
          <ListTodo size={22} className={activeTab === 'history' ? 'scale-105 text-emerald-500' : ''} />
          <span className="text-[10px]">История</span>
        </button>

        <button 
          onClick={() => { setActiveTab('useful'); triggerHaptic('selection'); }}
          className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all ${activeTab === 'useful' ? 'text-emerald-500 font-semibold' : 'text-tg-hint'}`}
        >
          <Lightbulb size={22} className={activeTab === 'useful' ? 'scale-105 text-emerald-500' : ''} />
          <span className="text-[10px]">Полезное</span>
        </button>
        
        <button 
          onClick={() => { setActiveTab('settings'); triggerHaptic('selection'); }}
          className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all ${activeTab === 'settings' ? 'text-emerald-500 font-semibold' : 'text-tg-hint'}`}
        >
          <Settings size={22} className={activeTab === 'settings' ? 'scale-105 text-emerald-500' : ''} />
          <span className="text-[10px]">Настройки</span>
        </button>
      </nav>
    </div>
  )
}

export default App
