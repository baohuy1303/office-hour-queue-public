import { createContext, useContext } from 'react'

// Lets any component show a toast: const toast = useToast(); toast('Joined the queue')
export const ToastContext = createContext<(message: string) => void>(() => {})

export function useToast() {
  return useContext(ToastContext)
}
