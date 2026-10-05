import type { ReactNode } from 'react'

// design.md empty state: a small line drawing in the accent, a serif line, and a muted hint.
export function EmptyState({ title, hint, children }: { title: string; hint: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center">
      <MugDrawing />
      <p className="mt-4 font-serif text-[21px] font-bold">{title}</p>
      <p className="mt-1 max-w-[42ch] text-muted">{hint}</p>
      {children && <div className="mt-5">{children}</div>}
    </div>
  )
}

function MugDrawing() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-16 text-accent"
    >
      <path d="M14 28h30v12a12 12 0 0 1-12 12h-6a12 12 0 0 1-12-12z" />
      <path d="M44 32h3a6 6 0 0 1 0 12h-4" />
      <path d="M22 13c-2 3 2 5 0 8M30 11c-2 3 2 5 0 8M38 13c-2 3 2 5 0 8" />
      <path d="M8 57h44" />
    </svg>
  )
}
