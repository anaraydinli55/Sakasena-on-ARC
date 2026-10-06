import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'sonner'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#1b1937',
          color: '#f3f4f6',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '12px',
        },
      }}
    />
  </React.StrictMode>,
)
