'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { History, LayoutGrid, MessageSquareText, ScanLine, SlidersHorizontal } from 'lucide-react'

const TABS = [
  { href: '/dashboard', icon: LayoutGrid, label: 'Inventory' },
  { href: '/dashboard/recents', icon: History, label: 'Recents' },
  { href: '/dashboard/scan', icon: ScanLine, label: 'Scan', accent: true },
  { href: '/dashboard/coach', icon: MessageSquareText, label: 'Coach' },
  { href: '/dashboard/settings', icon: SlidersHorizontal, label: 'Settings' },
]

export default function BottomNav() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--bg) 84%, transparent)',
      }}
    >
      <div
        className="mx-auto max-w-[430px] border-x pt-[10px]"
        style={{
          borderColor: 'var(--border)',
          paddingBottom: 'calc(14px + env(safe-area-inset-bottom))',
        }}
      >
        <div className="px-4">
          <div
            className="flex h-[var(--dock-height)] items-center rounded-[24px] border px-2"
            style={{
              backgroundColor: 'var(--card)',
              borderColor: 'var(--border)',
              boxShadow: 'var(--dock-shadow)',
            }}
          >
        {TABS.map(({ href, icon: Icon, label, accent }) => {
          const active = isActive(href)
          const color = active ? 'var(--text-primary)' : 'var(--text-secondary)'

          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex items-center justify-center"
            >
              {accent ? (
                <div className="flex flex-col items-center justify-center gap-1">
                  <div
                    className="flex h-14 w-14 -translate-y-4 items-center justify-center rounded-[18px] border"
                    style={{
                      background: active
                        ? 'linear-gradient(180deg, #7E62FF 0%, #5B35FF 100%)'
                        : 'linear-gradient(180deg, #7658FF 0%, #5B35FF 100%)',
                      borderColor: 'rgba(255,255,255,0.24)',
                      boxShadow: '0 12px 22px rgba(91, 53, 255, 0.28)',
                    }}
                  >
                    <Icon size={24} strokeWidth={2.4} color="white" />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-[5px]">
                  <Icon
                    size={20}
                    strokeWidth={active ? 2.4 : 1.9}
                    color={color}
                  />
                  <span
                    style={{
                      fontSize: 10,
                      lineHeight: 1,
                      color,
                      fontWeight: active ? 700 : 500,
                    }}
                  >
                    {label}
                  </span>
                </div>
              )}
            </Link>
          )
        })}
          </div>
        </div>
      </div>
    </nav>
  )
}
