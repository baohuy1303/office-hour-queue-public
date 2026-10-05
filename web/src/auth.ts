import { useSyncExternalStore } from 'react'

// The signed-in TA: their email and the tokens from the API's login endpoint. It's kept in
// localStorage, so a TA stays signed in across tabs and visits until they sign out.
export type Session = {
  email: string
  accessToken: string
  refreshToken: string
  // When the access token runs out, in milliseconds like Date.now().
  expiresAt: number
}

const SESSION_KEY = 'ohq-session'

let session = loadSession()
const listeners = new Set<() => void>()

function loadSession(): Session | null {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null')
  } catch {
    return null
  }
}

function notify() {
  listeners.forEach((listener) => listener())
}

export function getSession() {
  return session
}

// Saves a new session (or null to sign out), then tells components to re-render.
export function saveSession(next: Session | null) {
  session = next
  try {
    if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next))
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    // Storage blocked: the TA stays signed in until the page closes.
  }
  notify()
}

export function signOut() {
  saveSession(null)
}

// Signing in or out in another tab updates this tab too.
window.addEventListener('storage', (event) => {
  if (event.key !== SESSION_KEY) return
  session = loadSession()
  notify()
})

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

// The signed-in TA's email, or null. A component that calls this re-renders whenever someone
// signs in or out. useSyncExternalStore is React's hook for reading state that lives outside React.
export function useSignedInEmail() {
  return useSyncExternalStore(subscribe, () => session?.email ?? null)
}
