import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'

type Variant = 'default' | 'primary' | 'ghost'
type Size = 'default' | 'small'

// design.md buttons: default (panel), primary (solid ink, one per view), ghost (quiet).
// "not-disabled:" keeps the hover effect off disabled buttons.
const variants: Record<Variant, string> = {
  default: 'border-line bg-panel hover:not-disabled:border-accent',
  primary: 'border-ink bg-ink text-bg hover:not-disabled:opacity-90',
  ghost: 'border-transparent bg-transparent text-muted hover:not-disabled:text-ink',
}

const sizes: Record<Size, string> = {
  default: 'px-3.5 py-2.5',
  small: 'px-2.5 py-[7px] text-xs',
}

function buttonClasses(variant: Variant, size: Size, extra: string) {
  return `inline-flex items-center gap-[7px] rounded-control border font-[680] transition duration-150 active:translate-y-px active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-45 ${variants[variant]} ${sizes[size]} ${extra}`
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }

export function Button({ variant = 'default', size = 'default', type = 'button', className = '', ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...props} />
}

type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant; size?: Size }

// A link that looks like a button, for actions that open another page.
export function LinkButton({ variant = 'default', size = 'default', className = '', ...props }: LinkButtonProps) {
  return <a className={buttonClasses(variant, size, className)} {...props} />
}
