import { useEffect, useState, type FormEvent } from 'react'
import {
  ApiError,
  addCourseTa,
  callNext,
  clearQueue,
  closeQueue,
  deleteCourse,
  getCourse,
  getCourseTas,
  getTaQueue,
  markDone,
  newJoinCode,
  openQueue,
  removeCourseTa,
  removeEntry,
  type CourseSummary,
  type CourseTa,
  type TaEntry,
  type TaQueue,
} from '../api'
import { signOut, useSignedInEmail } from '../auth'
import { Avatar } from '../components/Avatar'
import { Badge } from '../components/Badge'
import { Button, LinkButton } from '../components/Button'
import { Card } from '../components/Card'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { CourseHeader, CourseNotFound } from '../components/CourseHeader'
import { EmptyState } from '../components/EmptyState'
import { Notice } from '../components/Notice'
import { PageHead } from '../components/PageHead'
import { SignInForm } from '../components/SignInForm'
import { Stat } from '../components/Stat'
import { useToast } from '../components/toast'
import { useCopy } from '../useCopy'
import { useQueueEvents } from '../useQueueEvents'

// /c/{slug}/ta: one course's TA page. Signed-out visitors see the sign-in form first.
export function TaPage({ slug }: { slug: string }) {
  const email = useSignedInEmail()
  if (!email) {
    // The slug is the course code in lowercase, so this reads "CS315".
    return <SignInForm subtitle={`Sign in to run ${slug.toUpperCase()}'s queue.`} />
  }
  // key: signing in as someone else starts the page fresh.
  return <Dashboard key={email} slug={slug} />
}

function Dashboard({ slug }: { slug: string }) {
  const toast = useToast()
  const copy = useCopy()
  const now = useNow()
  const [queue, setQueue] = useState<TaQueue | null>(null)
  const [summary, setSummary] = useState<CourseSummary | null>(null)
  const [tas, setTas] = useState<CourseTa[]>([])
  const [notFound, setNotFound] = useState(false)
  const [notYours, setNotYours] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  // Bump this number to load the page again: after an action, or when the server says the
  // course changed (a student joined or left, or another TA did something).
  const [reloadCount, setReloadCount] = useState(0)
  const connected = useQueueEvents(slug, () => setReloadCount((count) => count + 1))
  const [busy, setBusy] = useState(false)
  const [confirmingClear, setConfirmingClear] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  useEffect(() => {
    let ignore = false
    Promise.all([getTaQueue(slug), getCourse(slug), getCourseTas(slug)])
      .then(([queue, summary, tas]) => {
        if (ignore) return
        setQueue(queue)
        setSummary(summary)
        setTas(tas)
        setNotYours(false)
        setLoadFailed(false)
      })
      .catch((error) => {
        if (ignore) return
        // A 401 has already signed the TA out, which swaps this page for the sign-in form.
        if (error instanceof ApiError && error.status === 401) return
        if (error instanceof ApiError && error.status === 403) setNotYours(true)
        else if (error instanceof ApiError && error.status === 404) setNotFound(true)
        else setLoadFailed(true)
      })
    return () => {
      ignore = true
    }
  }, [slug, reloadCount])

  // Runs one TA action, shows its toast (or the error), then reloads the page.
  async function run(action: () => Promise<string>) {
    setBusy(true)
    try {
      toast(await action())
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setBusy(false)
      setReloadCount((count) => count + 1)
    }
  }

  function toggleOpen() {
    return run(async () => {
      if (queue?.isOpen) {
        await closeQueue(slug)
        return 'Queue closed · people already in line keep their spot'
      }
      await openQueue(slug)
      return 'Queue opened · students can join now'
    })
  }

  function callNextStudent() {
    return run(async () => {
      const entry = await callNext(slug)
      return `Called ${entry.name} · their page says it's their turn`
    })
  }

  function finish(entry: TaEntry) {
    return run(async () => {
      await markDone(slug, entry.id)
      return `Marked ${entry.name} done · call the next student when you're ready`
    })
  }

  function remove(entry: TaEntry) {
    return run(async () => {
      await removeEntry(slug, entry.id)
      return `Removed ${entry.name} from the queue`
    })
  }

  function clear() {
    setConfirmingClear(false)
    return run(async () => {
      const { removed } = await clearQueue(slug)
      return `Cleared ${removed} ${removed === 1 ? 'student' : 'students'} · the queue is empty`
    })
  }

  function replaceJoinCode() {
    return run(async () => {
      const { joinCode } = await newJoinCode(slug)
      return `New join code ${joinCode} · the old one no longer works`
    })
  }

  function removeTa(ta: CourseTa) {
    return run(async () => {
      await removeCourseTa(slug, ta.userId)
      return `Removed ${ta.email} · they can't open this page anymore`
    })
  }

  async function removeCourse() {
    setConfirmingDelete(false)
    setBusy(true)
    try {
      await deleteCourse(slug)
      window.location.assign('/ta')
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Something went wrong')
      setBusy(false)
    }
  }

  if (notFound) return <CourseNotFound />
  if (notYours) {
    return (
      <EmptyState title="Not your course." hint={`Only ${slug.toUpperCase()}'s TAs can open this page. Ask one of them to add your email.`}>
        <LinkButton href="/ta">Your courses</LinkButton>
      </EmptyState>
    )
  }
  // Only show the error page if nothing has loaded yet. Otherwise keep the last list.
  if (loadFailed && !queue) {
    return (
      <>
        <Notice tone="bad">Can't reach the queue right now. Check your connection, then try again.</Notice>
        <Button className="mt-3.5" onClick={() => setReloadCount((count) => count + 1)}>
          Try again
        </Button>
      </>
    )
  }
  if (!queue || !summary) return <p className="text-muted">Loading…</p>

  const helping = queue.entries.filter((entry) => entry.status === 'Helping')
  const waiting = queue.entries.filter((entry) => entry.status === 'Waiting')

  return (
    <>
      {!connected && (
        <Notice tone="warn" className="mb-5">
          Reconnecting… The list may be out of date until the connection is back.
        </Notice>
      )}
      <CourseHeader code={queue.code} name={queue.name} />
      <PageHead title="The queue." subtitle="Call students in order. Each student's page shows when it's their turn.">
        <div className="flex items-center gap-[9px]">
          <Badge tone={queue.isOpen ? 'good' : 'neutral'}>{queue.isOpen ? 'Open' : 'Closed'}</Badge>
          <Button onClick={toggleOpen} disabled={busy}>
            {queue.isOpen ? 'Close queue' : 'Open queue'}
          </Button>
        </div>
      </PageHead>

      <div className="mb-5 flex flex-wrap gap-2.5">
        <Stat value={waiting.length} label="waiting" />
        <Stat value={helping.length} label="being helped" />
        <Stat value={`~${summary.estimatedWaitMinutes} min`} label="wait for new students" />
      </div>

      <Card className="mb-[18px] flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-[750] tracking-[0.1em] text-faint uppercase">Join code for students</p>
          <p className="font-mono text-[22px] font-bold tracking-[0.15em] select-all">{queue.joinCode}</p>
        </div>
        <div className="flex flex-wrap gap-[9px]">
          <Button size="small" onClick={() => copy(queue.joinCode, 'join code')}>
            Copy
          </Button>
          <Button size="small" variant="ghost" onClick={replaceJoinCode} disabled={busy}>
            New join code
          </Button>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-[19px] font-bold">Now helping</h2>
          <Button variant="primary" onClick={callNextStudent} disabled={busy || waiting.length === 0}>
            Call next student
          </Button>
        </div>
        {helping.length === 0 ? (
          <p className="mt-1.5 text-xs text-muted">Nobody right now. Call the next student when you're free.</p>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {helping.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-center gap-3 py-3">
                <Avatar name={entry.name} />
                {/* Starts at 180px wide, so on a phone the buttons wrap below instead of squeezing the text. */}
                <div className="min-w-0 grow basis-[180px]">
                  <p className="font-[690]">{entry.name}</p>
                  <p className="text-muted">
                    {entry.topic} · called {formatAgo(minutesSince(entry.calledAt, now))}
                  </p>
                </div>
                <Button size="small" onClick={() => finish(entry)} disabled={busy}>
                  Mark done
                </Button>
                <Button size="small" variant="ghost" onClick={() => remove(entry)} disabled={busy}>
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <h2 className="mt-7 mb-3 font-serif text-[19px] font-bold">
        Waiting <span className="font-sans text-xs font-normal text-faint">· {waiting.length}</span>
      </h2>
      <WaitingTable entries={waiting} now={now} busy={busy} onRemove={remove} />

      <TasCard slug={slug} tas={tas} busy={busy} onAdded={() => setReloadCount((count) => count + 1)} onRemove={removeTa} />

      <div className="mt-6 flex flex-wrap justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <Button variant="ghost" onClick={() => setConfirmingClear(true)} disabled={busy || queue.entries.length === 0}>
            Clear queue
          </Button>
          {queue.canDelete && (
            <Button variant="ghost" onClick={() => setConfirmingDelete(true)} disabled={busy}>
              Delete course
            </Button>
          )}
        </div>
        <Button variant="ghost" onClick={signOut}>
          Sign out
        </Button>
      </div>

      <ConfirmDialog
        open={confirmingClear}
        title="Clear the queue?"
        confirmLabel="Clear queue"
        onConfirm={clear}
        onCancel={() => setConfirmingClear(false)}
      >
        This removes everyone who's waiting or being helped. Their pages will say they're out of the queue.
      </ConfirmDialog>
      <ConfirmDialog
        open={confirmingDelete}
        title={`Delete ${queue.code}?`}
        confirmLabel="Delete course"
        onConfirm={removeCourse}
        onCancel={() => setConfirmingDelete(false)}
      >
        This removes the course from the directory, along with its whole queue. It can't be undone.
      </ConfirmDialog>
    </>
  )
}

// design.md table: one card, each row a CSS grid. The "waiting" column hides on phones.
function WaitingTable({ entries, now, busy, onRemove }: { entries: TaEntry[]; now: number; busy: boolean; onRemove: (entry: TaEntry) => void }) {
  const columns = 'grid grid-cols-[28px_minmax(0,1fr)_80px_auto] items-center gap-3 px-3.5 max-[620px]:grid-cols-[28px_minmax(0,1fr)_auto]'

  if (entries.length === 0) {
    return (
      <Card>
        <EmptyState title="Nobody waiting." hint="New students show up here as they join." />
      </Card>
    )
  }

  return (
    <div className="overflow-hidden rounded-card border border-line bg-panel shadow-card">
      <div className={`${columns} border-b border-line py-[9px] text-[10px] font-[750] tracking-[0.08em] text-faint uppercase`}>
        <span>#</span>
        <span>Student</span>
        <span className="max-[620px]:hidden">Waiting</span>
        <span className="sr-only">Actions</span>
      </div>
      {entries.map((entry, index) => (
        <div key={entry.id} className={`${columns} border-b border-line py-[11px] transition-colors last:border-b-0 hover:bg-bg`}>
          <span className="text-faint">{index + 1}</span>
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={entry.name} />
            <div className="min-w-0">
              <p className="truncate font-[690]">{entry.name}</p>
              <p className="truncate text-muted">{entry.topic}</p>
            </div>
          </div>
          <span className="text-muted max-[620px]:hidden">{minutesSince(entry.joinedAt, now)} min</span>
          <Button size="small" variant="ghost" onClick={() => onRemove(entry)} disabled={busy}>
            Remove
          </Button>
        </div>
      ))}
    </div>
  )
}

type TasCardProps = {
  slug: string
  tas: CourseTa[]
  busy: boolean
  onAdded: () => void
  onRemove: (ta: CourseTa) => void
}

// The course's TAs, plus a form to add a co-TA by email. Nobody can remove themselves.
function TasCard({ slug, tas, busy, onAdded, onRemove }: TasCardProps) {
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAdding(true)
    setError(null)
    try {
      const ta = await addCourseTa(slug, email.trim())
      setEmail('')
      toast(`Added ${ta.email} · they can run this queue now`)
      onAdded()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setAdding(false)
    }
  }

  return (
    <Card className="mt-[18px]">
      <h2 className="font-serif text-[19px] font-bold">
        TAs <span className="font-sans text-xs font-normal text-faint">· {tas.length}</span>
      </h2>
      <ul className="mt-2 divide-y divide-line">
        {tas.map((ta) => (
          <li key={ta.userId} className="flex min-h-[46px] items-center justify-between gap-3 py-2">
            <span className="min-w-0 truncate">{ta.email}</span>
            {ta.isYou ? (
              <Badge>You</Badge>
            ) : (
              <Button size="small" variant="ghost" onClick={() => onRemove(ta)} disabled={busy}>
                Remove
              </Button>
            )}
          </li>
        ))}
      </ul>
      <form onSubmit={submit} className="mt-3 flex flex-wrap gap-[9px]">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          maxLength={256}
          placeholder="co-ta@school.edu"
          aria-label="Email of the TA to add"
          className="min-w-0 grow basis-[220px] rounded-tile border border-line bg-bg px-3 py-[9px] outline-none transition duration-150 focus:border-accent focus:ring-3 focus:ring-accent/15"
        />
        <Button type="submit" disabled={adding}>
          {adding ? 'Adding…' : 'Add TA'}
        </Button>
      </form>
      <p className="mt-2 text-xs text-muted">They need a TA account first. Anyone can create one from TA sign-in.</p>
      {error && <Notice tone="bad">{error}</Notice>}
    </Card>
  )
}

// Re-renders every 30 seconds so "waiting 5 min" stays current.
function useNow() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(timer)
  }, [])
  return now
}

function minutesSince(time: string | null, now: number) {
  if (!time) return 0
  return Math.max(0, Math.floor((now - new Date(time).getTime()) / 60_000))
}

function formatAgo(minutes: number) {
  return minutes === 0 ? 'just now' : `${minutes} min ago`
}
