import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { user, profile, loading, signInWithGoogle, signInWithEmail } = useAuth()
  const [signingIn, setSigningIn] = useState(false)
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (loading) return
    if (profile) {
      navigate(profile.role === 'admin' ? '/admin' : '/portal', { replace: true })
    } else if (user) {
      navigate('/not-authorized', { replace: true })
    }
  }, [profile, loading, user, navigate])

  async function handleGoogle() {
    setError('')
    setSigningIn(true)
    const { error } = await signInWithGoogle()
    if (error) {
      setError(error.message)
      setSigningIn(false)
    }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setError('')
    setSigningIn(true)
    const { error } = await signInWithEmail(email.trim())
    setSigningIn(false)
    if (error) setError(error.message)
    else setEmailSent(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ks-ash flex items-center justify-center">
        <p className="font-body text-[11px] uppercase tracking-[0.15em] text-ks-silver">Loading…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — Ash with dot matrix */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12 relative overflow-hidden" style={{ backgroundColor: '#F0EDE8' }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #9A9A9A 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.18 }}
        />

        <div className="relative z-10 max-w-sm">
          {/* Brand */}
          <div className="mb-12">
            <img src="/logo.svg" alt="Kenosonic" style={{ height: '28px', marginBottom: '8px', filter: 'brightness(0)' }} />
            <p className="font-body font-medium text-[9px] uppercase tracking-[0.15em] text-ks-silver">
              Studio OS
            </p>
          </div>

          {/* Heading */}
          <div className="mb-10">
            <p className="font-body font-medium text-[9px] uppercase tracking-[0.15em] text-ks-lava mb-2">Welcome</p>
            <h2 className="font-display font-bold text-[28px] tracking-[-0.02em] text-ks-ink leading-tight">
              Sign in to<br />your workspace
            </h2>
          </div>

          {emailSent ? (
            <div className="bg-white border border-ks-rule p-6">
              <p className="font-body font-medium text-[9px] uppercase tracking-[0.15em] text-ks-lava mb-2">Check your inbox</p>
              <p className="font-body text-[13px] text-ks-ink">
                We sent a sign-in link to <span className="font-medium">{email}</span>.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Google */}
              <button
                onClick={handleGoogle}
                disabled={signingIn}
                className="flex items-center justify-center gap-3 w-full bg-ks-void text-white font-body font-medium text-[11px] uppercase tracking-[0.1em] px-5 py-4 rounded-ks hover:bg-ks-lava transition-colors duration-150 disabled:opacity-50"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {signingIn ? 'Redirecting…' : 'Continue with Google'}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-ks-hairline" />
                <span className="font-body text-[10px] uppercase tracking-[0.1em] text-ks-silver">or</span>
                <div className="flex-1 h-px bg-ks-hairline" />
              </div>

              {/* Email magic link */}
              <form onSubmit={handleEmail} className="flex flex-col gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={signingIn}
                  className="w-full border border-ks-rule bg-white font-body text-[13px] text-ks-ink placeholder:text-ks-silver px-4 py-3 rounded-ks focus:outline-none focus:border-ks-lava transition-colors disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={signingIn || !email.trim()}
                  className="w-full bg-white border border-ks-rule text-ks-ink font-body font-medium text-[11px] uppercase tracking-[0.1em] px-5 py-4 rounded-ks hover:border-ks-lava hover:text-ks-lava transition-colors disabled:opacity-50"
                >
                  Send sign-in link
                </button>
              </form>

              {error && <p className="text-[12px] text-red-500 text-center">{error}</p>}

              <p className="font-body text-[10px] text-ks-silver text-center leading-relaxed">
                Access is by invitation only.<br />Contact Keno Sonic if you need access.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right — Void (hidden on mobile) */}
      <div
        className="hidden lg:flex w-[420px] flex-shrink-0 flex-col justify-end p-12 relative overflow-hidden"
        style={{ backgroundColor: '#0D0D0D', borderLeft: '3px solid #F56E0F' }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, #1A1A1A 0.5px, transparent 0.5px), linear-gradient(to bottom, #1A1A1A 0.5px, transparent 0.5px)', backgroundSize: '40px 40px' }} />
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #4A4A4A 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.12 }} />

        <div className="relative z-10">
          <p className="font-body font-medium text-[9px] uppercase tracking-[0.15em] text-ks-lava mb-3">Studio OS</p>
          <p className="font-display font-bold text-[18px] text-white leading-snug mb-6">
            Proposals, invoices &<br />client documents —<br />all in one place.
          </p>
          <p style={{ fontSize: '9px', fontFamily: 'Inter, sans-serif', color: '#3A3A3A', lineHeight: 1.7 }}>
            B-BBEE Level 1 · 100% Black-Owned<br />
            <a href="mailto:hello@kenosonic.co.za" style={{ color: '#F56E0F', textDecoration: 'none' }}>hello@kenosonic.co.za</a>
          </p>
        </div>
      </div>
    </div>
  )
}
