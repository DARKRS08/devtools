import { createContext } from 'react'

export type ToastContextType = { toast: (message: string) => void }
export const ToastContext = createContext<ToastContextType>({ toast: () => undefined })
