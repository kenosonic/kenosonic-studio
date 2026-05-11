import { useAuth } from '../hooks/useAuth'

export default function NotAuthorized() {
  const { signOut } = useAuth()

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F0EDE8' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #9A9A9A 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.15 }} />

      <div className="relative z-10 flex flex-col items-center justify-center w-full px-6">
        <div className="bg-white border border-ks-rule w-full max-w-md overflow-hidden">

          <div style={{ backgroundColor: '#0D0D0D', borderBottom: '3px solid #F56E0F', padding: '28px 36px' }}>
            <img src="/logo.svg" alt="Kenosonic" style={{ height: '24px', filter: 'brightness(0) invert(1)' }} />
            <p className="font-body font-medium text-[9px] uppercase tracking-[0.15em] mt-1" style={{ color: '#5A5A5A' }}>
              Studio OS — Client Access
            </p>
          </div>

          <div className="p-10 text-center">
            <p className="font-body font-medium text-[9px] uppercase tracking-[0.15em] text-red-500 mb-3">Access Denied</p>
            <h2 className="font-display font-bold text-[22px] tracking-[-0.02em] text-ks-ink mb-3">
              No access found
            </h2>
            <p className="font-body text-[13px] text-ks-silver mb-8">
              Your account isn't linked to a Keno Sonic client. If you were sent an invite link, please use that link to sign in.
            </p>
            <button
              onClick={() => signOut()}
              className="font-body font-medium text-[11px] uppercase tracking-[0.1em] text-ks-silver hover:text-ks-lava transition-colors"
            >
              Sign out
            </button>
          </div>

          <div style={{ backgroundColor: '#0D0D0D', borderTop: '0.5px solid #1E1E1E', padding: '16px 36px' }}>
            <p className="font-body text-[9px]" style={{ color: '#3A3A3A', lineHeight: 1.7 }}>
              B-BBEE Level 1 · 100% Black-Owned<br />
              <a href="mailto:hello@kenosonic.co.za" style={{ color: '#F56E0F', textDecoration: 'none' }}>hello@kenosonic.co.za</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
