'use client'

import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { apiFetch, saveSession } from '@/lib/api'
import { Field } from '@/components/chat/field'

type Mode = 'login' | 'register'

export function AuthScreen({ onLoggedIn }: { onLoggedIn: (username: string) => void }) {
  const [mode, setMode] = useState<Mode>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)
    const credentials = { username, email, password }

    try {
      if (mode === 'register') {
        // POST /api/users/new — create the account (no token needed yet).
        await apiFetch('/api/users/new', { method: 'POST', json: credentials, auth: false })
        setInfo('Account created. You can log in now.')
        setMode('login')
        setPassword('')
      } else {
        // POST /api/login — returns { token }, which we keep in localStorage.
        const res = await apiFetch<{ token: string }>('/api/login', {
          method: 'POST',
          json: credentials,
          auth: false,
        })
        saveSession(res.token, username)
        onLoggedIn(username)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center bg-wa-panel">
      <div className="h-56 w-full bg-wa-brand" aria-hidden="true" />
      <div className="-mt-40 w-full max-w-md px-4 pb-10">
        <div className="mb-6 flex items-center justify-center gap-2 text-white">
          <MessageCircle className="size-7" aria-hidden="true" />
          <span className="text-xl font-semibold tracking-tight">Chat</span>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-md sm:p-8">
          <div role="tablist" aria-label="Authentication" className="mb-6 grid grid-cols-2 rounded-md bg-wa-panel p-1">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                role="tab"
                type="button"
                aria-selected={mode === m}
                onClick={() => {
                  setMode(m)
                  setError(null)
                  setInfo(null)
                }}
                className={`rounded py-2 text-sm font-medium transition-colors ${
                  mode === m ? 'bg-white text-wa-brand shadow-sm' : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                {m === 'login' ? 'Log in' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="Username" value={username} onChange={setUsername} autoComplete="username" required />
            <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" required />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />

            {error && (
              <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            {info && (
              <p role="status" className="rounded-md bg-wa-out px-3 py-2 text-sm text-wa-brand-dark">
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-full bg-wa-brand py-2.5 text-sm font-semibold text-white transition-colors hover:bg-wa-brand-dark disabled:opacity-60"
            >
              {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
