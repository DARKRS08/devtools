import { useCallback, useState } from 'react'
import { ToastContext } from './ToastContext'

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<{ id: number; message: string }[]>([])
  const toast = useCallback((message: string) => {
    const id = Date.now() + Math.random()
    setMessages((current) => [...current.slice(-2), { id, message }])
    window.setTimeout(() => setMessages((current) => current.filter((item) => item.id !== id)), 2400)
  }, [])
  return <ToastContext.Provider value={{ toast }}>
    {children}
    <div className="toast-region" role="status" aria-live="polite">{messages.map((item) => <div className="toast" key={item.id}>{item.message}</div>)}</div>
  </ToastContext.Provider>
}
