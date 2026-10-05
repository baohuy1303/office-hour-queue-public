import type { ReactNode } from 'react'

// design.md badge: a tiny pill. Colored badges pair a soft background with strong text.
const tones = {
  neutral: 'bg-soft text-muted',
  good: 'bg-good-soft text-good',
}

export function Badge({ tone = 'neutral', children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return (
    <span className={`rounded-full px-[7px] py-[3px] text-[10px] font-[750] tracking-[0.05em] uppercase ${tones[tone]}`}>
      {children}
    </span>
  )
}
