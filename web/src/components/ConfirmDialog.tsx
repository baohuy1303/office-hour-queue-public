import { useEffect, useRef, type ReactNode } from 'react'
import { Button } from './Button'
import { Icon } from './Icon'
import { IconButton } from './IconButton'

type ConfirmDialogProps = {
  open: boolean
  title: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  children: ReactNode
}

// design.md dialog: the browser's native <dialog> element, opened with showModal().
export function ConfirmDialog({ open, title, confirmLabel, onConfirm, onCancel, children }: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onCancel}
      className="m-auto w-[min(620px,calc(100%-28px))] rounded-dialog border border-line bg-panel text-ink shadow-[0_28px_80px_rgba(0,0,0,0.3)] backdrop:bg-[rgba(20,18,14,0.45)] backdrop:backdrop-blur-[2px]"
    >
      <div className="flex items-center border-b border-line px-[18px] py-[17px]">
        <h2 className="font-serif text-[23px] font-bold">{title}</h2>
        <IconButton onClick={onCancel} aria-label="Close" className="ml-auto">
          <Icon name="x" />
        </IconButton>
      </div>
      <div className="p-[18px]">
        <div className="text-muted">{children}</div>
        <div className="mt-[13px] flex flex-wrap gap-[9px]">
          <Button variant="primary" onClick={onConfirm}>
            {confirmLabel}
          </Button>
          <Button onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    </dialog>
  )
}
