import { useState, type FormEvent } from 'react'
import { createCourse, type CreatedCourse } from '../api'
import { useSignedInEmail } from '../auth'
import { Button, LinkButton } from '../components/Button'
import { Card } from '../components/Card'
import { Notice } from '../components/Notice'
import { PageHead } from '../components/PageHead'
import { SignInForm } from '../components/SignInForm'
import { TextField } from '../components/TextField'
import { useToast } from '../components/toast'
import { useCopy } from '../useCopy'

// /new: adding a course takes a TA account, so signed-out visitors see the sign-in form first.
export function CreateCoursePage() {
  const email = useSignedInEmail()
  return email ? <CreateCourseForm /> : <SignInForm subtitle="Adding a course takes a TA account. Students never need one." />
}

function CreateCourseForm() {
  const toast = useToast()
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<CreatedCourse | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const course = await createCourse(code, name)
      setCreated(course)
      toast(`Added ${course.code} · share the join code with your students`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
      setBusy(false)
    }
  }

  if (created) return <CourseCreated course={created} />

  return (
    <div className="mx-auto max-w-[640px]">
      <PageHead
        title="Add a course."
        subtitle="You become its first TA and can add co-TAs from its TA page. Students get a join code instead."
      />
      <Card>
        <form onSubmit={submit} className="grid gap-3.5">
          <TextField
            label="Course code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            pattern="[A-Za-z0-9\-]{2,20}"
            title="2-20 letters, numbers, or dashes, like CS315"
            placeholder="CS315"
          />
          <TextField
            label="Course name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
            placeholder="Software Engineering"
          />
          <div>
            <Button type="submit" variant="primary" disabled={busy}>
              {busy ? 'Adding…' : 'Add the course'}
            </Button>
          </div>
        </form>
        {error && <Notice tone="bad">{error}</Notice>}
      </Card>
    </div>
  )
}

// What a TA sees right after adding a course: the join code and the student link to share.
function CourseCreated({ course }: { course: CreatedCourse }) {
  const copy = useCopy()
  const studentLink = `${window.location.origin}/c/${course.slug}`

  return (
    <div className="mx-auto max-w-[640px]">
      <PageHead title={`${course.code} is ready.`} subtitle={course.name} />
      <Card>
        <h2 className="font-serif text-[19px] font-bold">Join code</h2>
        <p className="mt-1 text-xs text-muted">Give this to your students. They need it to get in line.</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="font-mono text-[28px] font-bold tracking-[0.15em] select-all">{course.joinCode}</span>
          <Button size="small" onClick={() => copy(course.joinCode, 'join code')}>
            Copy
          </Button>
        </div>
      </Card>
      <Card className="mt-[18px]">
        <h2 className="font-serif text-[19px] font-bold">Student link</h2>
        <p className="mt-1 text-xs text-muted">Students open this link, then type the join code. Add co-TAs by email from the TA view.</p>
        <div className="mt-3 flex items-center gap-3">
          <code className="min-w-0 flex-1 truncate font-mono text-xs select-all">{studentLink}</code>
          <Button size="small" onClick={() => copy(studentLink, 'student link')}>
            Copy
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-[9px]">
          <LinkButton variant="primary" href={`/c/${course.slug}/ta`}>
            Open the TA view
          </LinkButton>
          <LinkButton href="/ta">Your courses</LinkButton>
        </div>
      </Card>
    </div>
  )
}
