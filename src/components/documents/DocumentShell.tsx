import type { Client, KSDocument } from '../../types'
import { DOC_TYPE_LABELS } from '../../types'

interface DocumentShellProps {
  document: KSDocument
  client: Client
  children: React.ReactNode
  id?: string
}

export function DocumentShell({ document, client, children, id = 'document-content' }: DocumentShellProps) {
  const today = new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div
      id={id}
      className="mx-auto bg-white shadow-sm overflow-hidden flex flex-col"
      style={{ width: '100%', maxWidth: '850px', minHeight: '1100px' }}
    >
      {/* Header — Void */}
      <header
        style={{
          backgroundColor: '#0D0D0D',
          borderBottom: '3px solid #F56E0F',
          padding: '40px 48px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <img
            src="/logo.svg"
            alt="Kenosonic"
            style={{ height: '32px', marginBottom: '16px', filter: 'brightness(0) invert(1)' }}
          />
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#9A9A9A', lineHeight: 1.5, fontWeight: 500 }}>
            Kenosonic Interactive (Pty) Ltd<br />
            Reg. No. 2026/021166/07<br />
            Johannesburg, South Africa
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <p
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '26px',
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
              lineHeight: 1,
              marginBottom: '8px',
            }}
          >
            {DOC_TYPE_LABELS[document.type].toUpperCase()}
          </p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#F56E0F', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Ref: {document.reference_number}
          </p>
        </div>
      </header>

      {/* Stat bar — Pebble */}
      <div style={{ backgroundColor: '#E8E5E0', display: 'flex', borderBottom: '0.5px solid #D4D0CA' }}>
        <div style={{ flex: 1, padding: '20px 28px', borderRight: '0.5px solid #D4D0CA' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#9A9A9A', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '4px' }}>Prepared For</p>
          <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '14px', fontWeight: 700, color: '#0D0D0D' }}>{client.company_name}</p>
        </div>
        <div style={{ flex: 1, padding: '20px 28px', borderRight: '0.5px solid #D4D0CA' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#9A9A9A', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '4px' }}>Contact</p>
          <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '14px', fontWeight: 700, color: '#0D0D0D' }}>{client.contact_name}</p>
        </div>
        <div style={{ flex: 1, padding: '20px 28px' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#9A9A9A', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '4px' }}>Date</p>
          <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '14px', fontWeight: 700, color: '#0D0D0D' }}>{today}</p>
        </div>
      </div>

      {/* Body */}
      <main style={{ flex: 1, padding: '48px' }}>
        {children}
      </main>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: '#0D0D0D',
          padding: '24px 48px',
          borderTop: '0.5px solid #1E1E1E',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#9A9A9A', lineHeight: 1.7 }}>
          Thank you for choosing Kenosonic Interactive.<br />
          For questions, contact us at <a href="mailto:hello@kenosonic.co.za" style={{ color: '#F56E0F', textDecoration: 'none' }}>hello@kenosonic.co.za</a>
        </p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#5A5A5A', textAlign: 'right', lineHeight: 1.7 }}>
          B-BBEE Level 1 · 100% Black-Owned<br />
          Confidential © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  )
}
