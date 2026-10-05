import type { ReactNode } from 'react'

// design.md notices: a soft colored block. "warn" for soft warnings, "bad" for things
// that stop an action, "info" for neutral news.
const tones = {
  warn: 'bg-warn-soft text-warn',
  bad: 'bg-bad-soft text-bad',
  info: 'bg-info-soft text-info',
}

type NoticeProps = {
  tone?: keyof typeof tones
  className?: string
  children: ReactNode
}

export function Notice({ tone = 'warn', className = 'mt-3.5', children }: NoticeProps) {
  return (
    <div role={tone === 'bad' ? 'alert' : 'status'} className={`rounded-control px-[13px] py-[11px] ${tones[tone]} ${className}`}>
      {children}
    </div>
  )
}
