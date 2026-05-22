import { useEffect, useRef, useState } from 'react'
import type { Client, KSDocument, QuestionnaireCompetitor, QuestionnaireContent } from '../../../types'
import { updateDocumentContent } from '../../../hooks/useDocument'

interface Props {
  document: KSDocument
  client: Client
}

const SERVICE_OPTIONS = [
  'Website Development', 'Digital Marketing', 'Brand & Content Marketing',
  'Google Ads Management', 'Social Media Advertising', 'SEO',
  'Copywriting & Content Strategy', 'Custom Web & App Development',
  'Custom Plugins & Integrations', 'Business Process Automation', 'Other',
]
const TONE_OPTIONS = ['Professional', 'Friendly & Approachable', 'Authoritative', 'Playful', 'Inspirational', 'Minimalist & Calm', 'Bold & Direct', 'Technical & Precise']
const ARCHETYPE_OPTIONS = ['The Hero', 'The Creator', 'The Sage', 'The Ruler', 'The Caregiver', 'The Explorer', 'The Rebel', 'The Magician', 'The Innocent', 'The Jester', 'The Lover', 'The Regular Person']
const VISITOR_ACTIONS = ['Contact form', 'Book appointment', 'Online purchase', 'Phone call', 'Get a quote', 'Download resource', 'Subscribe to newsletter', 'View portfolio / case studies']
const MARKETING_CHANNELS = ['Facebook Ads', 'Instagram Ads', 'Google Ads', 'TikTok Ads', 'LinkedIn Ads', 'Email Marketing', 'SEO / Organic', 'WhatsApp', 'Influencer', 'Print / Offline']
const FEEL_OPTIONS = ['Modern & Minimalist', 'Professional & Corporate', 'Bold & Creative', 'Luxury & Premium', 'Friendly & Approachable', 'Technical & Innovative', 'Warm & Personal', 'Clean & Simple']
const TREND_OPTIONS = ['Minimalist', 'Dark Mode', 'Bold Typography', 'Gradient & Colour', 'Photography-led', 'Illustration-based', 'Animation & Motion', 'Magazine-style']
const TYPOGRAPHY_OPTIONS = ['Serif & Traditional', 'Sans-Serif & Modern', 'Display & Bold', 'Clean & Geometric', 'Mixed']
const ICON_OPTIONS = ['Filled & Solid', 'Outlined & Thin', 'Rounded & Friendly', 'Sharp & Angular', 'No preference']
const IMAGE_OPTIONS = ['Real Photography', 'Lifestyle Photography', 'Abstract & Artistic', 'Illustrations', 'Mix of Photo & Illustration', 'Minimalist / No Images']
const DENSITY_OPTIONS = ['Spacious & Minimal', 'Balanced', 'Information-Rich']
const PAGE_OPTIONS = ['Home', 'About', 'Services', 'Portfolio / Work', 'Blog', 'Contact', 'Testimonials', 'FAQ', 'Pricing', 'Team']
const FEATURE_OPTIONS = ['Contact form', 'Google Maps', 'Live chat widget', 'Booking / calendar system', 'Blog / news section', 'E-commerce (Online Store)', 'Client login area', 'Video backgrounds', 'Multilingual support']
const INTEGRATION_OPTIONS = ['Google Workspace', 'Mailchimp / email marketing', 'WhatsApp Business', 'Shopify / WooCommerce', 'Xero / QuickBooks', 'CRM (HubSpot, Salesforce)', 'Calendly / booking', 'Social media feeds']

const BLANK_COMP: QuestionnaireCompetitor = { name: '', url: '', like: '', dislike: '' }

const inputCls = 'w-full bg-ks-smoke border border-ks-rule text-ks-ink text-[13px] font-body px-3 py-2.5 rounded-ks focus:outline-none focus:border-ks-lava'
const textareaCls = `${inputCls} resize-none`
const selectCls = `${inputCls} appearance-none`

function Chips({ options, value, onChange, max }: { options: string[]; value: string[]; onChange: (v: string[]) => void; max?: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button key={opt} type="button"
          onClick={() => value.includes(opt) ? onChange(value.filter(v => v !== opt)) : (!max || value.length < max) && onChange([...value, opt])}
          className={`px-3 py-1.5 text-[11px] font-body font-medium rounded-ks border transition-colors ${value.includes(opt) ? 'bg-ks-lava text-white border-ks-lava' : 'bg-white text-ks-slate border-ks-rule hover:border-ks-lava'}`}
        >{opt}</button>
      ))}
    </div>
  )
}

function RadioGroup({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button key={opt} type="button" onClick={() => onChange(value === opt ? '' : opt)}
          className={`px-3 py-1.5 text-[11px] font-body font-medium rounded-ks border transition-colors ${value === opt ? 'bg-ks-ink text-white border-ks-ink' : 'bg-white text-ks-slate border-ks-rule hover:border-ks-ink'}`}
        >{opt}</button>
      ))}
    </div>
  )
}

function Lbl({ children }: { children: React.ReactNode }) {
  return <label className="font-body font-medium text-[10px] uppercase tracking-[0.1em] text-ks-silver block mb-1.5">{children}</label>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <Lbl>{label}</Lbl>
      {children}
    </div>
  )
}

function SectionHead({ title }: { title: string }) {
  return (
    <div className="border-b border-ks-rule pb-2 mb-5 mt-8 first:mt-0">
      <p className="font-body font-medium text-[9px] uppercase tracking-[0.15em] text-ks-lava">{title}</p>
    </div>
  )
}

function emptyContent(client: Client): QuestionnaireContent {
  return {
    serviceType: '', businessName: client.company_name, tagline: '',
    businessDescription: '', competitorDifference: '', yearsInBusiness: '',
    phone: client.contact_phone, email: client.contact_email,
    address: '', businessHours: '',
    socialMediaLinks: { instagram: '', linkedin: '', facebook: '', tiktok: '' },
    toneOfVoice: [], brandArchetype: '', brandStory: '', brandValues: '', currentBrandIssues: '',
    primaryGoal: '', targetDemographics: '', targetProblem: '', targetAdvantage: '',
    desiredVisitorActions: [],
    marketingChannels: [], monthlyAdBudget: '', existingCampaigns: '',
    currentWebsiteUrl: '', targetKeywords: '', contentTopics: '', techStackNotes: '',
    desiredFeel: [], designTrends: [],
    typographyFeel: '', iconStyle: '', imageStyle: '', uiDensity: '',
    inspirationUrls: '', brandColors: '', colorsYouLike: '', colorsYouDislike: '', websiteReferences: '',
    competitors: [{ ...BLANK_COMP }, { ...BLANK_COMP }, { ...BLANK_COMP }],
    standardPages: [], copyReadiness: '', imagesReadiness: '', logoReadiness: '',
    dynamicContentNeeds: '', specificFeatures: [],
    ecommerceProducts: '', ecommercePayments: '', ecommerceShipping: '',
    platformPreference: '', ownDomain: '', domainDetails: '', haveHosting: '', hostingDetails: '',
    thirdPartyIntegrations: [],
    deadline: '', deadlineReason: '', availability: '', budgetExtras: '',
    projectBudget: '', decisionMakers: '', previousAgencyExperience: '',
    howTheyFoundUs: '', successMetrics: '',
    additionalInfo: '', confirmation: true,
  }
}

export function DiscoveryDocument({ document, client }: Props) {
  const raw = document.content as Partial<QuestionnaireContent>
  const [content, setContent] = useState<QuestionnaireContent>(() => ({
    ...emptyContent(client),
    ...raw,
    competitors: raw.competitors ?? [{ ...BLANK_COMP }, { ...BLANK_COMP }, { ...BLANK_COMP }],
    toneOfVoice: raw.toneOfVoice ?? [],
    desiredVisitorActions: raw.desiredVisitorActions ?? [],
    marketingChannels: raw.marketingChannels ?? [],
    desiredFeel: raw.desiredFeel ?? [],
    designTrends: raw.designTrends ?? [],
    standardPages: raw.standardPages ?? [],
    specificFeatures: raw.specificFeatures ?? [],
    thirdPartyIntegrations: raw.thirdPartyIntegrations ?? [],
  }))
  const [saving, setSaving] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      setSaving(true)
      await updateDocumentContent(document.id, content as unknown as Record<string, unknown>)
      setSaving(false)
    }, 2000)
    return () => clearTimeout(timer.current)
  }, [content]) // eslint-disable-line react-hooks/exhaustive-deps

  function set<K extends keyof QuestionnaireContent>(key: K, value: QuestionnaireContent[K]) {
    setContent(c => ({ ...c, [key]: value }))
  }

  function setComp(i: number, field: keyof QuestionnaireCompetitor, value: string) {
    setContent(c => ({
      ...c,
      competitors: (c.competitors ?? []).map((comp, idx) => idx === i ? { ...comp, [field]: value } : comp),
    }))
  }

  const competitors = content.competitors ?? [{ ...BLANK_COMP }, { ...BLANK_COMP }, { ...BLANK_COMP }]
  const isPerf = ['Digital Marketing', 'Google Ads Management', 'Social Media Advertising'].includes(content.serviceType)
  const isSEO = content.serviceType === 'SEO'
  const isCopy = content.serviceType === 'Copywriting & Content Strategy'
  const isCustomDev = content.serviceType === 'Custom Web & App Development'
  const isBranding = content.serviceType === 'Brand & Content Marketing'
  const showEcom = content.specificFeatures?.includes('E-commerce (Online Store)')

  return (
    <div className="max-w-[850px]">
      <div className="no-print flex items-center justify-between mb-6">
        <p className="font-body text-[11px] text-ks-silver">Discovery session — notes auto-save as you type.</p>
        {saving && <span className="font-body text-[10px] text-ks-silver animate-pulse">Saving…</span>}
      </div>

      <div className="bg-white border border-ks-hairline p-6 sm:p-10">

        {/* Business Basics */}
        <SectionHead title="Business Basics" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          <Field label="Service Type">
            <select className={selectCls} value={content.serviceType} onChange={e => set('serviceType', e.target.value)}>
              <option value="">— Select service —</option>
              {SERVICE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Business Name">
            <input className={inputCls} value={content.businessName} onChange={e => set('businessName', e.target.value)} />
          </Field>
          <Field label="Tagline">
            <input className={inputCls} value={content.tagline} onChange={e => set('tagline', e.target.value)} placeholder="e.g. Building better business" />
          </Field>
          <Field label="Years in Business">
            <input className={inputCls} value={content.yearsInBusiness} onChange={e => set('yearsInBusiness', e.target.value)} />
          </Field>
          <Field label="Phone">
            <input className={inputCls} value={content.phone} onChange={e => set('phone', e.target.value)} />
          </Field>
          <Field label="Email">
            <input className={inputCls} value={content.email} onChange={e => set('email', e.target.value)} type="email" />
          </Field>
        </div>
        <Field label="Business Description">
          <textarea className={textareaCls} rows={3} value={content.businessDescription} onChange={e => set('businessDescription', e.target.value)} placeholder="What does the business do?" />
        </Field>
        <Field label="What sets them apart from competitors?">
          <textarea className={textareaCls} rows={2} value={content.competitorDifference} onChange={e => set('competitorDifference', e.target.value)} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          <Field label="Address">
            <input className={inputCls} value={content.address} onChange={e => set('address', e.target.value)} />
          </Field>
          <Field label="Business Hours">
            <input className={inputCls} value={content.businessHours} onChange={e => set('businessHours', e.target.value)} placeholder="e.g. Mon–Fri, 8am–5pm" />
          </Field>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6">
          <Field label="Instagram">
            <input className={inputCls} value={content.socialMediaLinks?.instagram ?? ''} onChange={e => set('socialMediaLinks', { ...content.socialMediaLinks, instagram: e.target.value })} placeholder="@handle or URL" />
          </Field>
          <Field label="LinkedIn">
            <input className={inputCls} value={content.socialMediaLinks?.linkedin ?? ''} onChange={e => set('socialMediaLinks', { ...content.socialMediaLinks, linkedin: e.target.value })} />
          </Field>
          <Field label="Facebook">
            <input className={inputCls} value={content.socialMediaLinks?.facebook ?? ''} onChange={e => set('socialMediaLinks', { ...content.socialMediaLinks, facebook: e.target.value })} />
          </Field>
          <Field label="TikTok">
            <input className={inputCls} value={content.socialMediaLinks?.tiktok ?? ''} onChange={e => set('socialMediaLinks', { ...content.socialMediaLinks, tiktok: e.target.value })} />
          </Field>
        </div>

        {/* Brand Identity */}
        <SectionHead title="Brand Identity" />
        <Field label="Tone of Voice">
          <Chips options={TONE_OPTIONS} value={content.toneOfVoice ?? []} onChange={v => set('toneOfVoice', v)} />
        </Field>
        <Field label="Brand Archetype">
          <RadioGroup options={ARCHETYPE_OPTIONS} value={content.brandArchetype ?? ''} onChange={v => set('brandArchetype', v)} />
        </Field>
        <Field label="Brand Story">
          <textarea className={textareaCls} rows={3} value={content.brandStory ?? ''} onChange={e => set('brandStory', e.target.value)} placeholder="The story behind the brand…" />
        </Field>
        <Field label="Brand Values">
          <textarea className={textareaCls} rows={2} value={content.brandValues ?? ''} onChange={e => set('brandValues', e.target.value)} placeholder="e.g. Trust, Innovation, Community" />
        </Field>
        <Field label="Current Brand Issues / Pain Points">
          <textarea className={textareaCls} rows={2} value={content.currentBrandIssues ?? ''} onChange={e => set('currentBrandIssues', e.target.value)} />
        </Field>

        {/* Goals & Audience */}
        <SectionHead title="Goals & Audience" />
        <Field label="Primary Goal">
          <input className={inputCls} value={content.primaryGoal} onChange={e => set('primaryGoal', e.target.value)} placeholder="e.g. Generate more leads online" />
        </Field>
        <Field label="Target Audience">
          <textarea className={textareaCls} rows={2} value={content.targetDemographics} onChange={e => set('targetDemographics', e.target.value)} placeholder="Who are their ideal customers?" />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          <Field label="Problem the Business Solves">
            <textarea className={textareaCls} rows={2} value={content.targetProblem} onChange={e => set('targetProblem', e.target.value)} />
          </Field>
          <Field label="Competitive Advantage">
            <textarea className={textareaCls} rows={2} value={content.targetAdvantage} onChange={e => set('targetAdvantage', e.target.value)} />
          </Field>
        </div>
        <Field label="Desired Visitor Actions">
          <Chips options={VISITOR_ACTIONS} value={content.desiredVisitorActions} onChange={v => set('desiredVisitorActions', v)} />
        </Field>

        {/* Service-specific */}
        {(isPerf || isSEO || isCopy || isCustomDev || isBranding) && (
          <>
            <SectionHead title="Service-Specific Details" />
            {isPerf && (
              <>
                <Field label="Marketing Channels">
                  <Chips options={MARKETING_CHANNELS} value={content.marketingChannels ?? []} onChange={v => set('marketingChannels', v)} />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                  <Field label="Monthly Ad Budget">
                    <input className={inputCls} value={content.monthlyAdBudget ?? ''} onChange={e => set('monthlyAdBudget', e.target.value)} placeholder="e.g. R5,000/month" />
                  </Field>
                  <Field label="Existing Campaigns">
                    <input className={inputCls} value={content.existingCampaigns ?? ''} onChange={e => set('existingCampaigns', e.target.value)} />
                  </Field>
                </div>
              </>
            )}
            {isSEO && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                <Field label="Current Website URL">
                  <input className={inputCls} value={content.currentWebsiteUrl ?? ''} onChange={e => set('currentWebsiteUrl', e.target.value)} />
                </Field>
                <Field label="Target Keywords">
                  <input className={inputCls} value={content.targetKeywords ?? ''} onChange={e => set('targetKeywords', e.target.value)} />
                </Field>
              </div>
            )}
            {isCopy && (
              <Field label="Content Topics / Pages Needing Copy">
                <textarea className={textareaCls} rows={3} value={content.contentTopics ?? ''} onChange={e => set('contentTopics', e.target.value)} />
              </Field>
            )}
            {(isCustomDev || isBranding) && (
              <Field label={isBranding ? 'What triggered the need for branding?' : 'Existing Systems / Tech Stack Notes'}>
                <textarea className={textareaCls} rows={3} value={content.techStackNotes ?? ''} onChange={e => set('techStackNotes', e.target.value)} />
              </Field>
            )}
          </>
        )}

        {/* Look & Feel */}
        <SectionHead title="Look & Feel" />
        <Field label="Brand Feel (select up to 3)">
          <Chips options={FEEL_OPTIONS} value={content.desiredFeel} onChange={v => set('desiredFeel', v)} max={3} />
        </Field>
        <Field label="Design Trends">
          <Chips options={TREND_OPTIONS} value={content.designTrends} onChange={v => set('designTrends', v)} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6">
          <Field label="Typography Feel">
            <RadioGroup options={TYPOGRAPHY_OPTIONS} value={content.typographyFeel ?? ''} onChange={v => set('typographyFeel', v)} />
          </Field>
          <Field label="Icon Style">
            <RadioGroup options={ICON_OPTIONS} value={content.iconStyle ?? ''} onChange={v => set('iconStyle', v)} />
          </Field>
          <Field label="Image Style">
            <RadioGroup options={IMAGE_OPTIONS} value={content.imageStyle ?? ''} onChange={v => set('imageStyle', v)} />
          </Field>
        </div>
        <Field label="UI Density">
          <RadioGroup options={DENSITY_OPTIONS} value={content.uiDensity ?? ''} onChange={v => set('uiDensity', v)} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6">
          <Field label="Brand Colours">
            <input className={inputCls} value={content.brandColors} onChange={e => set('brandColors', e.target.value)} placeholder="e.g. #FF5733, Blue" />
          </Field>
          <Field label="Colours They Like">
            <input className={inputCls} value={content.colorsYouLike} onChange={e => set('colorsYouLike', e.target.value)} />
          </Field>
          <Field label="Colours to Avoid">
            <input className={inputCls} value={content.colorsYouDislike} onChange={e => set('colorsYouDislike', e.target.value)} />
          </Field>
        </div>
        <Field label="Reference Websites">
          <textarea className={textareaCls} rows={2} value={content.websiteReferences} onChange={e => set('websiteReferences', e.target.value)} placeholder="URLs they like the look of…" />
        </Field>
        <Field label="Inspiration URLs / Notes">
          <textarea className={textareaCls} rows={2} value={content.inspirationUrls ?? ''} onChange={e => set('inspirationUrls', e.target.value)} />
        </Field>

        {/* Competitors */}
        <SectionHead title="Competitors" />
        {competitors.map((comp, i) => (
          <div key={i} className="mb-4 p-4 bg-ks-smoke border border-ks-rule rounded-ks">
            <p className="font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-silver mb-3">Competitor {i + 1}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <Lbl>Name</Lbl>
                <input className={inputCls} value={comp.name} onChange={e => setComp(i, 'name', e.target.value)} />
              </div>
              <div>
                <Lbl>Website URL</Lbl>
                <input className={inputCls} value={comp.url} onChange={e => setComp(i, 'url', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Lbl>What they like about it</Lbl>
                <input className={inputCls} value={comp.like} onChange={e => setComp(i, 'like', e.target.value)} />
              </div>
              <div>
                <Lbl>What they dislike</Lbl>
                <input className={inputCls} value={comp.dislike} onChange={e => setComp(i, 'dislike', e.target.value)} />
              </div>
            </div>
          </div>
        ))}

        {/* Content & Features */}
        <SectionHead title="Content & Features" />
        <Field label="Pages Needed">
          <Chips options={PAGE_OPTIONS} value={content.standardPages} onChange={v => set('standardPages', v)} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6">
          <Field label="Copy Readiness">
            <RadioGroup options={['Ready', 'Needs work', 'Starting fresh']} value={content.copyReadiness} onChange={v => set('copyReadiness', v)} />
          </Field>
          <Field label="Images Readiness">
            <RadioGroup options={['Ready', 'Needs work', 'Starting fresh']} value={content.imagesReadiness} onChange={v => set('imagesReadiness', v)} />
          </Field>
          <Field label="Logo Readiness">
            <RadioGroup options={['Have one', 'Needs redesign', 'Need new']} value={content.logoReadiness} onChange={v => set('logoReadiness', v)} />
          </Field>
        </div>
        <Field label="Dynamic Content Needs">
          <textarea className={textareaCls} rows={2} value={content.dynamicContentNeeds} onChange={e => set('dynamicContentNeeds', e.target.value)} placeholder="e.g. Rotating testimonials, live pricing, events feed" />
        </Field>
        <Field label="Special Features">
          <Chips options={FEATURE_OPTIONS} value={content.specificFeatures} onChange={v => set('specificFeatures', v)} />
        </Field>
        {showEcom && (
          <div className="mt-1 mb-5 p-4 bg-ks-smoke border border-ks-rule rounded-ks">
            <p className="font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-silver mb-4">E-commerce Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6">
              <Field label="Products / SKUs">
                <input className={inputCls} value={content.ecommerceProducts ?? ''} onChange={e => set('ecommerceProducts', e.target.value)} />
              </Field>
              <Field label="Payment Methods">
                <input className={inputCls} value={content.ecommercePayments ?? ''} onChange={e => set('ecommercePayments', e.target.value)} placeholder="e.g. PayFast, card, EFT" />
              </Field>
              <Field label="Shipping / Delivery">
                <input className={inputCls} value={content.ecommerceShipping ?? ''} onChange={e => set('ecommerceShipping', e.target.value)} />
              </Field>
            </div>
          </div>
        )}

        {/* Technical Setup */}
        <SectionHead title="Technical Setup" />
        <Field label="Platform Preference">
          <input className={inputCls} value={content.platformPreference} onChange={e => set('platformPreference', e.target.value)} placeholder="e.g. WordPress, Shopify, custom, no preference" />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          <Field label="Have a Domain?">
            <RadioGroup options={['Yes', 'No', 'Not sure']} value={content.ownDomain} onChange={v => set('ownDomain', v)} />
          </Field>
          <Field label="Have Hosting?">
            <RadioGroup options={['Yes', 'No', 'Not sure']} value={content.haveHosting} onChange={v => set('haveHosting', v)} />
          </Field>
        </div>
        {content.ownDomain === 'Yes' && (
          <Field label="Domain Name">
            <input className={inputCls} value={content.domainDetails ?? ''} onChange={e => set('domainDetails', e.target.value)} />
          </Field>
        )}
        {content.haveHosting === 'Yes' && (
          <Field label="Hosting Details">
            <input className={inputCls} value={content.hostingDetails ?? ''} onChange={e => set('hostingDetails', e.target.value)} placeholder="Provider, plan, any constraints" />
          </Field>
        )}
        <Field label="Third-Party Integrations">
          <Chips options={INTEGRATION_OPTIONS} value={content.thirdPartyIntegrations} onChange={v => set('thirdPartyIntegrations', v)} />
        </Field>

        {/* Timeline & Budget */}
        <SectionHead title="Timeline & Budget" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          <Field label="Target Launch Date">
            <input className={inputCls} type="date" value={content.deadline} onChange={e => set('deadline', e.target.value)} />
          </Field>
          <Field label="Why this date?">
            <input className={inputCls} value={content.deadlineReason} onChange={e => set('deadlineReason', e.target.value)} placeholder="e.g. Tied to product launch" />
          </Field>
          <Field label="Project Budget">
            <input className={inputCls} value={content.projectBudget ?? ''} onChange={e => set('projectBudget', e.target.value)} placeholder="e.g. R15,000–R25,000" />
          </Field>
          <Field label="Budget for Extras?">
            <input className={inputCls} value={content.budgetExtras} onChange={e => set('budgetExtras', e.target.value)} placeholder="e.g. Photography, copywriting" />
          </Field>
          <Field label="Availability for Meetings">
            <input className={inputCls} value={content.availability} onChange={e => set('availability', e.target.value)} placeholder="e.g. Mornings only, flexible" />
          </Field>
          <Field label="Decision Makers">
            <input className={inputCls} value={content.decisionMakers ?? ''} onChange={e => set('decisionMakers', e.target.value)} placeholder="Who else is involved in approvals?" />
          </Field>
        </div>
        <Field label="Previous Agency Experience">
          <textarea className={textareaCls} rows={2} value={content.previousAgencyExperience ?? ''} onChange={e => set('previousAgencyExperience', e.target.value)} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          <Field label="How Did They Find Us?">
            <input className={inputCls} value={content.howTheyFoundUs ?? ''} onChange={e => set('howTheyFoundUs', e.target.value)} placeholder="e.g. Referral, Google, social media" />
          </Field>
          <Field label="Success Metrics">
            <input className={inputCls} value={content.successMetrics ?? ''} onChange={e => set('successMetrics', e.target.value)} placeholder="How will the client measure success?" />
          </Field>
        </div>

        {/* Session Notes */}
        <SectionHead title="Session Notes" />
        <Field label="Additional Notes">
          <textarea className={textareaCls} rows={5} value={content.additionalInfo} onChange={e => set('additionalInfo', e.target.value)} placeholder="Anything else discussed during the session…" />
        </Field>

      </div>
    </div>
  )
}
