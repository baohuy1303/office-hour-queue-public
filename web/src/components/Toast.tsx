import { useCallback, useRef, useState, type ReactNode } from 'react'
import { ToastContext } from './toast'

// design.md toast: one ink pill at the bottom center that hides after about 1.8 seconds.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('')
  const [visible, setVisible] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  const show = useCallback((text: string) => {
    setMessage(text)
    setVisible(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setVisible(false), 1800)
  }, [])

  return (
    <ToastContext value={show}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed bottom-6 left-1/2 z-20 -translate-x-1/2 rounded-full bg-ink px-[15px] py-[9px] text-bg transition duration-200 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
      >
        {message}
      </div>
    </ToastContext>
  )
}
