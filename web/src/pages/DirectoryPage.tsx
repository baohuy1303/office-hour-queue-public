import { useEffect, useState, type FormEvent } from 'react'
import { getCourses, lookupCourse, type CourseListItem } from '../api'
import { Button, LinkButton } from '../components/Button'
import { Card } from '../components/Card'
import { CourseList } from '../components/CourseList'
import { EmptyState } from '../components/EmptyState'
import { Notice } from '../components/Notice'
import { PageHead } from '../components/PageHead'
import { loadSavedCourses, saveCourse } from '../storage'
import { useQueueEvents } from '../useQueueEvents'

export function DirectoryPage() {
  const [courses, setCourses] = useState<CourseListItem[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [search, setSearch] = useState('')
  // Bump this number to load again. The server's QueueChanged message does exactly that.
  const [reloadCount, setReloadCount] = useState(0)
  const connected = useQueueEvents(null, () => setReloadCount((count) => count + 1))

  useEffect(() => {
    let ignore = false
    getCourses()
      .then((result) => {
        if (ignore) return
        setCourses(result)
        setLoadFailed(false)
      })
      .catch(() => {
        if (!ignore) setLoadFailed(true)
      })
    return () => {
      ignore = true
    }
  }, [reloadCount])

  let content
  if (loadFailed && !courses) {
    content = (
      <>
        <Notice tone="bad">Can't reach the directory right now. Check your connection, then try again.</Notice>
        <Button className="mt-3.5" onClick={() => setReloadCount((count) => count + 1)}>
          Try again
        </Button>
      </>
    )
  } else if (!courses) {
    content = <p className="text-muted">Loading…</p>
  } else if (courses.length === 0) {
    content = <EmptyState title="No courses yet." hint="TAs can add the first one with + Add a course." />
  } else {
    content = <CourseGroups courses={courses} search={search} onSearch={setSearch} />
  }

  return (
    <>
      {!connected && (
        <Notice tone="warn" className="mb-5">
          Reconnecting… The list may be out of date until the connection is back.
        </Notice>
      )}
      <PageHead title="Every course." subtitle="Pick your course to see if office hours are open. To get in line, you'll need the join code from your TA.">
        <LinkButton href="/new">+ Add a course</LinkButton>
      </PageHead>
      {courses && courses.length > 0 && <JoinCodeCard />}
      {content}
    </>
  )
}

// "Have a join code?": the code alone finds the course, then opens its queue.
function JoinCodeCard() {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const cleaned = code.trim().toUpperCase()
      const course = await lookupCourse(cleaned)
      // Save the code, so the course page skips the join code screen.
      saveCourse(course.slug, cleaned)
      window.location.assign(`/c/${course.slug}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
      setBusy(false)
    }
  }

  return (
    <Card className="mb-6">
      <h2 className="font-serif text-[19px] font-bold">Have a join code?</h2>
      <p className="mt-1 text-xs text-muted">Type the code from your TA to go straight to your course's queue.</p>
      <form onSubmit={submit} className="mt-3 flex flex-wrap gap-[9px]">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          maxLength={6}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="K7Q2PX"
          aria-label="Join code"
          className="min-w-0 grow basis-[160px] rounded-tile border border-line bg-bg px-3 py-[9px] outline-none transition duration-150 focus:border-accent focus:ring-3 focus:ring-accent/15"
        />
        <Button type="submit" variant="primary" disabled={busy}>
          {busy ? 'Finding…' : 'Go to the queue'}
        </Button>
      </form>
      {error && <Notice tone="bad">{error}</Notice>}
    </Card>
  )
}

// The search box, then the courses joined on this device and every other course.
function CourseGroups({ courses, search, onSearch }: { courses: CourseListItem[]; search: string; onSearch: (value: string) => void }) {
  const saved = loadSavedCourses()
  const query = search.trim().toLowerCase()
  const matches = courses.filter((course) => `${course.code} ${course.name}`.toLowerCase().includes(query))
  const mine = matches.filter((course) => course.slug in saved)
  const others = matches.filter((course) => !(course.slug in saved))

  return (
    <>
      <input
        type="search"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search by code or name"
        aria-label="Search courses"
        className="mb-5 w-full rounded-tile border border-line bg-panel px-3 py-[11px] outline-none transition duration-150 focus:border-accent focus:ring-3 focus:ring-accent/15"
      />
      {matches.length === 0 && <p className="text-muted">No courses match “{search.trim()}”.</p>}
      {mine.length > 0 && <CourseList label="Joined on this device" courses={mine} hrefFor={studentPage} />}
      {others.length > 0 && (
        <CourseList label={mine.length > 0 ? 'All other courses' : 'All courses'} courses={others} hrefFor={studentPage} />
      )}
    </>
  )
}

function studentPage(course: CourseListItem) {
  return `/c/${course.slug}`
}
