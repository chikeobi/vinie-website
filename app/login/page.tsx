'use client'

import { useState, FormEvent } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { getFirebaseAuth } from '@/lib/firebase'

type Mode = 'signin' | 'signup' | 'reset'

const friendlyErrors: Record<string, string> = {
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/invalid-api-key': 'Firebase API key is missing — add NEXT_PUBLIC_FIREBASE_API_KEY to .env.local and restart.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password must be at least 6 characters.',
}

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  function switchMode(next: Mode) {
    setMode(next)
    setError('')
    setSuccess('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (mode === 'signup' && password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(getFirebaseAuth(), email, password)
        document.cookie = '__session=1; path=/; SameSite=Strict; max-age=86400'
        router.push('/dashboard')
      } else if (mode === 'signup') {
        await createUserWithEmailAndPassword(getFirebaseAuth(), email, password)
        document.cookie = '__session=1; path=/; SameSite=Strict; max-age=86400'
        router.push('/dashboard')
      } else if (mode === 'reset') {
        await sendPasswordResetEmail(getFirebaseAuth(), email)
        setSuccess('Reset email sent — check your inbox.')
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      if (mode === 'signup' && code === 'auth/email-already-in-use') {
        // Guide them to reset instead of showing a dead-end error
        setSuccess('')
        setError('ALREADY_EXISTS')
      } else {
        setError(friendlyErrors[code] ?? 'Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const isReset = mode === 'reset'
  const isSignup = mode === 'signup'

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
            {isReset ? 'Reset Password' : isSignup ? 'Create Account' : 'Welcome to Vinie'}
          </h1>
          <p className="text-[14px] text-(--text-secondary) mt-1">
            {isReset
              ? "We'll send a reset link to your email"
              : isSignup
                ? 'Join your dealership team'
                : 'Sign in to your dealership account'}
          </p>
        </div>

        {/* Card */}
        <div
          className="bg-(--card) rounded-[20px] p-6"
          style={{ boxShadow: 'var(--card-shadow)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-(--text-secondary)">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@dealership.com"
                required
                autoComplete="email"
                className="w-full h-12 rounded-xl px-4 text-[15px] text-(--text-primary) bg-(--bg) border border-(--border) outline-none focus:border-(--purple) transition-colors placeholder:text-(--text-secondary)"
              />
            </div>

            {/* Password (hidden in reset mode) */}
            {!isReset && (
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-(--text-secondary)">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  className="w-full h-12 rounded-xl px-4 text-[15px] text-(--text-primary) bg-(--bg) border border-(--border) outline-none focus:border-(--purple) transition-colors placeholder:text-(--text-secondary)"
                />
              </div>
            )}

            {/* Confirm password (signup only) */}
            {isSignup && (
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
            )}

            {error === 'ALREADY_EXISTS' ? (
              <div className="text-[13px] bg-amber-50 rounded-lg px-3 py-2 space-y-1">
                <p className="text-amber-700 font-medium">This email already has an account.</p>
                <p className="text-amber-600">
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    className="underline font-semibold"
                  >
                    Sign in
                  </button>{' '}
                  or{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('reset')}
                    className="underline font-semibold"
                  >
                    reset your password
                  </button>
                  .
                </p>
              </div>
            ) : error ? (
              <p className="text-[13px] text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            ) : null}
            {success && (
              <p className="text-[13px] text-green-600 bg-green-50 rounded-lg px-3 py-2">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl text-[15px] font-semibold text-white transition-opacity disabled:opacity-60"
              style={{ backgroundColor: 'var(--purple)' }}
            >
              {loading
                ? '…'
                : isReset
                  ? 'Send Reset Email'
                  : isSignup
                    ? 'Create Account'
                    : 'Sign In'}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-4 flex flex-col gap-2 items-center">
            {mode === 'signin' && (
              <>
                <button
                  type="button"
                  onClick={() => switchMode('reset')}
                  className="text-[14px] text-(--purple) font-medium"
                >
                  Forgot password?
                </button>
                <p className="text-[13px] text-(--text-secondary)">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="text-(--purple) font-semibold"
                  >
                    Sign up
                  </button>
                </p>
              </>
            )}
            {mode === 'signup' && (
              <p className="text-[13px] text-(--text-secondary)">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className="text-(--purple) font-semibold"
                >
                  Sign in
                </button>
              </p>
            )}
            {mode === 'reset' && (
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="text-[14px] text-(--purple) font-medium"
              >
                ← Back to sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
