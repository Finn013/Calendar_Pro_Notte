import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// @ts-ignore
import { registerSW } from 'virtual:pwa-register';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Регистрируем сервис-воркер вручную, но не обновляем автоматически
const updateSW = registerSW({ immediate: true, onNeedRefresh() {}, onOfflineReady() {} });
// Экспортируем функцию обновления для использования в настройках
export { updateSW };