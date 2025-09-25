import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Условная регистрация PWA только в production
let updateSW: (() => Promise<void>) | undefined;

// Динамическая загрузка PWA только в production
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  // PWA registration будет загружен динамически в production
  console.log('PWA will be registered in production mode');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Экспортируем функцию обновления для использования в настройках
export { updateSW };