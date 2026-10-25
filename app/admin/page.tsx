'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import AdminPanel from '@/components/admin-panel'

const ADMIN_TOKEN_KEY = 'cinestage-admin-token'

function apiBase() {
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '')
}

export default function AdminPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem(ADMIN_TOKEN_KEY)
    if (stored) setToken(stored)
    setChecked(true)

    function handleExpired() {
      sessionStorage.removeItem(ADMIN_TOKEN_KEY)
      setToken(null)
      setError('Your session expired — please log in again.')
    }
    window.addEventListener('admin-auth-expired', handleExpired)
    return () => window.removeEventListener('admin-auth-expired', handleExpired)
  }, [])

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${apiBase()}/api/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) throw new Error('Invalid admin credentials')
      const data = await res.json()
      sessionStorage.setItem(ADMIN_TOKEN_KEY, data.token)
      setToken(data.token)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY)
    setToken(null)
  }

  if (!checked) return null

  if (!token) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f1117',
          padding: 16,
        }}
      >
        <form
          onSubmit={handleLogin}
          style={{
            width: '100%',
            maxWidth: 360,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            padding: 28,
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.03)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#e8ecf4',
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            <LogIn size={18} /> Admin Access
          </div>

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            style={{
              height: 40,
              padding: '0 12px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: '#e8ecf4',
            }}
            required
          />
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              style={{
                width: '100%',
                height: 40,
                padding: '0 44px 0 12px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: '#e8ecf4',
              }}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 40,
                height: 40,
                display: 'grid',
                placeItems: 'center',
                border: 'none',
                background: 'transparent',
                color: '#a0aec0',
                cursor: 'pointer',
              }}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>

          {error && <div style={{ color: '#f87171', fontSize: 13 }}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{
              height: 40,
              borderRadius: 8,
              border: 'none',
              background: '#7c3aed',
              color: '#fff',
              fontWeight: 600,
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <button
            type="button"
            onClick={() => router.push('/')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#a0aec0',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            ← Back to site
          </button>
        </form>
      </main>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={handleLogout}
        style={{
          position: 'fixed',
          top: 64,
          right: 14,
          zIndex: 100,
          height: 34,
          padding: '0 14px',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.15)',
          background: 'rgba(15,17,23,0.85)',
          color: '#e8ecf4',
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        Logout
      </button>
      <AdminPanel onBack={() => router.push('/')} />
    </div>
  )
}
