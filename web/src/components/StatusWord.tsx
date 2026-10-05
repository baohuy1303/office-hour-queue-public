import type { QueueStatus } from '../api'

// design.md status text: an uppercase colored word with no background.
const tones: Record<QueueStatus, string> = {
  Waiting: 'text-accent',
  Helping: 'text-info',
  Done: 'text-good',
  Removed: 'text-muted',
}

export function StatusWord({ status }: { status: QueueStatus }) {
  return <span className={`text-[11px] font-[750] tracking-[0.05em] uppercase ${tones[status]}`}>{status}</span>
}
