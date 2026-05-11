import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, profile } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    // Profile loads via useAuth listener; redirect based on role
    // Brief timeout to let profile load
    setTimeout(() => {
      setLoading(false)
    }, 500)
  }

  // Redirect once profile is loaded
  if (profile) {
    navigate(profile.role === 'admin' ? '/admin' : '/portal', { replace: true })
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — Ash with dot matrix */}
      <div className="flex-1 flex flex-col justify-center px-16 py-12 relative overflow-hidden" style={{ backgroundColor: '#F0EDE8' }}>
        {/* Dot matrix texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #9A9A9A 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            opacity: 0.18,
          }}
        />

        <div className="relative z-10 max-w-sm">
          {/* Brand */}
          <div className="mb-12">
            <h1 className="font-display font-bold text-[22px] tracking-[-0.02em] text-ks-ink mb-1">
              KENO <span className="text-ks-lava">SONIC</span>
            </h1>
            <p className="font-body font-medium text-[9px] uppercase tracking-[0.15em] text-ks-silver">
              Studio OS
            </p>
          </div>

          {/* Heading */}
          <div className="mb-10">
            <p className="font-body font-medium text-[9px] uppercase tracking-[0.15em] text-ks-lava mb-2">Welcome Back</p>
            <h2 className="font-display font-bold text-[28px] tracking-[-0.02em] text-ks-ink leading-tight">
              Sign in to<br />your workspace
            </h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="font-body font-medium text-[10px] uppercase tracking-[0.1em] text-ks-silver">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="bg-white border border-ks-rule text-ks-ink text-[13px] px-3 py-3 rounded-ks focus:outline-none focus:border-ks-lava transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-body font-medium text-[10px] uppercase tracking-[0.1em] text-ks-silver">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="bg-white border border-ks-rule text-ks-ink text-[13px] px-3 py-3 rounded-ks focus:outline-none focus:border-ks-lava transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-[12px] text-red-500">{error}</p>}

            <Button type="submit" variant="dark" disabled={loading} className="w-full justify-center py-3.5">
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>
        </div>
      </div>

      {/* Right — Void */}
      <div
        className="w-[420px] flex-shrink-0 flex flex-col justify-end p-12 relative overflow-hidden"
        style={{ backgroundColor: '#0D0D0D', borderLeft: '3px solid #F56E0F' }}
      >
        {/* Grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(to right, #1A1A1A 0.5px, transparent 0.5px), linear-gradient(to bottom, #1A1A1A 0.5px, transparent 0.5px)',
            backgroundSize: '40px 40px',
          }}
        />
        {/* Dot overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #4A4A4A 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            opacity: 0.12,
          }}
        />

        <div className="relative z-10">
          <p className="font-body font-medium text-[9px] uppercase tracking-[0.15em] text-ks-lava mb-3">Studio OS</p>
          <p className="font-display font-bold text-[18px] text-white leading-snug mb-6">
            Proposals, invoices &<br />client documents —<br />all in one place.
          </p>
          <p style={{ color: '#F56E0F', fontWeight: 700, fontSize: '9px', fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            PRECISION // STRATEGY // DESIGN
          </p>
        </div>
      </div>
    </div>
  )
}
