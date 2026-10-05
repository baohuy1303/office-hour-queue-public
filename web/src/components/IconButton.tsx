import type { ButtonHTMLAttributes } from 'react'

// design.md icon button: 36x36, hairline border, lifts on hover. Always give it an aria-label.
export function IconButton({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`grid size-9 place-items-center rounded-control border border-line bg-panel transition duration-150 hover:-translate-y-px hover:border-accent ${className}`}
      {...props}
    />
  )
}
