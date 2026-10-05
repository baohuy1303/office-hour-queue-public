import type { CourseListItem } from '../api'
import { Badge } from './Badge'

// A labeled list of courses: design.md's table, one card with each row a CSS grid. The
// "waiting" column hides on phones. hrefFor says where each row links to.
export function CourseList({ label, courses, hrefFor }: { label: string; courses: CourseListItem[]; hrefFor: (course: CourseListItem) => string }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 px-1 text-[10px] font-[750] tracking-[0.11em] text-faint uppercase">
        {label} · {courses.length}
      </h2>
      <div className="overflow-hidden rounded-card border border-line bg-panel shadow-card">
        {courses.map((course) => (
          <a
            key={course.slug}
            href={hrefFor(course)}
            className="grid grid-cols-[minmax(0,1fr)_90px_auto] items-center gap-3 border-b border-line px-3.5 py-3 transition-colors last:border-b-0 hover:bg-bg max-[620px]:grid-cols-[minmax(0,1fr)_auto]"
          >
            <div className="min-w-0">
              <p className="truncate font-[690]">{course.code}</p>
              <p className="truncate text-muted">{course.name}</p>
            </div>
            <span className="text-muted max-[620px]:hidden">{course.waitingCount} waiting</span>
            <Badge tone={course.isOpen ? 'good' : 'neutral'}>{course.isOpen ? 'Open' : 'Closed'}</Badge>
          </a>
        ))}
      </div>
    </section>
  )
}
