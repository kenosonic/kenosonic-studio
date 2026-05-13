import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useClient } from '../../hooks/useClient'
import { useDocuments, createDocument } from '../../hooks/useDocument'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { Button, MicroLabel } from '../../components/ui'
import { DOC_TYPE_LABELS, STATUS_COLORS, type DocumentType, type ServiceType, type ProposalContent, type AuditContent } from '../../types'

const PROPOSAL_SERVICES: { label: string; serviceType: ServiceType }[] = [
  { label: 'Website Development',      serviceType: 'web' },
  { label: 'Digital Marketing',        serviceType: 'digital_marketing' },
  { label: 'SEO',                      serviceType: 'seo' },
  { label: 'Brand & Content',          serviceType: 'brand' },
  { label: 'Google Ads',               serviceType: 'google_ads' },
  { label: 'Social Media Advertising', serviceType: 'social_media' },
  { label: 'Custom Development',       serviceType: 'custom_dev' },
]

const AUDIT_SERVICES: { label: string; serviceType: ServiceType }[] = [
  { label: 'Website Audit',            serviceType: 'web' },
  { label: 'SEO Audit',                serviceType: 'seo' },
  { label: 'Digital Marketing Audit',  serviceType: 'digital_marketing' },
  { label: 'Google Ads Audit',         serviceType: 'google_ads' },
  { label: 'Social Media Audit',       serviceType: 'social_media' },
  { label: 'Brand & Content Audit',    serviceType: 'brand' },
]

function getProposalContent(serviceType: ServiceType): ProposalContent {
  const sharedTerms = [
    { id: crypto.randomUUID(), heading: 'Ownership', body: 'Upon completion, you own all rights to the deliverables. Kenosonic Interactive retains the right to display the work in our portfolio.' },
    { id: crypto.randomUUID(), heading: 'Revisions', body: 'This proposal includes the agreed revision rounds. Additional rounds are billed at the stated hourly rate.' },
    { id: crypto.randomUUID(), heading: 'Timeline Delays', body: 'If content delivery or feedback is delayed by more than 7 days, the project timeline will be extended accordingly.' },
    { id: crypto.randomUUID(), heading: 'Cancellation', body: 'Either party may cancel with 7 days written notice. Work completed to that point remains your property.' },
    { id: crypto.randomUUID(), heading: 'Scope Changes', body: 'Any requests outside the defined scope will require a separate proposal and pricing.' },
  ]
  const sharedNext = [
    'Review this proposal and reach out with any questions',
    'Reply with "I accept the proposal as outlined" or sign below',
    'Complete the onboarding questionnaire we\'ll send through',
    'Provide all required assets within 5 business days of project start',
  ]
  const sharedFounders = [
    'A detailed testimonial upon project completion',
    'Permission to showcase this work in our portfolio',
    'Referrals to anyone you know who needs our services',
  ]
  const base = {
    service_type: serviceType,
    valid_until: '',
    page_count: 0,
    founders_mode: false,
    founders_exchange: sharedFounders,
    deposit_percent: 50,
    terms: sharedTerms,
    next_steps: sharedNext,
    validity_days: 14,
  }

  if (serviceType === 'web') return {
    ...base,
    page_count: 5,
    primary_goal: 'establish a professional online presence',
    included_design: [
      'Custom website design tailored to your brand',
      'Up to 5 pages (Home, About, Services, Portfolio, Contact)',
      'Mobile-responsive design across all devices',
      'Contact form with email notification setup',
      'Basic SEO optimisation (meta titles, descriptions, alt tags)',
      'Integration with your social media profiles',
      'Google Analytics setup',
    ],
    included_technical: [
      'SSL certificate installation (secure https://)',
      'Website speed optimisation',
      'Cross-browser compatibility testing',
    ],
    included_training: [
      'Video tutorial: how to update your content',
      '30 days of post-launch technical support (bug fixes only)',
    ],
    excluded_items: [
      'Logo design or branding materials',
      'Copywriting (writing website text)',
      'Photography or custom graphics',
      'E-commerce functionality',
      'Ongoing SEO or marketing services',
    ],
    revision_rounds: 2,
    revision_rate: 500,
    client_responsibilities: [
      'All website content (text, images, logos) within 5 business days of project start',
      'Timely feedback on designs (within 3 business days of each review request)',
      'Access to domain registrar and hosting accounts',
      'One primary point of contact for approvals',
    ],
    timeline: [
      { id: crypto.randomUUID(), phase: 'Discovery & Planning', duration: '3 days',  deliverable: 'Wireframes & sitemap approved' },
      { id: crypto.randomUUID(), phase: 'Design',               duration: '7 days',  deliverable: 'Homepage design approved' },
      { id: crypto.randomUUID(), phase: 'Development',          duration: '10 days', deliverable: 'Full site ready for review' },
      { id: crypto.randomUUID(), phase: 'Review & Revisions',   duration: '5 days',  deliverable: 'Final changes implemented' },
      { id: crypto.randomUUID(), phase: 'Launch',               duration: '2 days',  deliverable: 'Site goes live' },
    ],
    total_timeline: 'Approximately 4 weeks from content delivery to launch',
    line_items: [
      { id: crypto.randomUUID(), title: 'Website Design & Development', amount: 5000 },
      { id: crypto.randomUUID(), title: 'Technical Setup & Optimisation', amount: 1500 },
      { id: crypto.randomUUID(), title: 'Training & Documentation', amount: 500 },
    ],
    client_costs: [
      { id: crypto.randomUUID(), title: 'Domain name registration', cost: '~R150–300/year' },
      { id: crypto.randomUUID(), title: 'Web hosting', cost: '~R50–150/month' },
    ],
  }

  if (serviceType === 'digital_marketing') return {
    ...base,
    primary_goal: 'grow your online presence and generate qualified leads through targeted digital campaigns',
    included_design: [
      'Digital marketing strategy tailored to your business goals',
      'Target audience research and persona development',
      'Competitor analysis and market positioning',
      'Platform selection and channel strategy',
      'Campaign calendar and content planning',
    ],
    included_technical: [
      'Campaign setup across selected platforms',
      'Ad creative and copywriting',
      'Pixel, tag, and conversion tracking setup',
      'Landing page optimisation recommendations',
      'A/B testing of creatives and audiences',
    ],
    included_training: [
      'Monthly performance reports with actionable insights',
      'Campaign optimisation and budget management',
      '30-day post-campaign review',
    ],
    excluded_items: [
      'Paid ad spend / media budget (billed separately by platform)',
      'Website development or redesign',
      'Video production',
      'Influencer management',
      'PR and offline advertising',
    ],
    revision_rounds: 2,
    revision_rate: 500,
    client_responsibilities: [
      'Brand assets (logos, images, brand guide) within 3 business days',
      'Access to existing ad accounts and analytics',
      'Timely approval of ad creatives (within 2 business days)',
      'One primary point of contact for decisions',
    ],
    timeline: [
      { id: crypto.randomUUID(), phase: 'Strategy & Audit',   duration: '5 days',   deliverable: 'Strategy document approved' },
      { id: crypto.randomUUID(), phase: 'Campaign Setup',     duration: '7 days',   deliverable: 'All campaigns ready for review' },
      { id: crypto.randomUUID(), phase: 'Launch & Optimise',  duration: '30 days',  deliverable: 'Live campaigns with optimisation' },
      { id: crypto.randomUUID(), phase: 'Monthly Review',     duration: 'Ongoing',  deliverable: 'Performance report delivered' },
    ],
    total_timeline: 'Campaigns live within 2 weeks; ongoing monthly management thereafter',
    line_items: [
      { id: crypto.randomUUID(), title: 'Strategy & Campaign Setup', amount: 5000 },
      { id: crypto.randomUUID(), title: 'Monthly Campaign Management', amount: 4500 },
      { id: crypto.randomUUID(), title: 'Creative Production (per set)', amount: 2500 },
    ],
    client_costs: [
      { id: crypto.randomUUID(), title: 'Paid ad spend / media budget', cost: 'Client-managed (platform billed)' },
    ],
  }

  if (serviceType === 'seo') return {
    ...base,
    primary_goal: 'improve your search engine rankings and drive qualified organic traffic to your website',
    included_design: [
      'Comprehensive technical SEO audit',
      'Site speed and Core Web Vitals optimisation',
      'Mobile and crawlability fixes',
      'Schema markup implementation',
      'URL structure and redirect management',
    ],
    included_technical: [
      'Keyword research and targeting strategy',
      'On-page optimisation (titles, metas, headings, copy)',
      'Internal linking strategy',
      'Content gap analysis and recommendations',
      'Google Search Console and Analytics setup',
    ],
    included_training: [
      'Monthly SEO performance reports',
      'Rank tracking for targeted keywords',
      'Backlink profile analysis and link-building recommendations',
      'Quarterly strategy review',
    ],
    excluded_items: [
      'Paid search / Google Ads',
      'Content writing (available as add-on — R1,200/article)',
      'Website development or redesign',
      'Social media management',
      'PR outreach or link purchasing',
    ],
    revision_rounds: 2,
    revision_rate: 500,
    client_responsibilities: [
      'Access to website CMS (WordPress, Webflow, etc.)',
      'Access to Google Search Console and Analytics',
      'Access to domain registrar for technical changes',
      'Timely approval of on-page recommendations',
    ],
    timeline: [
      { id: crypto.randomUUID(), phase: 'SEO Audit & Strategy',    duration: '5 days',   deliverable: 'Audit report and strategy delivered' },
      { id: crypto.randomUUID(), phase: 'Technical Optimisation',  duration: '14 days',  deliverable: 'All technical fixes implemented' },
      { id: crypto.randomUUID(), phase: 'On-Page Optimisation',    duration: '21 days',  deliverable: 'All priority pages optimised' },
      { id: crypto.randomUUID(), phase: 'Monitoring & Reporting',  duration: 'Ongoing',  deliverable: 'Monthly reports delivered' },
    ],
    total_timeline: 'Initial optimisation complete within 6 weeks; ongoing management thereafter',
    line_items: [
      { id: crypto.randomUUID(), title: 'SEO Audit & Strategy', amount: 3500 },
      { id: crypto.randomUUID(), title: 'Monthly SEO Management', amount: 4000 },
    ],
    client_costs: [
      { id: crypto.randomUUID(), title: 'Content writing (optional add-on)', cost: '~R1,200/article' },
    ],
  }

  if (serviceType === 'brand') return {
    ...base,
    primary_goal: 'establish a strong, consistent brand identity that resonates with your target audience',
    included_design: [
      'Brand discovery workshop and brief',
      'Target audience and market positioning research',
      'Brand personality, values, and tone of voice',
      'Messaging framework and key differentiators',
      'Naming strategy and brand architecture (if applicable)',
    ],
    included_technical: [
      'Logo design (primary + horizontal + icon variations)',
      'Colour palette and typography system',
      'Business card and letterhead design',
      'Social media profile templates',
      'Email signature design',
    ],
    included_training: [
      'Brand guidelines document (PDF)',
      'All source files (AI, EPS, PNG, SVG)',
      'Brand introduction and handover session',
      '30 days of minor revision support',
    ],
    excluded_items: [
      'Website development',
      'Photography or video production',
      'Copywriting beyond brand messaging framework',
      'Print production costs',
      'Social media management or advertising',
    ],
    revision_rounds: 2,
    revision_rate: 600,
    client_responsibilities: [
      'Complete the brand discovery questionnaire before kickoff',
      'Provide reference brands and creative direction within 3 business days',
      'Ensure the key decision-maker is available for review sessions',
      'Consolidate all feedback into a single round per review stage',
    ],
    timeline: [
      { id: crypto.randomUUID(), phase: 'Discovery & Strategy',  duration: '5 days',  deliverable: 'Brand brief and positioning approved' },
      { id: crypto.randomUUID(), phase: 'Visual Concept',        duration: '10 days', deliverable: 'Logo concepts presented' },
      { id: crypto.randomUUID(), phase: 'Refinement',            duration: '7 days',  deliverable: 'Final logo and identity approved' },
      { id: crypto.randomUUID(), phase: 'Asset Production',      duration: '5 days',  deliverable: 'All files and brand guide delivered' },
    ],
    total_timeline: 'Approximately 4–5 weeks from brief approval to final delivery',
    line_items: [
      { id: crypto.randomUUID(), title: 'Brand Strategy & Discovery', amount: 4000 },
      { id: crypto.randomUUID(), title: 'Visual Identity Design', amount: 6500 },
      { id: crypto.randomUUID(), title: 'Brand Guidelines Document', amount: 2000 },
    ],
    client_costs: [],
  }

  if (serviceType === 'google_ads') return {
    ...base,
    primary_goal: 'generate high-quality leads and sales through targeted Google Search and Display advertising',
    included_design: [
      'Google Ads account setup or full audit',
      'Campaign and ad group structure design',
      'Keyword research and match type strategy',
      'Audience targeting and remarketing setup',
      'Conversion tracking and goal configuration',
    ],
    included_technical: [
      'Responsive search ad (RSA) copy creation',
      'Display ad creative and copy',
      'Negative keyword management',
      'Bid strategy and budget optimisation',
      'A/B testing of ad variants and landing pages',
    ],
    included_training: [
      'Weekly performance snapshots',
      'Monthly detailed performance and spend report',
      'Monthly strategy call',
      'Budget forecasting and ROAS tracking',
    ],
    excluded_items: [
      'Google Ads spend / media budget (client-managed, platform billed)',
      'Landing page design or development',
      'Social media advertising',
      'SEO or organic content strategy',
      'Graphic design beyond ad creatives',
    ],
    revision_rounds: 2,
    revision_rate: 500,
    client_responsibilities: [
      'Access to existing Google Ads account, or permission to create one',
      'Access to Google Analytics and Search Console',
      'Approved monthly ad spend budget (separate from management fee)',
      'Timely approval of ad creatives (within 2 business days)',
    ],
    timeline: [
      { id: crypto.randomUUID(), phase: 'Audit & Strategy',   duration: '3 days',  deliverable: 'Campaign structure and strategy approved' },
      { id: crypto.randomUUID(), phase: 'Campaign Build',     duration: '5 days',  deliverable: 'All campaigns ready for review' },
      { id: crypto.randomUUID(), phase: 'Launch',             duration: '1 day',   deliverable: 'Campaigns live' },
      { id: crypto.randomUUID(), phase: 'Optimisation Cycle', duration: '30 days', deliverable: 'First optimisation report delivered' },
    ],
    total_timeline: 'Campaigns live within 2 weeks; ongoing monthly optimisation thereafter',
    line_items: [
      { id: crypto.randomUUID(), title: 'Setup & Audit Fee', amount: 3500 },
      { id: crypto.randomUUID(), title: 'Monthly Management Fee', amount: 4000 },
      { id: crypto.randomUUID(), title: 'Creative Production (per campaign)', amount: 1500 },
    ],
    client_costs: [
      { id: crypto.randomUUID(), title: 'Google Ads media budget', cost: 'Client-managed (Google billed)' },
    ],
  }

  if (serviceType === 'social_media') return {
    ...base,
    primary_goal: 'reach your ideal audience and drive engagement, traffic, and conversions through paid social campaigns',
    included_design: [
      'Paid social advertising strategy',
      'Audience persona development and targeting map',
      'Creative brief and ad concept development',
      'Platform selection (Meta, TikTok, LinkedIn, etc.)',
      'Ad copy and graphic design',
    ],
    included_technical: [
      'Business Manager and ad account setup',
      'Pixel installation and event tracking',
      'Campaign setup, targeting, and budgeting',
      'Retargeting and lookalike audience setup',
      'A/B testing of audiences, creatives, and copy',
    ],
    included_training: [
      'Weekly campaign performance snapshots',
      'Monthly detailed report with insights',
      'Creative refresh recommendations',
      'Quarterly strategic review',
    ],
    excluded_items: [
      'Paid ad spend / media budget (client-managed, platform billed)',
      'Organic social media management or posting',
      'Photography or video production',
      'Website development',
      'Google Ads management',
    ],
    revision_rounds: 2,
    revision_rate: 500,
    client_responsibilities: [
      'Admin access to Facebook/Instagram Business Manager',
      'Approved monthly ad spend budget (separate from management fee)',
      'Brand assets (logos, photos, video) within 3 business days',
      'Timely approval of ad creatives (within 2 business days)',
    ],
    timeline: [
      { id: crypto.randomUUID(), phase: 'Strategy & Setup',        duration: '5 days',  deliverable: 'Strategy approved and accounts configured' },
      { id: crypto.randomUUID(), phase: 'Creative Production',     duration: '7 days',  deliverable: 'Ad creatives approved' },
      { id: crypto.randomUUID(), phase: 'Launch',                  duration: '1 day',   deliverable: 'Campaigns live' },
      { id: crypto.randomUUID(), phase: 'Optimisation Cycle',      duration: '30 days', deliverable: 'First optimisation cycle complete' },
    ],
    total_timeline: 'Campaigns live within 2 weeks; ongoing monthly management thereafter',
    line_items: [
      { id: crypto.randomUUID(), title: 'Strategy & Account Setup', amount: 3500 },
      { id: crypto.randomUUID(), title: 'Monthly Campaign Management', amount: 4500 },
      { id: crypto.randomUUID(), title: 'Creative Production (per set)', amount: 2000 },
    ],
    client_costs: [
      { id: crypto.randomUUID(), title: 'Paid ad spend / media budget', cost: 'Client-managed (platform billed)' },
    ],
  }

  // custom_dev + fallback
  return {
    ...base,
    service_type: serviceType,
    primary_goal: 'build a robust, scalable technical solution tailored to your business requirements',
    included_design: [
      'Technical requirements discovery and scoping',
      'System architecture and database design',
      'API design and integration planning',
      'Project roadmap and milestone definition',
    ],
    included_technical: [
      'Full-stack development to agreed specifications',
      'Third-party API and platform integrations',
      'Code review and quality assurance testing',
      'Performance and security testing',
    ],
    included_training: [
      'Deployment to staging and production environments',
      'Technical documentation and handover',
      '30 days of post-launch bug fix support',
    ],
    excluded_items: [
      'Hosting and infrastructure costs',
      'Third-party service subscription fees',
      'Ongoing feature development beyond scope',
      'Content entry or data migration',
    ],
    revision_rounds: 2,
    revision_rate: 600,
    client_responsibilities: [
      'Detailed technical brief or functional specification',
      'Access to existing systems and APIs (if applicable)',
      'Timely feedback on prototypes and milestones',
      'One primary technical point of contact',
    ],
    timeline: [
      { id: crypto.randomUUID(), phase: 'Discovery & Scoping',   duration: '5 days',  deliverable: 'Technical spec approved' },
      { id: crypto.randomUUID(), phase: 'Architecture & Design',  duration: '7 days',  deliverable: 'Architecture document approved' },
      { id: crypto.randomUUID(), phase: 'Development',           duration: '21 days', deliverable: 'Build complete, ready for QA' },
      { id: crypto.randomUUID(), phase: 'Testing & QA',          duration: '7 days',  deliverable: 'QA sign-off' },
      { id: crypto.randomUUID(), phase: 'Deployment',            duration: '3 days',  deliverable: 'Live in production' },
    ],
    total_timeline: 'Approximately 6–8 weeks depending on complexity',
    line_items: [
      { id: crypto.randomUUID(), title: 'Discovery & Architecture', amount: 5000 },
      { id: crypto.randomUUID(), title: 'Development', amount: 15000 },
      { id: crypto.randomUUID(), title: 'Testing, QA & Deployment', amount: 3000 },
    ],
    client_costs: [
      { id: crypto.randomUUID(), title: 'Hosting and infrastructure', cost: 'Client-managed' },
    ],
  }
}

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>()
  const { client, loading } = useClient(id)
  const { documents } = useDocuments(id)
  const { user } = useAuth()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [showDocMenu, setShowDocMenu] = useState(false)
  const [showProposalSub, setShowProposalSub] = useState(false)
  const [showAuditSub, setShowAuditSub] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)
  const [sendingInvite, setSendingInvite] = useState(false)
  const [inviteError, setInviteError] = useState('')

  async function handleSendInvite() {
    if (!client) return
    setSendingInvite(true)
    setInviteError('')
    setInviteSent(false)
    try {
      const { data, error } = await supabase
        .from('invites')
        .insert({ client_id: client.id })
        .select('token')
        .single()
      if (error || !data) throw new Error('Could not create invite')
      const { error: fnError } = await supabase.functions.invoke('send-document', {
        body: { action: 'send-invite', document_id: null, invite_token: data.token },
      })
      if (fnError) throw fnError
      setInviteSent(true)
      setTimeout(() => setInviteSent(false), 4000)
    } catch (err: unknown) {
      setInviteError(err instanceof Error ? err.message : 'Failed to send invite')
    } finally {
      setSendingInvite(false)
    }
  }

  async function handleCreateProposal(serviceType: ServiceType) {
    if (!client || !user) return
    setCreating(true)
    setShowDocMenu(false)
    setShowProposalSub(false)
    const content = getProposalContent(serviceType)
    const doc = await createDocument(
      client.id,
      'proposal',
      `Proposal — ${client.company_name}`,
      content as unknown as Record<string, unknown>,
      user.id,
    )
    setCreating(false)
    navigate(`/admin/documents/${doc.id}`)
  }

  async function handleCreateAudit(serviceType: ServiceType) {
    if (!client || !user) return
    setCreating(true)
    setShowDocMenu(false)
    setShowAuditSub(false)
    const content: AuditContent = { service_type: serviceType, tools_used: [], sections: [], summary: '' }
    const doc = await createDocument(
      client.id,
      'audit',
      `Audit Report — ${client.company_name}`,
      content as unknown as Record<string, unknown>,
      user.id,
    )
    setCreating(false)
    navigate(`/admin/documents/${doc.id}`)
  }

  async function handleCreateDoc(type: DocumentType) {
    if (!client || !user) return
    setCreating(true)
    setShowDocMenu(false)

    const defaultContent = {
      invoice: {
        issue_date: new Date().toISOString().split('T')[0],
        due_date: '',
        payment_terms: 'EFT / Bank Transfer',
        bank_details: { bank: 'FNB', account: '', branch: '' },
        line_items: [{ id: crypto.randomUUID(), title: 'Service', description: 'Description', amount: 0 }],
        tax_rate: 15,
        notes: '',
      },
      quote: {
        issue_date: new Date().toISOString().split('T')[0],
        valid_until: '',
        payment_terms: 'EFT / Bank Transfer',
        bank_details: { bank: 'FNB', account: '', branch: '' },
        line_items: [{ id: crypto.randomUUID(), title: 'Service', description: 'Description', amount: 0 }],
        tax_rate: 15,
        notes: '',
      },
      report: {
        subtitle: 'Brand & Storytelling Analysis',
        sections: [
          { id: crypto.randomUUID(), micro: 'Strategic Foundation', heading: 'Core Positioning', type: 'text', body: 'Write your analysis here.' },
          { id: crypto.randomUUID(), micro: 'Core Insight', heading: 'Strategic Genius', type: 'callout', body: 'Write your key insight here.' },
        ],
      },
      contract: { intro: '', sections: [], signature_block: {} },
      email: { subject: '', greeting: `Hi ${client.contact_name},`, body_sections: [{ id: crypto.randomUUID(), body: '' }], cta: undefined },
      offboarding: {
        project_summary: `Thank you for working with Kenosonic Interactive. This document summarises the work delivered for ${client.company_name}.`,
        delivered_items: [{ id: crypto.randomUUID(), title: 'Project Deliverable', detail: 'See details below.' }],
        credentials: [],
        handover_notes: '',
        next_steps: ['Review all delivered assets', 'Confirm access to all platforms', 'Reach out within 14 days if you notice any issues'],
        support_terms: 'Post-project support is available on request at our standard hourly rate.',
      },
      questionnaire: {
        businessName: client.company_name,
        email: client.contact_email,
        phone: client.contact_phone,
        tagline: '', businessDescription: '', competitorDifference: '', yearsInBusiness: '',
        address: '', businessHours: '',
        socialMediaLinks: { instagram: '', linkedin: '', facebook: '', tiktok: '' },
        primaryGoal: '', targetDemographics: '', targetProblem: '', targetAdvantage: '',
        desiredVisitorActions: [], desiredFeel: [], designTrends: [],
        brandColors: '', colorsYouLike: '', colorsYouDislike: '', websiteReferences: '',
        standardPages: [], copyReadiness: '', imagesReadiness: '', logoReadiness: '',
        dynamicContentNeeds: '', specificFeatures: [],
        platformPreference: '', ownDomain: '', haveHosting: '', thirdPartyIntegrations: [],
        deadline: '', deadlineReason: '', availability: '', budgetExtras: '',
        additionalInfo: '', confirmation: false,
      },
    }

    const doc = await createDocument(
      client.id,
      type,
      `${DOC_TYPE_LABELS[type]} — ${client.company_name}`,
      defaultContent[type as keyof typeof defaultContent],
      user.id,
    )
    setCreating(false)
    navigate(`/admin/documents/${doc.id}`)
  }

  if (loading) return <div className="px-4 sm:px-10 py-10 text-ks-silver font-body text-[12px]">Loading...</div>
  if (!client) return <div className="px-4 sm:px-10 py-10 text-ks-silver font-body text-[12px]">Client not found.</div>

  return (
    <div className="px-4 sm:px-10 py-6 sm:py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Link to="/admin/clients" className="font-body text-[11px] text-ks-silver hover:text-ks-lava">Clients</Link>
        <span className="text-ks-silver text-[11px]">/</span>
        <span className="font-body text-[11px] text-ks-ink truncate">{client.company_name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="min-w-0">
          <MicroLabel>{client.industry}</MicroLabel>
          <h2 className="font-display font-bold text-[22px] sm:text-[26px] tracking-[-0.02em] text-ks-ink mt-1 truncate">{client.company_name}</h2>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={handleSendInvite} disabled={sendingInvite}>
            {sendingInvite ? 'Sending…' : inviteSent ? 'Invite Sent ✓' : 'Send Invite'}
          </Button>
          <div className="relative">
            <Button variant="dark" onClick={() => setShowDocMenu(v => !v)} disabled={creating}>
              {creating ? 'Creating…' : '+ New Document'}
            </Button>
            {showDocMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-ks-hairline shadow-sm z-10 w-52 rounded-ks overflow-hidden">
                {/* Invoice + Quote */}
                {(['invoice', 'quote'] as DocumentType[]).map(type => (
                  <button key={type} onClick={() => handleCreateDoc(type)}
                    className="w-full text-left px-4 py-3 font-body text-[12px] text-ks-slate hover:bg-ks-smoke transition-colors border-b border-ks-hairline">
                    {DOC_TYPE_LABELS[type]}
                  </button>
                ))}

                {/* Proposal — expandable */}
                <button
                  onClick={() => setShowProposalSub(v => !v)}
                  className="w-full text-left px-4 py-3 font-body text-[12px] text-ks-slate hover:bg-ks-smoke transition-colors border-b border-ks-hairline flex items-center justify-between"
                >
                  <span>Proposal</span>
                  <span className="text-ks-silver text-[9px]">{showProposalSub ? '▲' : '▶'}</span>
                </button>
                {showProposalSub && PROPOSAL_SERVICES.map(svc => (
                  <button key={svc.serviceType} onClick={() => handleCreateProposal(svc.serviceType)}
                    className="w-full text-left pl-7 pr-4 py-2.5 font-body text-[11px] text-ks-slate hover:bg-ks-smoke transition-colors border-b border-ks-hairline flex items-center gap-2">
                    <span className="text-ks-lava text-[8px] flex-shrink-0">›</span>
                    {svc.label}
                  </button>
                ))}

                {/* Contract + Report */}
                {(['contract', 'report'] as DocumentType[]).map(type => (
                  <button key={type} onClick={() => handleCreateDoc(type)}
                    className="w-full text-left px-4 py-3 font-body text-[12px] text-ks-slate hover:bg-ks-smoke transition-colors border-b border-ks-hairline">
                    {DOC_TYPE_LABELS[type]}
                  </button>
                ))}

                {/* Audit — expandable */}
                <button
                  onClick={() => setShowAuditSub(v => !v)}
                  className="w-full text-left px-4 py-3 font-body text-[12px] text-ks-slate hover:bg-ks-smoke transition-colors border-b border-ks-hairline flex items-center justify-between"
                >
                  <span>Audit Report</span>
                  <span className="text-ks-silver text-[9px]">{showAuditSub ? '▲' : '▶'}</span>
                </button>
                {showAuditSub && AUDIT_SERVICES.map(svc => (
                  <button key={svc.serviceType} onClick={() => handleCreateAudit(svc.serviceType)}
                    className="w-full text-left pl-7 pr-4 py-2.5 font-body text-[11px] text-ks-slate hover:bg-ks-smoke transition-colors border-b border-ks-hairline flex items-center gap-2">
                    <span className="text-ks-lava text-[8px] flex-shrink-0">›</span>
                    {svc.label}
                  </button>
                ))}

                {/* Email + Offboarding + Questionnaire */}
                {(['email', 'offboarding', 'questionnaire'] as DocumentType[]).map(type => (
                  <button key={type} onClick={() => handleCreateDoc(type)}
                    className="w-full text-left px-4 py-3 font-body text-[12px] text-ks-slate hover:bg-ks-smoke transition-colors border-b border-ks-hairline last:border-b-0">
                    {DOC_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invite feedback */}
      {inviteError && (
        <div className="bg-red-50 border border-red-200 px-5 py-3 mb-6">
          <p className="font-body text-[11px] text-red-600">{inviteError}</p>
        </div>
      )}

      {/* Client info stat bar — 2×2 on mobile, row on desktop */}
      <div className="grid grid-cols-2 sm:flex border border-ks-rule mb-8" style={{ backgroundColor: '#E8E5E0' }}>
        <div className="p-4 sm:p-5 border-r border-b sm:border-b-0 border-ks-rule sm:flex-1">
          <MicroLabel color="silver" className="block mb-1">Contact</MicroLabel>
          <p className="font-display font-bold text-[12px] sm:text-[13px] text-ks-ink">{client.contact_name}</p>
          <p className="font-body text-[10px] sm:text-[11px] text-ks-silver truncate">{client.contact_email}</p>
        </div>
        <div className="p-4 sm:p-5 border-b sm:border-b-0 sm:border-r border-ks-rule sm:flex-1">
          <MicroLabel color="silver" className="block mb-1">Location</MicroLabel>
          <p className="font-body text-[12px] text-ks-slate">{client.city}, {client.province}</p>
          <p className="font-body text-[10px] sm:text-[11px] text-ks-silver truncate">{client.address_line1}</p>
        </div>
        <div className="p-4 sm:p-5 border-r border-ks-rule sm:flex-1">
          <MicroLabel color="silver" className="block mb-1">Reg. No.</MicroLabel>
          <p className="font-body text-[12px] text-ks-slate">{client.registration_number ?? '—'}</p>
        </div>
        <div className="p-4 sm:p-5 sm:flex-1">
          <MicroLabel color="silver" className="block mb-1">VAT No.</MicroLabel>
          <p className="font-body text-[12px] text-ks-slate">{client.vat_number ?? '—'}</p>
        </div>
      </div>

      {/* Documents */}
      <div>
        <MicroLabel className="block mb-4">Documents</MicroLabel>

        {documents.length === 0 ? (
          <div className="bg-white border border-ks-hairline p-12 text-center">
            <p className="font-body text-[12px] text-ks-silver">No documents yet. Use the button above to create one.</p>
          </div>
        ) : (
          <div className="bg-white border border-ks-hairline">
            {documents.map((doc, i) => (
              <Link
                key={doc.id}
                to={`/admin/documents/${doc.id}`}
                className={`flex items-start sm:items-center justify-between px-4 sm:px-6 py-4 hover:bg-ks-smoke transition-colors gap-3 ${i < documents.length - 1 ? 'border-b border-ks-hairline' : ''}`}
              >
                <div className="min-w-0">
                  <p className="font-display font-bold text-[13px] text-ks-ink truncate">{doc.title}</p>
                  <p className="font-body text-[11px] text-ks-silver mt-0.5">{doc.reference_number}</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                  <span className="hidden sm:block font-body text-[10px] text-ks-silver">{DOC_TYPE_LABELS[doc.type]}</span>
                  <span className={`font-body font-medium text-[9px] uppercase tracking-[0.1em] px-2.5 py-1 rounded-ks ${STATUS_COLORS[doc.status]}`}>
                    {doc.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
