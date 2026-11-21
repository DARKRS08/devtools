import { useContext } from 'react'
import { ToastContext } from '../components/ToastContext'

export const useToast = () => useContext(ToastContext)
