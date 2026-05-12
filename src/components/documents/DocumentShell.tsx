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
        className="px-6 py-8 sm:px-12 sm:py-10 flex justify-between items-start"
        style={{ backgroundColor: '#0D0D0D', borderBottom: '3px solid #F56E0F' }}
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
      <div className="grid grid-cols-2 sm:flex" style={{ backgroundColor: '#E8E5E0', borderBottom: '0.5px solid #D4D0CA' }}>
        <div className="col-span-2 sm:flex-1 px-5 py-4 sm:px-7 sm:py-5 border-b sm:border-b-0 sm:border-r" style={{ borderColor: '#D4D0CA' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#9A9A9A', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '4px' }}>Prepared For</p>
          <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '14px', fontWeight: 700, color: '#0D0D0D' }}>{client.company_name}</p>
        </div>
        <div className="sm:flex-1 px-5 py-4 sm:px-7 sm:py-5 border-r" style={{ borderColor: '#D4D0CA' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#9A9A9A', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '4px' }}>Contact</p>
          <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '13px', fontWeight: 700, color: '#0D0D0D' }}>{client.contact_name}</p>
        </div>
        <div className="sm:flex-1 px-5 py-4 sm:px-7 sm:py-5">
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#9A9A9A', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '4px' }}>Date</p>
          <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '13px', fontWeight: 700, color: '#0D0D0D' }}>{today}</p>
        </div>
      </div>

      {/* Body */}
      <main className="flex-1 p-6 sm:p-10 md:p-12">
        {children}
      </main>

      {/* Footer */}
      <footer
        className="px-6 py-5 sm:px-12 sm:py-6 flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 sm:items-center"
        style={{ backgroundColor: '#0D0D0D', borderTop: '0.5px solid #1E1E1E' }}
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
