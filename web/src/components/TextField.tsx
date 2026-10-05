import type { InputHTMLAttributes } from 'react'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string }

// A labeled input. Inputs that sit on a card use the page color, as design.md says.
export function TextField({ label, className = '', ...props }: TextFieldProps) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[10px] font-[750] tracking-[0.1em] text-faint uppercase">{label}</span>
      <input
        className="w-full rounded-tile border border-line bg-bg px-3 py-[11px] outline-none transition duration-150 focus:border-accent focus:ring-3 focus:ring-accent/15"
        {...props}
      />
    </label>
  )
}
