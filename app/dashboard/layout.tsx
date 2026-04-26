'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { CustomerModeProvider } from '@/context/CustomerModeContext'
import BottomNav from '@/components/BottomNav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-(--bg)">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--purple)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  if (!user) return null

  return (
    <CustomerModeProvider>
      <div
        className="max-w-[430px] mx-auto min-h-dvh bg-(--bg) border-x"
        style={{
          borderColor: 'var(--border)',
          paddingBottom: 'calc(var(--dock-height) + 42px + env(safe-area-inset-bottom))',
        }}
      >
        {children}
      </div>
      <BottomNav />
    </CustomerModeProvider>
  )
}
