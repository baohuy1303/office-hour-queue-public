import { useState } from 'react'
import { Icon } from './Icon'
import { IconButton } from './IconButton'

// Must match the key read by the script in index.html.
const THEME_KEY = 'ohq-theme'

export function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.dataset.theme === 'dark')

  function toggle() {
    const next = dark ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem(THEME_KEY, next)
    } catch {
      // Storage can be blocked (private mode). The theme still switches for this visit.
    }
    setDark(!dark)
  }

  return (
    <IconButton onClick={toggle} aria-label={dark ? 'Use light theme' : 'Use dark theme'}>
      <Icon name={dark ? 'sun' : 'moon'} />
    </IconButton>
  )
}
