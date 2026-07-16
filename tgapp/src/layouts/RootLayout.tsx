import { Outlet, useNavigate, useLocation } from "react-router"
import { Home, BarChart3, ListTodo, Lightbulb, Settings } from "lucide-react"
import { triggerHaptic } from "@/utils/triggerHaptic"

export default function RootLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const handleNavigation = (path: string) => {
    triggerHaptic("selection")
    navigate(path)
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="relative mx-auto flex min-h-screen max-w-110 flex-col bg-tg-bg text-tg-text">
      
      <main className="flex-1 w-full">
        <Outlet />
      </main>


      <nav className="fixed bottom-0 left-1/2 z-50 flex h-18 w-full max-w-110 -translate-x-1/2 items-center justify-around border-t border-t-tg-hint/10 bg-tg-secondary-bg px-2 pb-safe shadow-sm">
        <button 
          onClick={() => handleNavigation("/")}
          className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all ${isActive("/") ? "text-emerald-500 font-semibold" : "text-tg-hint"}`}
        >
          <Home size={22} className={isActive("/") ? "scale-105 text-emerald-500" : ""} />
          <span className="text-[10px]">Главное</span>
        </button>
        
        <button 
          onClick={() => handleNavigation("/analysis")}
          className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all ${isActive("/analysis") ? "text-emerald-500 font-semibold" : "text-tg-hint"}`}
        >
          <BarChart3 size={22} className={isActive("/analysis") ? "scale-105 text-emerald-500" : ""} />
          <span className="text-[10px]">Анализ</span>
        </button>
        
        <button 
          onClick={() => handleNavigation("/history")}
          className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all ${isActive("/history") ? "text-emerald-500 font-semibold" : "text-tg-hint"}`}
        >
          <ListTodo size={22} className={isActive("/history") ? "scale-105 text-emerald-500" : ""} />
          <span className="text-[10px]">История</span>
        </button>

        <button 
          onClick={() => handleNavigation("/useful")}
          className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all ${isActive("/useful") ? "text-emerald-500 font-semibold" : "text-tg-hint"}`}
        >
          <Lightbulb size={22} className={isActive("/useful") ? "scale-105 text-emerald-500" : ""} />
          <span className="text-[10px]">Полезное</span>
        </button>
        
        <button 
          onClick={() => handleNavigation("/settings")}
          className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all ${isActive("/settings") ? "text-emerald-500 font-semibold" : "text-tg-hint"}`}
        >
          <Settings size={22} className={isActive("/settings") ? "scale-105 text-emerald-500" : ""} />
          <span className="text-[10px]">Настройки</span>
        </button>
      </nav>

    </div>
  )
}
