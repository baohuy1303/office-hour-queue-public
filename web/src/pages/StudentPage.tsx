import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { alertCalled, prepareAlerts } from '../alerts'
import {
  ApiError,
  getCourse,
  getTicket,
  joinQueue,
  leaveQueue,
  lookupCourse,
  type CourseSummary,
  type QueueStatus,
  type Ticket,
} from '../api'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { CourseHeader, CourseNotFound } from '../components/CourseHeader'
import { EmptyState } from '../components/EmptyState'
import { Notice } from '../components/Notice'
import { PageHead } from '../components/PageHead'
import { Stat } from '../components/Stat'
import { StatusWord } from '../components/StatusWord'
import { TextField } from '../components/TextField'
import { useToast } from '../components/toast'
import { loadSavedCourses, loadTicketId, saveCourse, saveTicketId } from '../storage'
import { useQueueEvents } from '../useQueueEvents'

// Loads the course and, if the student has one, their ticket. A ticket that no longer
// exists (for example, after the queue was cleared and deleted) comes back as null.
// Without a ticket, it also checks whether this device's saved join code still opens the
// course (a TA may have made a new one). codeWorks is null when there was no need to check.
async function loadState(slug: string, ticketId: string | null, savedCode: string | null) {
  const course = await getCourse(slug)
  let ticket: Ticket | null = null
  if (ticketId) {
    try {
      ticket = await getTicket(slug, ticketId)
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 404)) throw error
    }
  }
  const codeWorks = ticket ? null : savedCode ? await codeOpens(slug, savedCode) : false
  return { course, ticket, codeWorks }
}

// Whether a join code belongs to this course.
async function codeOpens(slug: string, code: string) {
  try {
    return (await lookupCourse(code)).slug === slug
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return false
    throw error
  }
}

export function StudentPage({ slug }: { slug: string }) {
  const toast = useToast()
  const [ticketId, setTicketId] = useState(() => loadTicketId(slug))
  const [ticket, setTicket] = useState<Ticket | null>(null)
  // The join code this device saved for the course, and whether it still works.
  const [savedCode, setSavedCode] = useState(() => loadSavedCourses()[slug] ?? null)
  const [codeWorks, setCodeWorks] = useState<boolean | null>(null)
  const [course, setCourse] = useState<CourseSummary | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [confirmingLeave, setConfirmingLeave] = useState(false)
  // Bump this number to load again. The server's QueueChanged message does exactly that.
  const [reloadCount, setReloadCount] = useState(0)
  const connected = useQueueEvents(slug, () => setReloadCount((count) => count + 1))

  // Load on first render, whenever the ticket or saved code changes, and on every reload.
  useEffect(() => {
    let ignore = false
    loadState(slug, ticketId, savedCode)
      .then((state) => {
        if (ignore) return
        setCourse(state.course)
        setTicket(state.ticket)
        setCodeWorks(state.codeWorks)
        setNotFound(false)
        setLoadFailed(false)
        if (ticketId && !state.ticket) {
          // The ticket no longer exists. Start over.
          saveTicketId(slug, null)
          setTicketId(null)
        }
      })
      .catch((error) => {
        if (ignore) return
        if (error instanceof ApiError && error.status === 404) setNotFound(true)
        else setLoadFailed(true)
      })
    // If another load starts before this one finishes, ignore the old answer.
    return () => {
      ignore = true
    }
  }, [slug, ticketId, savedCode, reloadCount])

  // Alert the student the moment their ticket goes from Waiting to Helping.
  const previousStatus = useRef<QueueStatus | null>(null)
  const courseCode = course?.code
  useEffect(() => {
    const status = ticket?.status ?? null
    if (previousStatus.current === 'Waiting' && status === 'Helping' && courseCode) alertCalled(courseCode)
    previousStatus.current = status
  }, [ticket?.status, courseCode])

  function forgetTicket() {
    saveTicketId(slug, null)
    setTicketId(null)
    setTicket(null)
    // Check the saved join code again before showing the join form.
    setCodeWorks(null)
  }

  // The join code screen found the right code: remember it on this device.
  function handleCode(code: string) {
    saveCourse(slug, code)
    setSavedCode(code)
    setCodeWorks(true)
  }

  async function handleJoined(id: string) {
    saveTicketId(slug, id)
    setTicket(await getTicket(slug, id))
    setTicketId(id)
    toast("You're in line · keep this page open")
  }

  async function leave() {
    setConfirmingLeave(false)
    if (!ticketId) return
    try {
      await leaveQueue(slug, ticketId)
      forgetTicket()
      toast('Left the queue · join again anytime')
    } catch {
      toast("Couldn't leave the queue · try again")
    }
  }

  let content: ReactNode
  if (notFound) {
    content = <CourseNotFound />
  } else if (loadFailed && !course) {
    // Only show the error page if nothing has loaded yet. Otherwise keep showing the last
    // update; the "Reconnecting…" notice covers it, and the page refreshes once it's back.
    content = (
      <>
        <Notice tone="bad">Can't reach the queue right now. Check your connection, then try again.</Notice>
        <Button className="mt-3.5" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </>
    )
  } else if (!course || (ticketId && !ticket) || (!ticket && codeWorks === null)) {
    content = <p className="text-muted">Loading…</p>
  } else if (ticket?.status === 'Waiting') {
    content = <WaitingView ticket={ticket} onLeave={() => setConfirmingLeave(true)} />
  } else if (ticket?.status === 'Helping') {
    content = <HelpingView ticket={ticket} onLeave={() => setConfirmingLeave(true)} />
  } else if (ticket) {
    content = <FinishedView ticket={ticket} onJoinAgain={forgetTicket} />
  } else if (!codeWorks || !savedCode) {
    // A saved code that stopped working means a TA made a new one.
    content = <CodeGate slug={slug} changed={savedCode !== null} onCode={handleCode} />
  } else if (!course.isOpen) {
    content = <EmptyState title="Queue closed." hint="It opens when office hours start. Check back then." />
  } else {
    content = (
      <JoinForm slug={slug} course={course} joinCode={savedCode} onJoined={handleJoined} onCodeRejected={() => setCodeWorks(false)} />
    )
  }

  return (
    <div className="mx-auto max-w-[640px]">
      {!connected && (
        <Notice tone="warn" className="mb-5">
          Reconnecting… Your place in line is safe. This page catches up as soon as it's back.
        </Notice>
      )}
      {course && !notFound && <CourseHeader code={course.code} name={course.name} />}
      {content}
      <ConfirmDialog
        open={confirmingLeave}
        title="Leave the queue?"
        confirmLabel="Leave the queue"
        onConfirm={leave}
        onCancel={() => setConfirmingLeave(false)}
      >
        You'll lose your place in line.
      </ConfirmDialog>
    </div>
  )
}

// Asks for the course's join code before showing its queue. A code that works is saved on this
// device, so students only type it once (until a TA makes a new one).
function CodeGate({ slug, changed, onCode }: { slug: string; changed: boolean; onCode: (code: string) => void }) {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const cleaned = code.trim().toUpperCase()
      if (await codeOpens(slug, cleaned)) {
        onCode(cleaned)
        return
      }
      setError("That join code isn't right. Ask a TA for it.")
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    }
    setBusy(false)
  }

  return (
    <>
      <PageHead title="Enter the join code." subtitle="Your TA has it. You only need to type it once on this device." />
      <Card>
        {changed && (
          <Notice tone="warn" className="mb-3.5">
            The join code changed. Ask a TA for the new one.
          </Notice>
        )}
        <form onSubmit={submit} className="grid gap-3.5">
          <TextField
            label="Join code (from your TA)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            maxLength={6}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="K7Q2PX"
          />
          <div>
            <Button type="submit" variant="primary" disabled={busy}>
              {busy ? 'Checking…' : 'Open the queue'}
            </Button>
          </div>
        </form>
        {error && <Notice tone="bad">{error}</Notice>}
      </Card>
    </>
  )
}

type JoinFormProps = {
  slug: string
  course: CourseSummary
  joinCode: string
  onJoined: (id: string) => Promise<void>
  onCodeRejected: () => void
}

function JoinForm({ slug, course, joinCode, onJoined, onCodeRejected }: JoinFormProps) {
  const [name, setName] = useState('')
  const [topic, setTopic] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // Must happen during this click: browsers only allow notifications and sound after one.
    prepareAlerts()
    setBusy(true)
    setError(null)
    try {
      // The server still checks the code. The code screen only asked for it first.
      const { id } = await joinQueue(slug, name, topic, joinCode)
      await onJoined(id)
    } catch (e) {
      // 403: a TA made a new join code since this device saved it. Ask for the new one.
      if (e instanceof ApiError && e.status === 403) {
        onCodeRejected()
        return
      }
      setError(e instanceof Error ? e.message : 'Something went wrong.')
      setBusy(false)
    }
  }

  return (
    <>
      <PageHead title="Join the queue." subtitle="Add your name and what you need help with. A TA will call you in order." />
      <div className="mb-5 flex flex-wrap gap-2.5">
        <Stat value={course.waitingCount} label="waiting now" />
        <Stat value={`~${course.estimatedWaitMinutes} min`} label="estimated wait" />
      </div>
      <Card>
        <form onSubmit={submit} className="grid gap-3.5">
          <TextField
            label="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={50}
            autoComplete="name"
          />
          <TextField
            label="What do you need help with?"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
            maxLength={100}
            placeholder="HW3 recursion"
          />
          <div>
            <Button type="submit" variant="primary" disabled={busy}>
              {busy ? 'Joining…' : 'Join the queue'}
            </Button>
            <p className="mt-2 text-xs text-muted">
              Your browser will ask to show notifications, so we can alert you when it's your turn.
            </p>
          </div>
        </form>
        {error && <Notice tone="bad">{error}</Notice>}
      </Card>
    </>
  )
}

function WaitingView({ ticket, onLeave }: { ticket: Ticket; onLeave: () => void }) {
  const position = ticket.position ?? 1
  return (
    <>
      <PageHead title="You're in line." subtitle="Keep this page open. It updates live and alerts you when it's your turn." />
      <div className="mb-5 flex flex-wrap gap-2.5">
        <Stat value={`#${position}`} label={position === 1 ? "you're next" : 'your place'} />
        <Stat value={`~${ticket.estimatedWaitMinutes ?? 0} min`} label="estimated wait" />
      </div>
      <Card>
        <TicketDetails ticket={ticket} />
        <div className="mt-[13px]">
          <Button onClick={onLeave}>Leave the queue</Button>
        </div>
      </Card>
    </>
  )
}

function HelpingView({ ticket, onLeave }: { ticket: Ticket; onLeave: () => void }) {
  return (
    <>
      <PageHead title="You're up." subtitle="A TA is ready for you now." />
      <Card>
        <TicketDetails ticket={ticket} />
        <Notice tone="info">Head over to the TA. If you don't need help anymore, leave the queue so the next student can go.</Notice>
        <div className="mt-[13px]">
          <Button onClick={onLeave}>Leave the queue</Button>
        </div>
      </Card>
    </>
  )
}

function FinishedView({ ticket, onJoinAgain }: { ticket: Ticket; onJoinAgain: () => void }) {
  const done = ticket.status === 'Done'
  return (
    <EmptyState
      title={done ? 'All set.' : "You're out of the queue."}
      hint={done ? 'Hope that helped. Join again if something else comes up.' : 'A TA removed your spot, or the queue was cleared.'}
    >
      <Button variant="primary" onClick={onJoinAgain}>
        Join again
      </Button>
    </EmptyState>
  )
}

function TicketDetails({ ticket }: { ticket: Ticket }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="font-[690]">{ticket.name}</p>
        <p className="text-muted">{ticket.topic}</p>
      </div>
      <StatusWord status={ticket.status} />
    </div>
  )
}
