export type ClientStatus = 'active' | 'inactive'
export type ProjectStatus = 'prospect' | 'active' | 'completed' | 'paused'
export type DocumentStatus = 'draft' | 'sent' | 'viewed' | 'approved' | 'signed' | 'rejected' | 'completed'
export type DocumentType = 'invoice' | 'quote' | 'proposal' | 'contract' | 'report' | 'audit' | 'email' | 'offboarding'
export type ServiceType = 'web' | 'digital_marketing' | 'brand' | 'google_ads' | 'social_media' | 'seo' | 'copywriting' | 'custom_dev' | 'plugins' | 'bpa' | 'other'
export type UserRole = 'admin' | 'client'

export interface Client {
  id: string
  created_at: string
  created_by: string
  company_name: string
  contact_name: string
  contact_email: string
  contact_phone: string
  address_line1: string
  address_line2?: string
  city: string
  province: string
  country: string
  registration_number?: string
  vat_number?: string
  industry: string
  logo_url?: string
  notes?: string
  status: ClientStatus
}

export interface Project {
  id: string
  client_id: string
  name: string
  service_type: ServiceType
  status: ProjectStatus
  start_date?: string
  end_date?: string
  value?: number
  notes?: string
}

export interface KSDocument {
  id: string
  created_at: string
  updated_at: string
  client_id: string
  project_id?: string
  type: DocumentType
  title: string
  status: DocumentStatus
  content: InvoiceContent | QuoteContent | ProposalContent | ContractContent | ReportContent | AuditContent | EmailContent | OffboardingContent | Record<string, unknown>
  reference_number: string
  sent_at?: string
  viewed_at?: string
  approved_at?: string
  signed_at?: string
  created_by: string
  client?: Client
}

export interface DocumentSignature {
  id: string
  document_id: string
  signer_name: string
  signer_email: string
  signed_at: string
  signature_value: string
}

export interface Profile {
  id: string
  role: UserRole
  client_id?: string
  full_name: string
}

// Document content schemas
export interface LineItem {
  id: string
  title: string
  description: string
  amount: number
}

export interface InvoiceContent {
  issue_date: string
  due_date: string
  payment_terms: string
  bank_details: { bank: string; account: string; branch: string }
  line_items: LineItem[]
  tax_rate: number
  notes: string
}

export interface QuoteContent {
  issue_date: string
  valid_until: string
  payment_terms: string
  bank_details: { bank: string; account: string; branch: string }
  line_items: LineItem[]
  tax_rate: number
  notes: string
}

export interface ContractContent {
  intro: string
  sections: Array<{ id: string; heading: string; body: string }>
  deliverables: string[]
  timeline: Array<{ id: string; milestone: string; date: string }>
  payment_terms: string
  total_value: number
  terms: string
}

export interface ReportSection {
  id: string
  micro: string
  heading: string
  type: 'text' | 'grid' | 'callout'
  body?: string
  items?: Array<{ id: string; t: string; b: string }>
}

export interface ReportContent {
  subtitle: string
  sections: ReportSection[]
}

export interface ProposalTimeline {
  id: string
  phase: string
  duration: string
  deliverable: string
}

export interface ProposalLineItem {
  id: string
  title: string
  amount: number
}

export interface ProposalContent {
  service_type?: ServiceType
  valid_until: string
  primary_goal: string
  page_count: number

  included_design: string[]
  included_technical: string[]
  included_training: string[]
  excluded_items: string[]
  revision_rounds: number
  revision_rate: number

  client_responsibilities: string[]

  timeline: ProposalTimeline[]
  total_timeline: string

  line_items: ProposalLineItem[]
  founders_mode: boolean
  founders_exchange: string[]
  client_costs: Array<{ id: string; title: string; cost: string }>

  deposit_percent: number

  terms: Array<{ id: string; heading: string; body: string }>
  next_steps: string[]
  validity_days: number
}

export interface AuditSection {
  id: string
  name: string
  score: number
  findings: string
  recommendations: string
}

export interface AuditContent {
  service_type: ServiceType
  tools_used: string[]
  sections: AuditSection[]
  summary: string
}

export interface OffboardingItem {
  id: string
  title: string
  detail: string
}

export interface OffboardingContent {
  project_summary: string
  delivered_items: OffboardingItem[]
  credentials: Array<{ id: string; service: string; note: string }>
  handover_notes: string
  next_steps: string[]
  support_terms: string
}

export interface EmailContent {
  subject: string
  greeting: string
  body_sections: Array<{ id: string; heading?: string; body: string }>
  cta?: { label: string; url: string }
}

// Wizard data shape
export interface WizardData {
  company_name: string
  industry: string
  website: string
  contact_name: string
  contact_email: string
  contact_phone: string
  address_line1: string
  address_line2: string
  city: string
  province: string
  country: string
  registration_number: string
  vat_number: string
  project_name: string
  service_type: ServiceType | ''
  project_value: string
  notes: string
}

export const SERVICE_LABELS: Record<ServiceType, string> = {
  web: 'Website Development',
  digital_marketing: 'Digital Marketing',
  brand: 'Brand & Content Marketing',
  google_ads: 'Google Ads Management',
  social_media: 'Social Media Advertising',
  seo: 'SEO',
  copywriting: 'Copywriting & Content Strategy',
  custom_dev: 'Custom Web & App Development',
  plugins: 'Custom Plugins & Integrations',
  bpa: 'Business Process Automation',
  other: 'Other',
}

export const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  invoice: 'Invoice',
  quote: 'Quote',
  proposal: 'Proposal',
  contract: 'Contract',
  report: 'Brand Report',
  audit: 'Audit Report',
  email: 'Email',
  offboarding: 'Offboarding',
}

export const DOC_TYPE_PREFIX: Record<DocumentType, string> = {
  invoice: 'INV',
  quote: 'QT',
  proposal: 'PROP',
  contract: 'CON',
  report: 'RPT',
  audit: 'AUD',
  email: 'EM',
  offboarding: 'OFB',
}

export const STATUS_COLORS: Record<DocumentStatus, string> = {
  draft: 'bg-ks-pebble text-ks-silver',
  sent: 'bg-blue-50 text-blue-600',
  viewed: 'bg-yellow-50 text-yellow-600',
  approved: 'bg-green-50 text-green-600',
  signed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-50 text-red-500',
  completed: 'bg-purple-50 text-purple-600',
}
