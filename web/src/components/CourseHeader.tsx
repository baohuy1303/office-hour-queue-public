import { useEffect } from 'react'
import { EmptyState } from './EmptyState'
import { LinkButton } from './Button'

// Above a course page's title: a way back to the directory, and which course this is.
// It also names the browser tab after the course, like "CS315 office hours".
export function CourseHeader({ code, name }: { code: string; name: string }) {
  useEffect(() => {
    document.title = `${code} office hours`
  }, [code])

  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      <a href="/" className="text-muted transition-colors hover:text-ink">
        ← Every course
      </a>
      <span className="text-faint">·</span>
      <span className="font-[690]">{code}</span>
      <span className="text-muted">{name}</span>
    </div>
  )
}

// Shown when a course link points at a course that doesn't exist (or was deleted).
export function CourseNotFound() {
  return (
    <EmptyState title="Course not found." hint="Check the link, or find the course in the directory.">
      <LinkButton href="/">Every course</LinkButton>
    </EmptyState>
  )
}
