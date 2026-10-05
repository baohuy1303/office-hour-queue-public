// design.md avatar: initials in the accent color on a soft accent circle.
export function Avatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-extrabold text-accent">
      {initials}
    </span>
  )
}
