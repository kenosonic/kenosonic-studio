import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createClient, createProject } from '../../hooks/useClient'
import { useAuth } from '../../hooks/useAuth'
import { Button, Input, Select, Textarea, MicroLabel } from '../../components/ui'
import { SERVICE_LABELS, type ServiceType, type WizardData } from '../../types'

const INDUSTRIES = ['Technology', 'Retail', 'Food & Beverage', 'Fashion', 'Healthcare', 'Finance', 'Real Estate', 'Media & Entertainment', 'Education', 'NGO / Non-Profit', 'Government', 'Other']

const STEPS = ['Business Info', 'Contact Details', 'Address & Legal', 'First Project', 'Review & Save']

const empty: WizardData = {
  company_name: '', industry: '', website: '',
  contact_name: '', contact_email: '', contact_phone: '',
  address_line1: '', address_line2: '', city: '', province: '', country: 'ZA',
  registration_number: '', vat_number: '',
  project_name: '', service_type: '', project_value: '',
  notes: '',
}

export default function NewClient() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<WizardData>(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const navigate = useNavigate()

  function set(field: keyof WizardData, value: string) {
    setData(d => ({ ...d, [field]: value }))
  }

  function next() { setStep(s => Math.min(s + 1, 4)) }
  function back() { setStep(s => Math.max(s - 1, 0)) }

  async function handleSave() {
    if (!user) return
    setSaving(true)
    setError('')
    try {
      const client = await createClient(data, user.id)
      if (data.project_name && data.service_type) {
        await createProject(client.id, data)
      }
      navigate(`/admin/clients/${client.id}`)
    } catch (e) {
      setError((e as Error).message)
      setSaving(false)
    }
  }

  const stepContent: React.ReactNode[] = [
    // Step 0 — Business Info
    <div key="0" className="flex flex-col gap-5">
      <Input label="Company Name *" value={data.company_name} onChange={e => set('company_name', e.target.value)} placeholder="e.g. &Fries Soweto" required />
      <Select label="Industry *" value={data.industry} onChange={e => set('industry', e.target.value)}>
        <option value="">Select industry…</option>
        {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
      </Select>
      <Input label="Website" value={data.website} onChange={e => set('website', e.target.value)} placeholder="https://example.co.za" type="url" />
    </div>,

    // Step 1 — Contact Details
    <div key="1" className="flex flex-col gap-5">
      <Input label="Contact Name *" value={data.contact_name} onChange={e => set('contact_name', e.target.value)} placeholder="Full name" />
      <Input label="Email *" value={data.contact_email} onChange={e => set('contact_email', e.target.value)} placeholder="contact@company.co.za" type="email" />
      <Input label="Phone" value={data.contact_phone} onChange={e => set('contact_phone', e.target.value)} placeholder="+27 82 000 0000" />
    </div>,

    // Step 2 — Address & Legal
    <div key="2" className="flex flex-col gap-5">
      <Input label="Address Line 1 *" value={data.address_line1} onChange={e => set('address_line1', e.target.value)} placeholder="123 Main Street" />
      <Input label="Address Line 2" value={data.address_line2} onChange={e => set('address_line2', e.target.value)} placeholder="Suite / Unit (optional)" />
      <div className="grid grid-cols-2 gap-4">
        <Input label="City *" value={data.city} onChange={e => set('city', e.target.value)} placeholder="Johannesburg" />
        <Input label="Province *" value={data.province} onChange={e => set('province', e.target.value)} placeholder="Gauteng" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Reg. Number" value={data.registration_number} onChange={e => set('registration_number', e.target.value)} placeholder="2026/000000/07" />
        <Input label="VAT Number" value={data.vat_number} onChange={e => set('vat_number', e.target.value)} placeholder="4000000000" />
      </div>
    </div>,

    // Step 3 — First Project
    <div key="3" className="flex flex-col gap-5">
      <p className="font-body text-[12px] text-ks-silver">Optional — you can skip this and add projects later.</p>
      <Input label="Project Name" value={data.project_name} onChange={e => set('project_name', e.target.value)} placeholder="e.g. Website Redesign 2026" />
      <Select label="Service Type" value={data.service_type} onChange={e => set('service_type', e.target.value as ServiceType)}>
        <option value="">Select service…</option>
        {(Object.entries(SERVICE_LABELS) as [ServiceType, string][]).map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </Select>
      <Input label="Estimated Value (ZAR)" value={data.project_value} onChange={e => set('project_value', e.target.value)} placeholder="0.00" type="number" />
      <Textarea label="Notes" value={data.notes} onChange={e => set('notes', e.target.value)} placeholder="Any relevant context…" rows={3} />
    </div>,

    // Step 4 — Review
    <div key="4" className="flex flex-col gap-6">
      <div className="bg-ks-pebble p-6 rounded-ks">
        <MicroLabel className="block mb-3">Business</MicroLabel>
        <p className="font-display font-bold text-[16px] text-ks-ink">{data.company_name}</p>
        <p className="font-body text-[12px] text-ks-silver">{data.industry} · {data.website || 'No website'}</p>
      </div>
      <div className="bg-ks-pebble p-6 rounded-ks">
        <MicroLabel className="block mb-3">Contact</MicroLabel>
        <p className="font-body text-[13px] text-ks-slate">{data.contact_name}</p>
        <p className="font-body text-[12px] text-ks-silver">{data.contact_email} · {data.contact_phone || 'No phone'}</p>
      </div>
      <div className="bg-ks-pebble p-6 rounded-ks">
        <MicroLabel className="block mb-3">Address</MicroLabel>
        <p className="font-body text-[12px] text-ks-slate">{data.address_line1}{data.address_line2 ? `, ${data.address_line2}` : ''}</p>
        <p className="font-body text-[12px] text-ks-silver">{data.city}, {data.province} · Reg: {data.registration_number || '—'}</p>
      </div>
      {data.project_name && (
        <div className="bg-ks-pebble p-6 rounded-ks">
          <MicroLabel className="block mb-3">First Project</MicroLabel>
          <p className="font-body text-[13px] text-ks-slate">{data.project_name}</p>
          <p className="font-body text-[12px] text-ks-silver">{SERVICE_LABELS[data.service_type as ServiceType] ?? data.service_type} · {data.project_value ? `R ${data.project_value}` : 'No value set'}</p>
        </div>
      )}
      {error && <p className="text-[12px] text-red-500">{error}</p>}
    </div>,
  ]

  const canNext = [
    data.company_name && data.industry,
    data.contact_name && data.contact_email,
    data.address_line1 && data.city && data.province,
    true,
    true,
  ]

  return (
    <div className="px-10 py-10">
      <MicroLabel>New Client</MicroLabel>
      <h2 className="font-display font-bold text-[24px] tracking-[-0.02em] text-ks-ink mt-1 mb-10">Client Onboarding</h2>

      <div className="max-w-xl">
        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-10">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-display font-bold text-[11px] border transition-colors ${
                  i < step ? 'bg-ks-lava border-ks-lava text-white' :
                  i === step ? 'bg-ks-void border-ks-void text-white' :
                  'bg-white border-ks-rule text-ks-silver'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <p className={`font-body text-[9px] uppercase tracking-[0.08em] mt-1.5 text-center ${i === step ? 'text-ks-ink font-medium' : 'text-ks-silver'}`}>
                  {label}
                </p>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-[0.5px] mb-5 mx-1 ${i < step ? 'bg-ks-lava' : 'bg-ks-rule'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="bg-white border border-ks-hairline p-8 mb-6">
          <p className="font-body font-medium text-[9px] uppercase tracking-[0.15em] text-ks-lava mb-6">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
          {stepContent[step]}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={back} disabled={step === 0}>← Back</Button>
          {step < 4 ? (
            <Button variant="dark" onClick={next} disabled={!canNext[step]}>
              Continue →
            </Button>
          ) : (
            <Button variant="orange" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Create Client →'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
