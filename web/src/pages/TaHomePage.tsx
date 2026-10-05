import { useEffect, useState } from 'react'
import { getMyCourses, type MyCourses } from '../api'
import { signOut, useSignedInEmail } from '../auth'
import { Button, LinkButton } from '../components/Button'
import { CourseList } from '../components/CourseList'
import { EmptyState } from '../components/EmptyState'
import { Notice } from '../components/Notice'
import { PageHead } from '../components/PageHead'
import { SignInForm } from '../components/SignInForm'
import { useQueueEvents } from '../useQueueEvents'

// /ta: the TA's home. Signed out, it's the sign-in form; signed in, the courses they run.
export function TaHomePage() {
  const email = useSignedInEmail()
  // key: signing in as someone else starts this page fresh.
  return email ? <YourCourses key={email} email={email} /> : <SignInForm />
}

function YourCourses({ email }: { email: string }) {
  const [result, setResult] = useState<MyCourses | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  // Bump this number to load again. The directory's QueueChanged messages do that, so the
  // waiting counts stay live.
  const [reloadCount, setReloadCount] = useState(0)
  const connected = useQueueEvents(null, () => setReloadCount((count) => count + 1))

  useEffect(() => {
    let ignore = false
    getMyCourses()
      .then((loaded) => {
        if (ignore) return
        setResult(loaded)
        setLoadFailed(false)
      })
      .catch(() => {
        if (!ignore) setLoadFailed(true)
      })
    return () => {
      ignore = true
    }
  }, [reloadCount])

  const courses = result?.courses
  let content
  if (loadFailed && !courses) {
    content = (
      <>
        <Notice tone="bad">Can't reach your courses right now. Check your connection, then try again.</Notice>
        <Button className="mt-3.5" onClick={() => setReloadCount((count) => count + 1)}>
          Try again
        </Button>
      </>
    )
  } else if (!courses) {
    content = <p className="text-muted">Loading…</p>
  } else if (courses.length === 0) {
    content = <EmptyState title="No courses yet." hint="Add one, or ask a course's TA to add your email." />
  } else {
    content = (
      <CourseList
        label={result?.isAdmin ? 'Every course (admin)' : 'Courses you TA'}
        courses={courses}
        hrefFor={(course) => `/c/${course.slug}/ta`}
      />
    )
  }

  return (
    <>
      {!connected && (
        <Notice tone="warn" className="mb-5">
          Reconnecting… The list may be out of date until the connection is back.
        </Notice>
      )}
      <PageHead title="Your courses." subtitle={`Signed in as ${email}.`}>
        <LinkButton href="/new">+ Add a course</LinkButton>
      </PageHead>
      {content}
      <Button variant="ghost" onClick={signOut}>
        Sign out
      </Button>
    </>
  )
}
