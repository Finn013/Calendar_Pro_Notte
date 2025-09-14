import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// Условная регистрация PWA только в production и с проверкой поддержки
let updateSW: (() => Promise<void>) | undefined;
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  try {
    // @ts-ignore
    const { registerSW } = await import('virtual:pwa-register');
    updateSW = registerSW({
      immediate: false,
      onNeedRefresh() {
        console.log('PWA update available');
      },
      onOfflineReady() {
        console.log('PWA ready to work offline');
      }
    });
  } catch (error) {
    console.warn('PWA registration failed:', error);
  }
}
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
// Экспортируем функцию обновления для использования в настройках
export { updateSW };