import { useState, type FormEvent } from 'react'
import { createAccount, signIn } from '../api'
import { Button } from './Button'
import { Card } from './Card'
import { Notice } from './Notice'
import { PageHead } from './PageHead'
import { TextField } from './TextField'
import { useToast } from './toast'

// TA sign-in, with a switch to create an account instead. Pages that need a signed-in TA show
// this until someone signs in. Signing in re-renders the page, which then shows itself instead.
export function SignInForm({ subtitle = "For TAs. Students don't need an account, just their course's join code." }: { subtitle?: string }) {
  const toast = useToast()
  const [creating, setCreating] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordAgain, setPasswordAgain] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (creating && password !== passwordAgain) {
      setError("The two passwords don't match.")
      return
    }
    setBusy(true)
    setError(null)
    try {
      if (creating) {
        await createAccount(email.trim(), password)
        toast(`Account created · you're signed in as ${email.trim()}`)
      } else {
        await signIn(email.trim(), password)
        toast(`Signed in as ${email.trim()}`)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
      setBusy(false)
    }
  }

  function switchMode() {
    setCreating(!creating)
    setError(null)
  }

  return (
    <div className="mx-auto max-w-[640px]">
      <PageHead title={creating ? 'Create an account.' : 'TA sign-in.'} subtitle={subtitle} />
      <Card>
        <form onSubmit={submit} className="grid gap-3.5">
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            maxLength={256}
            autoComplete="email"
          />
          <TextField
            label={creating ? 'Password (at least 8 characters)' : 'Password'}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={creating ? 8 : undefined}
            autoComplete={creating ? 'new-password' : 'current-password'}
          />
          {creating && (
            <TextField
              label="Password again"
              type="password"
              value={passwordAgain}
              onChange={(e) => setPasswordAgain(e.target.value)}
              required
              autoComplete="new-password"
            />
          )}
          <div className="flex flex-wrap items-center gap-[9px]">
            <Button type="submit" variant="primary" disabled={busy}>
              {creating ? (busy ? 'Creating…' : 'Create the account') : busy ? 'Signing in…' : 'Sign in'}
            </Button>
            <Button variant="ghost" onClick={switchMode} disabled={busy}>
              {creating ? 'I already have an account' : 'Create an account'}
            </Button>
          </div>
        </form>
        {error && <Notice tone="bad">{error}</Notice>}
      </Card>
    </div>
  )
}
