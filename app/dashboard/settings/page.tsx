'use client'

import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { ChevronRight } from 'lucide-react'
import { getFirebaseAuth } from '@/lib/firebase'
import { useTheme } from '@/context/ThemeContext'
import PageHeader from '@/components/PageHeader'
import SegmentedControl from '@/components/SegmentedControl'

type Radius = '25' | '50' | '100'
type Theme = 'auto' | 'light' | 'dark'

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
      {children}
    </p>
  )
}

function Divider() {
  return <div className="h-px mx-4" style={{ backgroundColor: 'var(--border)' }} />
}

export default function SettingsPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  async function handleSignOut() {
    await signOut(getFirebaseAuth())
    document.cookie = '__session=; path=/; max-age=0'
    router.replace('/login')
  }

  return (
    <div>
      <PageHeader title="Settings" />

      <div className="px-4 pt-5 space-y-6">
        <div>
          <SectionLabel>Search Radius</SectionLabel>
          <SegmentedControl<Radius>
            options={[{ label: '25 mi', value: '25' }, { label: '50 mi', value: '50' }, { label: '100 mi', value: '100' }]}
            value="25"
            onChange={() => {}}
          />
        </div>

        <div>
          <SectionLabel>Theme</SectionLabel>
          <SegmentedControl<Theme>
            options={[{ label: 'Auto', value: 'auto' }, { label: 'Light', value: 'light' }, { label: 'Dark', value: 'dark' }]}
            value={theme}
            onChange={setTheme}
          />
        </div>

        <div>
          <SectionLabel>Dealership</SectionLabel>
          <div className="bg-(--card) rounded-[var(--radius-card)] overflow-hidden" style={{ boxShadow: 'var(--card-shadow)' }}>
            <button className="flex items-center justify-between w-full px-4 h-[52px] active:opacity-70">
              <span className="text-[17px] text-(--text-primary)">Manage Team</span>
              <ChevronRight size={18} color="var(--text-secondary)" />
            </button>
            <Divider />
            <button className="flex items-center justify-between w-full px-4 h-[52px] active:opacity-70">
              <span className="text-[17px] text-(--text-primary)">Legal & Support</span>
              <ChevronRight size={18} color="var(--text-secondary)" />
            </button>
            <Divider />
            <div className="flex items-center px-4 h-[52px]">
              <span className="text-[17px] text-(--text-secondary)">Role: admin</span>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-(--card) rounded-[var(--radius-card)] overflow-hidden" style={{ boxShadow: 'var(--card-shadow)' }}>
            <button className="flex items-center w-full px-4 h-[52px] active:opacity-70">
              <span className="text-[17px]" style={{ color: '#FF3B30' }}>Delete Account</span>
            </button>
            <Divider />
            <button onClick={handleSignOut} className="flex items-center w-full px-4 h-[52px] active:opacity-70">
              <span className="text-[17px]" style={{ color: '#FF3B30' }}>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
