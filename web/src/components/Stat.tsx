// design.md stat tile: a serif number over a muted label.
export function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-tile border border-line bg-panel px-[13px] py-2.5 text-xs text-muted">
      <strong className="block font-serif text-[21px] font-bold text-ink">{value}</strong>
      {label}
    </div>
  )
}
