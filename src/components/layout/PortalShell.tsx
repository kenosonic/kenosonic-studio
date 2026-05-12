import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function PortalShell({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-ks-ash">
      <header
        className="h-14 px-4 sm:px-8 flex items-center justify-between"
        style={{ backgroundColor: '#0D0D0D', borderBottom: '3px solid #F56E0F' }}
      >
        <h1 className="font-display font-bold text-[15px] tracking-[-0.02em] text-white">
          KENO <span style={{ color: '#F56E0F' }}>SONIC</span>
        </h1>
        <div className="flex items-center gap-4 sm:gap-6">
          <span className="hidden sm:block font-body text-[11px] text-[#9A9A9A]">{profile?.full_name}</span>
          <button
            onClick={handleSignOut}
            className="font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-lava hover:text-white transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {children}
      </main>
    </div>
  )
}
