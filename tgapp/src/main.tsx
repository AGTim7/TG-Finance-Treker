import './index.css'
import { StrictMode } from 'react'
import { HashRouter } from 'react-router'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'


// import('eruda').then((eruda) => {
//   eruda.default.init();
// });


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
)
