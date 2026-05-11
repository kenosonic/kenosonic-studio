import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

type Stage = 'loading' | 'ready' | 'signing-in' | 'email-sent' | 'processing' | 'error'

export default function Invite() {
  const { token } = useParams<{ token: string }>()
  const { user, loading: authLoading, signInWithEmail } = useAuth()
  const navigate = useNavigate()

  const [stage, setStage] = useState<Stage>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [inviteValid, setInviteValid] = useState(false)
  const [email, setEmail] = useState('')

  // Validate the token on mount (even before sign-in)
  useEffect(() => {
    if (!token) { setStage('error'); setErrorMsg('Invalid invite link.'); return }
    supabase
      .from('invites')
      .select('id, expires_at, used_at')
      .eq('token', token)
      .single()
      .then(({ data }) => {
        if (!data) { setStage('error'); setErrorMsg('This invite link is invalid.'); return }
        if (data.used_at) { setStage('error'); setErrorMsg('This invite link has already been used.'); return }
        if (new Date(data.expires_at) < new Date()) { setStage('error'); setErrorMsg('This invite link has expired.'); return }
        setInviteValid(true)
        setStage('ready')
      })
  }, [token])

  // After Google OAuth redirects back here — user is now authenticated
  useEffect(() => {
    if (authLoading || !user || !inviteValid || stage === 'processing') return
    processInvite()
  }, [user, authLoading, inviteValid]) // eslint-disable-line react-hooks/exhaustive-deps

  async function processInvite() {
    setStage('processing')
    try {
      // Re-fetch invite (must still be valid)
      const { data: invite } = await supabase
        .from('invites')
        .select('id, client_id, used_at')
        .eq('token', token!)
        .single()

      if (!invite || invite.used_at) {
        setStage('error')
        setErrorMsg('This invite has already been used or is no longer valid.')
        return
      }

      // Link user's profile to this client
      await supabase
        .from('profiles')
        .upsert({
          id: user!.id,
          role: 'client',
          client_id: invite.client_id,
          full_name: user!.user_metadata?.full_name ?? user!.email ?? '',
        })

      // Consume the invite
      await supabase
        .from('invites')
        .update({ used_at: new Date().toISOString(), used_by: user!.id })
        .eq('id', invite.id)

      navigate('/portal', { replace: true })
    } catch {
      setStage('error')
      setErrorMsg('Something went wrong. Please contact Keno Sonic.')
    }
  }

  async function handleGoogleSignIn() {
    setStage('signing-in')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/invite/${token}` },
    })
    if (error) { setStage('ready'); setErrorMsg(error.message) }
  }

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStage('signing-in')
    const { error } = await signInWithEmail(email.trim(), `${window.location.origin}/invite/${token}`)
    if (error) { setStage('ready'); setErrorMsg(error.message) }
    else setStage('email-sent')
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F0EDE8' }}>
      {/* Dot matrix */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #9A9A9A 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.15 }} />

      <div className="relative z-10 flex flex-col items-center justify-center w-full px-6">
        <div className="bg-white border border-ks-rule w-full max-w-md overflow-hidden">

          {/* Header */}
          <div style={{ backgroundColor: '#0D0D0D', borderBottom: '3px solid #F56E0F', padding: '28px 36px' }}>
            <h1 className="font-display font-bold text-[18px] tracking-[-0.02em] text-white">
              KENO <span style={{ color: '#F56E0F' }}>SONIC</span>
            </h1>
            <p className="font-body font-medium text-[9px] uppercase tracking-[0.15em] mt-1" style={{ color: '#5A5A5A' }}>
              Studio OS — Client Access
            </p>
          </div>

          {/* Body */}
          <div className="p-10">
            {stage === 'loading' && (
              <p className="font-body text-[12px] text-ks-silver text-center">Validating invite…</p>
            )}

            {stage === 'processing' && (
              <p className="font-body text-[12px] text-ks-silver text-center">Setting up your access…</p>
            )}

            {stage === 'error' && (
              <div className="text-center">
                <p className="font-body font-medium text-[9px] uppercase tracking-[0.15em] text-red-500 mb-3">Access Denied</p>
                <p className="font-display font-bold text-[18px] text-ks-ink mb-4">Invalid Invite</p>
                <p className="font-body text-[13px] text-ks-silver">{errorMsg}</p>
              </div>
            )}

            {stage === 'email-sent' && (
              <div className="text-center">
                <p className="font-body font-medium text-[9px] uppercase tracking-[0.15em] text-ks-lava mb-3">Check your inbox</p>
                <h2 className="font-display font-bold text-[22px] tracking-[-0.02em] text-ks-ink mb-3">
                  Magic link sent
                </h2>
                <p className="font-body text-[13px] text-ks-silver">
                  We sent a sign-in link to <span className="text-ks-ink font-medium">{email}</span>. Click it to access your documents.
                </p>
              </div>
            )}

            {(stage === 'ready' || stage === 'signing-in') && (
              <div>
                <p className="font-body font-medium text-[9px] uppercase tracking-[0.15em] text-ks-lava mb-3">You've been invited</p>
                <h2 className="font-display font-bold text-[22px] tracking-[-0.02em] text-ks-ink mb-3">
                  Access your<br />Keno Sonic documents
                </h2>
                <p className="font-body text-[13px] text-ks-silver mb-8">
                  Sign in to view, approve, and sign documents shared with you.
                </p>

                {/* Google */}
                <button
                  onClick={handleGoogleSignIn}
                  disabled={stage === 'signing-in'}
                  className="flex items-center justify-center gap-3 w-full bg-ks-void text-white font-body font-medium text-[11px] uppercase tracking-[0.1em] px-5 py-4 rounded-ks hover:bg-ks-lava transition-colors disabled:opacity-50 mb-4"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  {stage === 'signing-in' ? 'Redirecting…' : 'Continue with Google'}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-ks-hairline" />
                  <span className="font-body text-[10px] uppercase tracking-[0.1em] text-ks-silver">or</span>
                  <div className="flex-1 h-px bg-ks-hairline" />
                </div>

                {/* Email magic link */}
                <form onSubmit={handleEmailSignIn} className="flex flex-col gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@workemail.com"
                    disabled={stage === 'signing-in'}
                    className="w-full border border-ks-rule bg-white font-body text-[13px] text-ks-ink placeholder:text-ks-silver px-4 py-3 rounded-ks focus:outline-none focus:border-ks-lava transition-colors disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={stage === 'signing-in' || !email.trim()}
                    className="w-full bg-white border border-ks-rule text-ks-ink font-body font-medium text-[11px] uppercase tracking-[0.1em] px-5 py-4 rounded-ks hover:border-ks-lava hover:text-ks-lava transition-colors disabled:opacity-50"
                  >
                    Send sign-in link
                  </button>
                </form>

                {errorMsg && <p className="mt-4 text-[12px] text-red-500 text-center">{errorMsg}</p>}

                <p className="mt-6 font-body text-[10px] text-ks-silver text-center">
                  This link is for your use only. Do not share it with others.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ backgroundColor: '#0D0D0D', borderTop: '0.5px solid #1E1E1E', padding: '16px 36px' }}>
            <p className="font-body text-[9px] uppercase tracking-[0.05em]" style={{ color: '#3A3A3A' }}>
              PRECISION // STRATEGY // DESIGN
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
