import type { ReactNode } from 'react'

// design.md page head: a short serif title ending in a period, a muted subtitle,
// and optional actions on the right.
export function PageHead({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-5">
      <div>
        <h1 className="font-serif text-[clamp(29px,4vw,42px)] leading-[1.05] font-bold">{title}</h1>
        {subtitle && <p className="mt-[7px] max-w-[65ch] text-muted">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}
