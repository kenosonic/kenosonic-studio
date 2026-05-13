import { useState } from 'react'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import { questionnaireSchema, type QuestionnaireFormValues, STEP_FIELDS } from '../../../lib/validations/questionnaire'
import { updateDocumentContent, updateDocumentStatus } from '../../../hooks/useDocument'
import { FileUpload } from '../../ui/FileUpload'
import type { KSDocument } from '../../../types'

const STEPS = ['Basics', 'Brand', 'Goals', 'Aesthetics', 'Competitors', 'Content', 'Tech', 'Timeline', 'Sign-Off']

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

interface ChipsProps { options: string[]; value: string[]; onChange: (v: string[]) => void; max?: number }
function Chips({ options, value, onChange, max }: ChipsProps) {
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
        <button key={opt} type="button" onClick={() => onChange(opt)}
          className={`px-3 py-1.5 text-[11px] font-body font-medium rounded-ks border transition-colors ${value === opt ? 'bg-ks-ink text-white border-ks-ink' : 'bg-white text-ks-slate border-ks-rule hover:border-ks-ink'}`}
        >{opt}</button>
      ))}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="font-body font-medium text-[10px] uppercase tracking-[0.1em] text-ks-silver block mb-1.5">{children}</label>
}
function Err({ message }: { message?: string }) {
  return message ? <p className="font-body text-[10px] text-red-500 mt-1">{message}</p> : null
}

const inputCls = 'w-full bg-ks-smoke border border-ks-rule text-ks-ink text-[13px] font-body px-3 py-2.5 rounded-ks focus:outline-none focus:border-ks-lava'
const selectCls = `${inputCls} appearance-none`
const textareaCls = `${inputCls} resize-none`

interface Props { document: KSDocument; onComplete: () => void }

export function QuestionnaireForm({ document, onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const existing = document.content as Partial<QuestionnaireFormValues>

  const { register, control, handleSubmit, trigger, watch, formState: { errors } } = useForm<QuestionnaireFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(questionnaireSchema) as any,
    defaultValues: {
      serviceType: existing.serviceType ?? '',
      businessName: existing.businessName ?? '',
      tagline: existing.tagline ?? '',
      businessDescription: existing.businessDescription ?? '',
      competitorDifference: existing.competitorDifference ?? '',
      yearsInBusiness: existing.yearsInBusiness ?? '',
      phone: existing.phone ?? '',
      email: existing.email ?? '',
      address: existing.address ?? '',
      businessHours: existing.businessHours ?? '',
      socialMediaLinks: existing.socialMediaLinks ?? { instagram: '', linkedin: '', facebook: '', tiktok: '' },
      logoUrl: existing.logoUrl ?? '',
      brandGuideUrl: existing.brandGuideUrl ?? '',
      toneOfVoice: existing.toneOfVoice ?? [],
      brandArchetype: existing.brandArchetype ?? '',
      brandStory: existing.brandStory ?? '',
      brandValues: existing.brandValues ?? '',
      currentBrandIssues: existing.currentBrandIssues ?? '',
      primaryGoal: existing.primaryGoal ?? '',
      targetDemographics: existing.targetDemographics ?? '',
      targetProblem: existing.targetProblem ?? '',
      targetAdvantage: existing.targetAdvantage ?? '',
      desiredVisitorActions: existing.desiredVisitorActions ?? [],
      marketingChannels: existing.marketingChannels ?? [],
      monthlyAdBudget: existing.monthlyAdBudget ?? '',
      existingCampaigns: existing.existingCampaigns ?? '',
      currentWebsiteUrl: existing.currentWebsiteUrl ?? '',
      targetKeywords: existing.targetKeywords ?? '',
      contentTopics: existing.contentTopics ?? '',
      techStackNotes: existing.techStackNotes ?? '',
      desiredFeel: existing.desiredFeel ?? [],
      designTrends: existing.designTrends ?? [],
      typographyFeel: existing.typographyFeel ?? '',
      iconStyle: existing.iconStyle ?? '',
      imageStyle: existing.imageStyle ?? '',
      uiDensity: existing.uiDensity ?? '',
      inspirationUrls: existing.inspirationUrls ?? '',
      inspirationUploadUrls: existing.inspirationUploadUrls ?? [],
      brandColors: existing.brandColors ?? '',
      colorsYouLike: existing.colorsYouLike ?? '',
      colorsYouDislike: existing.colorsYouDislike ?? '',
      websiteReferences: existing.websiteReferences ?? '',
      competitors: existing.competitors ?? [{ name: '', url: '', like: '', dislike: '' }, { name: '', url: '', like: '', dislike: '' }, { name: '', url: '', like: '', dislike: '' }],
      standardPages: existing.standardPages ?? [],
      copyReadiness: existing.copyReadiness ?? '',
      imagesReadiness: existing.imagesReadiness ?? '',
      logoReadiness: existing.logoReadiness ?? '',
      dynamicContentNeeds: existing.dynamicContentNeeds ?? '',
      specificFeatures: existing.specificFeatures ?? [],
      ecommerceProducts: existing.ecommerceProducts ?? '',
      ecommercePayments: existing.ecommercePayments ?? '',
      ecommerceShipping: existing.ecommerceShipping ?? '',
      platformPreference: existing.platformPreference ?? '',
      ownDomain: existing.ownDomain ?? '',
      domainDetails: existing.domainDetails ?? '',
      haveHosting: existing.haveHosting ?? '',
      hostingDetails: existing.hostingDetails ?? '',
      thirdPartyIntegrations: existing.thirdPartyIntegrations ?? [],
      deadline: existing.deadline ?? '',
      deadlineReason: existing.deadlineReason ?? '',
      availability: existing.availability ?? '',
      budgetExtras: existing.budgetExtras ?? '',
      projectBudget: existing.projectBudget ?? '',
      decisionMakers: existing.decisionMakers ?? '',
      previousAgencyExperience: existing.previousAgencyExperience ?? '',
      howTheyFoundUs: existing.howTheyFoundUs ?? '',
      successMetrics: existing.successMetrics ?? '',
      additionalInfo: existing.additionalInfo ?? '',
      confirmation: (existing.confirmation ?? false) as unknown as true,
    },
  })

  const { fields: competitorFields } = useFieldArray({ control, name: 'competitors' })
  const serviceType = watch('serviceType')
  const specificFeatures = watch('specificFeatures') ?? []
  const showEcommerce = specificFeatures.includes('E-commerce (Online Store)')
  const ownDomain = watch('ownDomain')
  const haveHosting = watch('haveHosting')

  const isPerformanceService = ['Digital Marketing', 'Google Ads Management', 'Social Media Advertising'].some(s => serviceType?.includes(s.split(' ')[0]))
  const isSEO = serviceType?.includes('SEO')
  const isCopy = serviceType?.includes('Copywriting')
  const isCustomDev = serviceType?.includes('Custom')
  const isBrand = serviceType?.includes('Brand')

  async function goNext() {
    const valid = await trigger(STEP_FIELDS[step] as never)
    if (!valid) return
    setDirection(1)
    setStep(s => s + 1)
  }

  function goBack() {
    setDirection(-1)
    setStep(s => s - 1)
  }

  async function onSubmit(values: QuestionnaireFormValues) {
    setSubmitting(true)
    await updateDocumentContent(document.id, values as unknown as Record<string, unknown>)
    await updateDocumentStatus(document.id, 'completed')
    setSubmitting(false)
    onComplete()
  }

  const variants = {
    enter: (dir: number) => ({ x: dir * 40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: -dir * 40, opacity: 0 }),
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-1">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center flex-shrink-0">
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-display font-bold border transition-colors ${i < step ? 'bg-ks-lava border-ks-lava text-white' : i === step ? 'bg-ks-ink border-ks-ink text-white' : 'bg-white border-ks-rule text-ks-silver'}`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-[9px] font-body mt-1 whitespace-nowrap ${i === step ? 'text-ks-ink font-medium' : 'text-ks-silver'}`}>{label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`h-px w-5 sm:w-8 mb-4 mx-1 flex-shrink-0 ${i < step ? 'bg-ks-lava' : 'bg-ks-rule'}`} />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div key={step} custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2, ease: 'easeInOut' }}>

            {/* ── Step 0: Basics ── */}
            {step === 0 && (
              <div className="space-y-5">
                <h3 className="font-display font-bold text-[18px] text-ks-ink mb-1">Tell us about your business</h3>
                <p className="font-body text-[12px] text-ks-silver mb-5">Start with your business details and what service you're interested in.</p>
                <div>
                  <Label>Service you're enquiring about *</Label>
                  <select {...register('serviceType')} className={selectCls}>
                    <option value="">Select…</option>
                    {SERVICE_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                  <Err message={errors.serviceType?.message} />
                </div>
                <div>
                  <Label>Business Name *</Label>
                  <input {...register('businessName')} className={inputCls} placeholder="e.g. Acme Agency" />
                  <Err message={errors.businessName?.message} />
                </div>
                <div>
                  <Label>Tagline / Slogan</Label>
                  <input {...register('tagline')} className={inputCls} placeholder="e.g. Bold ideas, real results" />
                </div>
                <div>
                  <Label>What does your business do? *</Label>
                  <textarea {...register('businessDescription')} className={textareaCls} rows={3} placeholder="Describe your products or services and who you serve." />
                  <Err message={errors.businessDescription?.message} />
                </div>
                <div>
                  <Label>What sets you apart from competitors?</Label>
                  <textarea {...register('competitorDifference')} className={textareaCls} rows={2} placeholder="What makes you unique?" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Years in Business *</Label>
                    <select {...register('yearsInBusiness')} className={selectCls}>
                      <option value="">Select…</option>
                      {['Less than 1 year', '1–3 years', '3–5 years', '5–10 years', '10+ years'].map(o => <option key={o}>{o}</option>)}
                    </select>
                    <Err message={errors.yearsInBusiness?.message} />
                  </div>
                  <div>
                    <Label>Business Hours</Label>
                    <input {...register('businessHours')} className={inputCls} placeholder="e.g. Mon–Fri 8am–5pm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Contact Phone *</Label>
                    <input {...register('phone')} className={inputCls} placeholder="+27 82 000 0000" />
                    <Err message={errors.phone?.message} />
                  </div>
                  <div>
                    <Label>Business Email *</Label>
                    <input {...register('email')} className={inputCls} placeholder="hello@yourbusiness.com" />
                    <Err message={errors.email?.message} />
                  </div>
                </div>
                <div>
                  <Label>Business Address</Label>
                  <input {...register('address')} className={inputCls} placeholder="123 Main Street, Johannesburg" />
                </div>
                <div>
                  <Label>Social Media Handles</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <input {...register('socialMediaLinks.instagram')} className={inputCls} placeholder="Instagram" />
                    <input {...register('socialMediaLinks.linkedin')} className={inputCls} placeholder="LinkedIn" />
                    <input {...register('socialMediaLinks.facebook')} className={inputCls} placeholder="Facebook" />
                    <input {...register('socialMediaLinks.tiktok')} className={inputCls} placeholder="TikTok" />
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 1: Brand Identity ── */}
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="font-display font-bold text-[18px] text-ks-ink mb-1">Brand Identity</h3>
                <p className="font-body text-[12px] text-ks-silver mb-5">Upload your existing assets and tell us about your brand personality. All fields are optional.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Controller name="logoUrl" control={control} render={({ field }) => (
                    <FileUpload label="Current Logo" value={field.value ?? ''} onChange={v => field.onChange(v ?? '')} accept="image/*,.svg,.eps,.ai" documentId={document.id} fieldName="logo" hint="PNG, SVG, JPG — high res preferred" />
                  )} />
                  <Controller name="brandGuideUrl" control={control} render={({ field }) => (
                    <FileUpload label="Brand Guidelines / Style Guide" value={field.value ?? ''} onChange={v => field.onChange(v ?? '')} accept=".pdf,image/*" documentId={document.id} fieldName="brand_guide" hint="PDF or image of your brand guide" />
                  )} />
                </div>
                <div>
                  <Label>Tone of voice (select all that apply)</Label>
                  <Controller name="toneOfVoice" control={control} render={({ field }) => (
                    <Chips options={TONE_OPTIONS} value={field.value ?? []} onChange={field.onChange} />
                  )} />
                </div>
                <div>
                  <Label>Brand archetype</Label>
                  <Controller name="brandArchetype" control={control} render={({ field }) => (
                    <RadioGroup options={ARCHETYPE_OPTIONS} value={field.value ?? ''} onChange={field.onChange} />
                  )} />
                  <p className="font-body text-[10px] text-ks-silver mt-2">Not sure? Skip this — we'll explore it together in our meeting.</p>
                </div>
                <div>
                  <Label>Your brand story / origin</Label>
                  <textarea {...register('brandStory')} className={textareaCls} rows={3} placeholder="Why did you start this business? What's the story behind it?" />
                </div>
                <div>
                  <Label>Core values / mission</Label>
                  <textarea {...register('brandValues')} className={textareaCls} rows={2} placeholder="e.g. Integrity, Innovation, Community" />
                </div>
                <div>
                  <Label>What's wrong with your current brand identity? (if anything)</Label>
                  <textarea {...register('currentBrandIssues')} className={textareaCls} rows={2} placeholder="What do you dislike or want to change?" />
                </div>
              </div>
            )}

            {/* ── Step 2: Goals & Audience ── */}
            {step === 2 && (
              <div className="space-y-5">
                <h3 className="font-display font-bold text-[18px] text-ks-ink mb-1">Goals & Audience</h3>
                <p className="font-body text-[12px] text-ks-silver mb-5">Help us understand what success looks like and who we're speaking to.</p>
                <div>
                  <Label>Primary Goal *</Label>
                  <select {...register('primaryGoal')} className={selectCls}>
                    <option value="">Select…</option>
                    {['Generate leads', 'Sell products online', 'Build brand awareness', 'Provide information', 'Recruit talent', 'Showcase portfolio', 'Support existing customers', 'Launch a new product / service'].map(o => <option key={o}>{o}</option>)}
                  </select>
                  <Err message={errors.primaryGoal?.message} />
                </div>
                <div>
                  <Label>Who is your target audience? *</Label>
                  <textarea {...register('targetDemographics')} className={textareaCls} rows={3} placeholder="Age, location, profession, income level, interests, pain points…" />
                  <Err message={errors.targetDemographics?.message} />
                </div>
                <div>
                  <Label>What problem do you solve for them?</Label>
                  <textarea {...register('targetProblem')} className={textareaCls} rows={2} placeholder="What pain point or need do you address?" />
                </div>
                <div>
                  <Label>Why should they choose you over a competitor?</Label>
                  <textarea {...register('targetAdvantage')} className={textareaCls} rows={2} placeholder="Your key differentiator from the customer's perspective." />
                </div>
                <div>
                  <Label>What should visitors do on your site? * (max 3)</Label>
                  <Controller name="desiredVisitorActions" control={control} render={({ field }) => (
                    <Chips options={VISITOR_ACTIONS} value={field.value} onChange={field.onChange} max={3} />
                  )} />
                  <Err message={errors.desiredVisitorActions?.message} />
                </div>

                {/* Service-specific section */}
                {(isPerformanceService) && (
                  <div className="border border-ks-rule bg-ks-smoke p-4 rounded-ks space-y-4">
                    <p className="font-body font-medium text-[10px] uppercase tracking-[0.1em] text-ks-lava">Marketing Details</p>
                    <div>
                      <Label>Current / previous marketing channels</Label>
                      <Controller name="marketingChannels" control={control} render={({ field }) => (
                        <Chips options={MARKETING_CHANNELS} value={field.value ?? []} onChange={field.onChange} />
                      )} />
                    </div>
                    <div>
                      <Label>Monthly ad spend budget (ZAR)</Label>
                      <input {...register('monthlyAdBudget')} className={inputCls} placeholder="e.g. R5,000 / month" />
                    </div>
                    <div>
                      <Label>Previous campaigns — what worked? What didn't?</Label>
                      <textarea {...register('existingCampaigns')} className={textareaCls} rows={2} placeholder="Brief overview of past results." />
                    </div>
                  </div>
                )}
                {isSEO && (
                  <div className="border border-ks-rule bg-ks-smoke p-4 rounded-ks space-y-4">
                    <p className="font-body font-medium text-[10px] uppercase tracking-[0.1em] text-ks-lava">SEO Details</p>
                    <div>
                      <Label>Current website URL</Label>
                      <input {...register('currentWebsiteUrl')} className={inputCls} placeholder="https://yoursite.com" />
                    </div>
                    <div>
                      <Label>Target keywords (if known)</Label>
                      <textarea {...register('targetKeywords')} className={textareaCls} rows={2} placeholder="e.g. plumber johannesburg, emergency plumber sandton" />
                    </div>
                  </div>
                )}
                {isCopy && (
                  <div className="border border-ks-rule bg-ks-smoke p-4 rounded-ks space-y-4">
                    <p className="font-body font-medium text-[10px] uppercase tracking-[0.1em] text-ks-lava">Copywriting Details</p>
                    <div>
                      <Label>Content topics / pages needing copy</Label>
                      <textarea {...register('contentTopics')} className={textareaCls} rows={2} placeholder="e.g. Home, About, 5 service pages, 10 blog posts" />
                    </div>
                  </div>
                )}
                {isCustomDev && (
                  <div className="border border-ks-rule bg-ks-smoke p-4 rounded-ks space-y-4">
                    <p className="font-body font-medium text-[10px] uppercase tracking-[0.1em] text-ks-lava">Technical Context</p>
                    <div>
                      <Label>Existing systems / tech stack to integrate with</Label>
                      <textarea {...register('techStackNotes')} className={textareaCls} rows={2} placeholder="e.g. Current CRM is HubSpot, backend is PHP/Laravel, need API integration" />
                    </div>
                  </div>
                )}
                {isBrand && (
                  <div className="border border-ks-rule bg-ks-smoke p-4 rounded-ks space-y-4">
                    <p className="font-body font-medium text-[10px] uppercase tracking-[0.1em] text-ks-lava">Branding Context</p>
                    <div>
                      <Label>What triggered the need for a rebrand / new brand?</Label>
                      <textarea {...register('existingCampaigns')} className={textareaCls} rows={2} placeholder="e.g. Business pivot, new market, outgrown the old identity" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Step 3: Aesthetics ── */}
            {step === 3 && (
              <div className="space-y-5">
                <h3 className="font-display font-bold text-[18px] text-ks-ink mb-1">Aesthetics & Style</h3>
                <p className="font-body text-[12px] text-ks-silver mb-5">These preferences go directly into your design system brief.</p>
                <div>
                  <Label>Desired brand feel * (max 3)</Label>
                  <Controller name="desiredFeel" control={control} render={({ field }) => (
                    <Chips options={FEEL_OPTIONS} value={field.value} onChange={field.onChange} max={3} />
                  )} />
                  <Err message={errors.desiredFeel?.message} />
                </div>
                <div>
                  <Label>Typography feel</Label>
                  <Controller name="typographyFeel" control={control} render={({ field }) => (
                    <RadioGroup options={TYPOGRAPHY_OPTIONS} value={field.value ?? ''} onChange={field.onChange} />
                  )} />
                </div>
                <div>
                  <Label>Icon style</Label>
                  <Controller name="iconStyle" control={control} render={({ field }) => (
                    <RadioGroup options={ICON_OPTIONS} value={field.value ?? ''} onChange={field.onChange} />
                  )} />
                </div>
                <div>
                  <Label>Image / photography style</Label>
                  <Controller name="imageStyle" control={control} render={({ field }) => (
                    <RadioGroup options={IMAGE_OPTIONS} value={field.value ?? ''} onChange={field.onChange} />
                  )} />
                </div>
                <div>
                  <Label>UI layout density</Label>
                  <Controller name="uiDensity" control={control} render={({ field }) => (
                    <RadioGroup options={DENSITY_OPTIONS} value={field.value ?? ''} onChange={field.onChange} />
                  )} />
                </div>
                <div>
                  <Label>Design trends you like</Label>
                  <Controller name="designTrends" control={control} render={({ field }) => (
                    <Chips options={TREND_OPTIONS} value={field.value ?? []} onChange={field.onChange} />
                  )} />
                </div>
                <div>
                  <Label>Existing brand colours</Label>
                  <input {...register('brandColors')} className={inputCls} placeholder="e.g. Navy blue (#003366), gold (#FFD700)" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Colours you love</Label>
                    <input {...register('colorsYouLike')} className={inputCls} placeholder="e.g. Deep green, warm orange" />
                  </div>
                  <div>
                    <Label>Colours to avoid</Label>
                    <input {...register('colorsYouDislike')} className={inputCls} placeholder="e.g. Bright pink" />
                  </div>
                </div>
                <div>
                  <Label>Website references you admire (URLs, one per line)</Label>
                  <textarea {...register('websiteReferences')} className={textareaCls} rows={3} placeholder="https://example.com&#10;https://anothersite.com" />
                </div>
                <div>
                  <Label>Other inspiration links (social posts, campaigns, brands)</Label>
                  <textarea {...register('inspirationUrls')} className={textareaCls} rows={2} placeholder="Instagram posts, Behance links, Pinterest boards, etc." />
                </div>
                <div>
                  <Label>Upload inspiration images</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[0, 1, 2].map(i => (
                      <Controller key={i} name={`inspirationUploadUrls.${i}` as never} control={control} render={({ field }) => (
                        <FileUpload label={`Image ${i + 1}`} value={(field.value as string) ?? ''} onChange={v => field.onChange(v ?? '')} accept="image/*" documentId={document.id} fieldName={`inspiration_${i}`} />
                      )} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 4: Competitors ── */}
            {step === 4 && (
              <div className="space-y-5">
                <h3 className="font-display font-bold text-[18px] text-ks-ink mb-1">Competitors</h3>
                <p className="font-body text-[12px] text-ks-silver mb-5">
                  List your top competitors. This is one of the most valuable inputs for your design system and positioning strategy.
                </p>
                {competitorFields.map((field, i) => (
                  <div key={field.id} className="border border-ks-rule rounded-ks p-4 space-y-3">
                    <p className="font-body font-medium text-[10px] uppercase tracking-[0.1em] text-ks-lava">Competitor {i + 1}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Business name</Label>
                        <input {...register(`competitors.${i}.name`)} className={inputCls} placeholder="e.g. Acme Co" />
                      </div>
                      <div>
                        <Label>Website URL</Label>
                        <input {...register(`competitors.${i}.url`)} className={inputCls} placeholder="https://acme.co.za" />
                      </div>
                    </div>
                    <div>
                      <Label>What do they do well? (what you like)</Label>
                      <input {...register(`competitors.${i}.like`)} className={inputCls} placeholder="e.g. Clean design, great copy, strong social presence" />
                    </div>
                    <div>
                      <Label>What do they do poorly? (gap you can exploit)</Label>
                      <input {...register(`competitors.${i}.dislike`)} className={inputCls} placeholder="e.g. Slow site, no clear pricing, outdated branding" />
                    </div>
                  </div>
                ))}
                <p className="font-body text-[11px] text-ks-silver">If you have fewer than 3 competitors, leave the extra fields blank.</p>
              </div>
            )}

            {/* ── Step 5: Content ── */}
            {step === 5 && (
              <div className="space-y-5">
                <h3 className="font-display font-bold text-[18px] text-ks-ink mb-1">Content & Features</h3>
                <div>
                  <Label>Pages needed * (select all that apply)</Label>
                  <Controller name="standardPages" control={control} render={({ field }) => (
                    <Chips options={PAGE_OPTIONS} value={field.value} onChange={field.onChange} />
                  )} />
                  <Err message={errors.standardPages?.message} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label>Copy readiness *</Label>
                    <select {...register('copyReadiness')} className={selectCls}>
                      <option value="">Select…</option>
                      {['All copy ready', 'Partially ready', 'Need copywriting help', 'Starting from scratch'].map(o => <option key={o}>{o}</option>)}
                    </select>
                    <Err message={errors.copyReadiness?.message} />
                  </div>
                  <div>
                    <Label>Images readiness *</Label>
                    <select {...register('imagesReadiness')} className={selectCls}>
                      <option value="">Select…</option>
                      {['Have professional photos', 'Have some photos', 'Need stock photos', 'Need a photoshoot'].map(o => <option key={o}>{o}</option>)}
                    </select>
                    <Err message={errors.imagesReadiness?.message} />
                  </div>
                  <div>
                    <Label>Logo readiness *</Label>
                    <select {...register('logoReadiness')} className={selectCls}>
                      <option value="">Select…</option>
                      {['High-res ready', 'Have logo, check quality', 'No logo — need design'].map(o => <option key={o}>{o}</option>)}
                    </select>
                    <Err message={errors.logoReadiness?.message} />
                  </div>
                </div>
                <div>
                  <Label>Dynamic content needs</Label>
                  <input {...register('dynamicContentNeeds')} className={inputCls} placeholder="e.g. Staff directory, events calendar, product catalogue" />
                </div>
                <div>
                  <Label>Special features needed</Label>
                  <Controller name="specificFeatures" control={control} render={({ field }) => (
                    <Chips options={FEATURE_OPTIONS} value={field.value ?? []} onChange={field.onChange} />
                  )} />
                </div>
                {showEcommerce && (
                  <div className="border border-ks-lava/30 bg-orange-50/50 p-4 rounded-ks space-y-4">
                    <p className="font-body font-medium text-[10px] uppercase tracking-[0.1em] text-ks-lava">E-commerce Details</p>
                    <div>
                      <Label>Products / SKUs</Label>
                      <input {...register('ecommerceProducts')} className={inputCls} placeholder="e.g. 50 products, 3 variants each" />
                    </div>
                    <div>
                      <Label>Payment methods</Label>
                      <input {...register('ecommercePayments')} className={inputCls} placeholder="e.g. PayFast, Yoco, EFT, credit card" />
                    </div>
                    <div>
                      <Label>Shipping / delivery</Label>
                      <input {...register('ecommerceShipping')} className={inputCls} placeholder="e.g. Local only, flat rate, courier integration" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Step 6: Tech ── */}
            {step === 6 && (
              <div className="space-y-5">
                <h3 className="font-display font-bold text-[18px] text-ks-ink mb-1">Technical Setup</h3>
                <div>
                  <Label>Platform preference *</Label>
                  <select {...register('platformPreference')} className={selectCls}>
                    <option value="">Select…</option>
                    {['WordPress', 'Webflow', 'Shopify', 'Custom (React / Next.js)', 'No preference — recommend one'].map(o => <option key={o}>{o}</option>)}
                  </select>
                  <Err message={errors.platformPreference?.message} />
                </div>
                <div>
                  <Label>Do you own a domain? *</Label>
                  <div className="flex gap-3">
                    {['Yes', 'No'].map(opt => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" {...register('ownDomain')} value={opt} className="accent-ks-lava" />
                        <span className="font-body text-[13px] text-ks-slate">{opt}</span>
                      </label>
                    ))}
                  </div>
                  <Err message={errors.ownDomain?.message} />
                </div>
                {ownDomain === 'Yes' && (
                  <div>
                    <Label>Domain name</Label>
                    <input {...register('domainDetails')} className={inputCls} placeholder="e.g. yourbusiness.co.za" />
                  </div>
                )}
                <div>
                  <Label>Do you have hosting? *</Label>
                  <div className="flex gap-3">
                    {['Yes', 'No'].map(opt => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" {...register('haveHosting')} value={opt} className="accent-ks-lava" />
                        <span className="font-body text-[13px] text-ks-slate">{opt}</span>
                      </label>
                    ))}
                  </div>
                  <Err message={errors.haveHosting?.message} />
                </div>
                {haveHosting === 'Yes' && (
                  <div>
                    <Label>Hosting provider / details</Label>
                    <input {...register('hostingDetails')} className={inputCls} placeholder="e.g. Afrihost, cPanel, WP Engine" />
                  </div>
                )}
                <div>
                  <Label>Third-party integrations needed</Label>
                  <Controller name="thirdPartyIntegrations" control={control} render={({ field }) => (
                    <Chips options={INTEGRATION_OPTIONS} value={field.value ?? []} onChange={field.onChange} />
                  )} />
                </div>
              </div>
            )}

            {/* ── Step 7: Timeline & Meeting Prep ── */}
            {step === 7 && (
              <div className="space-y-5">
                <h3 className="font-display font-bold text-[18px] text-ks-ink mb-1">Timeline & Meeting Prep</h3>
                <p className="font-body text-[12px] text-ks-silver mb-5">This helps us make the most of our first meeting.</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Target launch / start date *</Label>
                    <input type="date" {...register('deadline')} className={inputCls} />
                    <Err message={errors.deadline?.message} />
                  </div>
                  <div>
                    <Label>Your availability *</Label>
                    <select {...register('availability')} className={selectCls}>
                      <option value="">Select…</option>
                      {['Less than 1 hour per week', '1–3 hours per week', '3–5 hours per week', 'Flexible / available as needed'].map(o => <option key={o}>{o}</option>)}
                    </select>
                    <Err message={errors.availability?.message} />
                  </div>
                </div>
                <div>
                  <Label>Why is this date important?</Label>
                  <input {...register('deadlineReason')} className={inputCls} placeholder="e.g. Product launch event, end of marketing campaign" />
                </div>
                <div>
                  <Label>Approximate project budget (ZAR)</Label>
                  <select {...register('projectBudget')} className={selectCls}>
                    <option value="">Prefer not to say / unsure</option>
                    {['Under R10,000', 'R10,000 – R25,000', 'R25,000 – R50,000', 'R50,000 – R100,000', 'R100,000+', 'Monthly retainer'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Who else is involved in the decision?</Label>
                  <input {...register('decisionMakers')} className={inputCls} placeholder="e.g. Just me / Partner + CFO / Full board approval needed" />
                </div>
                <div>
                  <Label>Previous experience with agencies / freelancers?</Label>
                  <textarea {...register('previousAgencyExperience')} className={textareaCls} rows={2} placeholder="What went well? What went wrong? What do you want done differently?" />
                </div>
                <div>
                  <Label>How did you find us?</Label>
                  <select {...register('howTheyFoundUs')} className={selectCls}>
                    <option value="">Select…</option>
                    {['Referral from someone I know', 'Google Search', 'Social Media (Instagram/LinkedIn)', 'Previous client', 'Online ad', 'Other'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <Label>How will you measure success?</Label>
                  <textarea {...register('successMetrics')} className={textareaCls} rows={2} placeholder="e.g. 20 leads/month, 5% conversion rate, rank #1 for 3 keywords" />
                </div>
                <div>
                  <Label>Budget for ongoing extras (hosting, stock, tools)</Label>
                  <input {...register('budgetExtras')} className={inputCls} placeholder="e.g. ~R500/month for hosting and tools" />
                </div>
              </div>
            )}

            {/* ── Step 8: Sign-Off ── */}
            {step === 8 && (
              <div className="space-y-5">
                <h3 className="font-display font-bold text-[18px] text-ks-ink mb-1">Almost done</h3>
                <div>
                  <Label>Anything else we should know?</Label>
                  <textarea {...register('additionalInfo')} className={textareaCls} rows={4} placeholder="Special requirements, concerns, or context that doesn't fit elsewhere." />
                </div>
                <div className="bg-ks-smoke border border-ks-rule p-5 rounded-ks">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <Controller name="confirmation" control={control} render={({ field }) => (
                      <input type="checkbox" checked={field.value === true} onChange={e => field.onChange(e.target.checked ? true : false as unknown as true)} className="mt-0.5 accent-ks-lava w-4 h-4 flex-shrink-0" />
                    )} />
                    <span className="font-body text-[12px] text-ks-slate leading-relaxed">
                      I confirm that the information provided is accurate and I am authorised to submit this project brief on behalf of my organisation.
                    </span>
                  </label>
                  <Err message={errors.confirmation?.message} />
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between items-center mt-8 pt-6 border-t border-ks-hairline">
          <button type="button" onClick={goBack} className={`font-body text-[12px] text-ks-silver hover:text-ks-ink transition-colors ${step === 0 ? 'invisible' : ''}`}>← Back</button>
          <div className="flex items-center gap-2">
            <span className="font-body text-[10px] text-ks-silver">{step + 1} / {STEPS.length}</span>
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={goNext} className="bg-ks-ink text-white font-display font-bold text-[12px] px-6 py-2.5 rounded-ks hover:bg-ks-lava transition-colors">Next →</button>
            ) : (
              <button type="submit" disabled={submitting} className="bg-ks-lava text-white font-display font-bold text-[12px] px-6 py-2.5 rounded-ks hover:opacity-90 transition-opacity disabled:opacity-50">
                {submitting ? 'Submitting…' : 'Submit Brief'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
