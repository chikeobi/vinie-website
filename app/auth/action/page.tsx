'use client'

import { useEffect, useState, FormEvent, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/firebase'

function AuthActionContent() {
  const params = useSearchParams()
  const router = useRouter()

  const mode = params.get('mode')
  const oobCode = params.get('oobCode') ?? ''

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [codeError, setCodeError] = useState('')

  useEffect(() => {
    if (mode !== 'resetPassword' || !oobCode) {
      setCodeError('Invalid or unsupported link.')
      setVerifying(false)
      return
    }
    verifyPasswordResetCode(getFirebaseAuth(), oobCode)
      .then((email) => {
        setEmail(email)
        setVerifying(false)
      })
      .catch(() => {
        setCodeError('This link has expired or already been used. Request a new one.')
        setVerifying(false)
      })
  }, [mode, oobCode])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await confirmPasswordReset(getFirebaseAuth(), oobCode, password)
      setSuccess(true)
    } catch {
      setError('Failed to reset password. The link may have expired — request a new one.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-(--bg) px-4">
      <div className="w-full max-w-[360px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex w-14 h-14 rounded-2xl items-center justify-center mb-4"
            style={{ backgroundColor: 'var(--purple)' }}
          >
            <span className="text-white text-2xl font-bold">V</span>
          </div>
          <h1 className="text-[20px] font-bold text-(--text-primary)">
            {success ? 'Password Updated' : 'Set New Password'}
          </h1>
          {!success && !codeError && email && (
            <p className="text-[14px] text-(--text-secondary) mt-1">{email}</p>
          )}
        </div>

        <div
          className="bg-(--card) rounded-[20px] p-6"
          style={{ boxShadow: 'var(--card-shadow)' }}
        >
          {/* Verifying */}
          {verifying && (
            <div className="flex justify-center py-6">
              <div
                className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: 'var(--purple)', borderTopColor: 'transparent' }}
              />
            </div>
          )}

          {/* Invalid code */}
          {!verifying && codeError && (
            <div className="space-y-4">
              <p className="text-[14px] text-(--text-secondary) text-center">{codeError}</p>
              <button
                onClick={() => router.push('/login')}
                className="w-full h-12 rounded-xl text-[15px] font-semibold text-white"
                style={{ backgroundColor: 'var(--purple)' }}
              >
                Back to Sign In
              </button>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="space-y-4">
              <p className="text-[14px] text-(--text-secondary) text-center">
                Your password has been updated. You can now sign in.
              </p>
              <button
                onClick={() => router.push('/login')}
                className="w-full h-12 rounded-xl text-[15px] font-semibold text-white"
                style={{ backgroundColor: 'var(--purple)' }}
              >
                Sign In
              </button>
            </div>
          )}

          {/* Reset form */}
          {!verifying && !codeError && !success && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-(--text-secondary)">
                  New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  className="w-full h-12 rounded-xl px-4 text-[15px] text-(--text-primary) bg-(--bg) border border-(--border) outline-none focus:border-(--purple) transition-colors placeholder:text-(--text-secondary)"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-(--text-secondary)">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  className="w-full h-12 rounded-xl px-4 text-[15px] text-(--text-primary) bg-(--bg) border border-(--border) outline-none focus:border-(--purple) transition-colors placeholder:text-(--text-secondary)"
                />
              </div>

              {error && (
                <p className="text-[13px] text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl text-[15px] font-semibold text-white transition-opacity disabled:opacity-60"
                style={{ backgroundColor: 'var(--purple)' }}
              >
                {loading ? '…' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AuthActionPage() {
  return (
    <Suspense>
      <AuthActionContent />
    </Suspense>
  )
}
