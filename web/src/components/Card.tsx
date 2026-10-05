import type { HTMLAttributes } from 'react'

export function Card({ className = '', ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={`rounded-card border border-line bg-panel p-[18px] shadow-card ${className}`} {...props} />
}
