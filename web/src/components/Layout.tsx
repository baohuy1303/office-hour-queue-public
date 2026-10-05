import type { ReactNode } from 'react'
import { useSignedInEmail } from '../auth'
import { ThemeToggle } from './ThemeToggle'

// The app shell from design.md: a top bar with the brand, the TA link, and the theme toggle,
// then the page.
export function Layout({ children }: { children: ReactNode }) {
  const email = useSignedInEmail()
  return (
    <>
      <header className="sticky top-0 z-10 flex h-[60px] items-center justify-between border-b border-line bg-panel/92 pr-3.5 pl-2.5">
        <a href="/" className="group flex items-center gap-[9px] pl-1.5">
          <BrandMark />
          <span className="font-serif text-[23px] font-bold">Office hours</span>
        </a>
        <div className="flex items-center gap-1">
          <a href="/ta" className="rounded-control px-2.5 py-2 text-[13px] font-[650] whitespace-nowrap text-muted transition-colors hover:text-ink">
            {email ? 'Your courses' : 'TA sign-in'}
          </a>
          <ThemeToggle />
        </div>
      </header>
      <main className="px-[clamp(20px,5vw,72px)] pt-[30px] pb-16">
        <div className="mx-auto max-w-[1080px] animate-view-in">{children}</div>
      </main>
    </>
  )
}

// Three dots getting smaller: people waiting in line.
function BrandMark() {
  return (
    <svg
      viewBox="0 0 40 40"
      aria-hidden="true"
      className="size-[34px] fill-accent transition-transform duration-200 group-hover:-translate-y-px group-hover:-rotate-4"
    >
      <circle cx="9" cy="20" r="6" />
      <circle cx="22" cy="20" r="5" />
      <circle cx="33" cy="20" r="4" />
    </svg>
  )
}
