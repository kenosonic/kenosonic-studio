import { z } from 'zod'

const competitor = z.object({
  name: z.string().default(''),
  url: z.string().default(''),
  like: z.string().default(''),
  dislike: z.string().default(''),
})

export const questionnaireSchema = z.object({
  // Step 1
  serviceType: z.string().min(1, 'Please select a service'),
  businessName: z.string().min(1, 'Business name is required'),
  tagline: z.string().optional(),
  businessDescription: z.string().min(1, 'Please describe your business'),
  competitorDifference: z.string().optional(),
  yearsInBusiness: z.string().min(1, 'Please select an option'),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Please enter a valid email'),
  address: z.string().optional(),
  businessHours: z.string().optional(),
  socialMediaLinks: z.object({
    instagram: z.string().optional(),
    linkedin: z.string().optional(),
    facebook: z.string().optional(),
    tiktok: z.string().optional(),
  }),

  // Step 2
  logoUrl: z.string().optional(),
  brandGuideUrl: z.string().optional(),
  toneOfVoice: z.array(z.string()).optional(),
  brandArchetype: z.string().optional(),
  brandStory: z.string().optional(),
  brandValues: z.string().optional(),
  currentBrandIssues: z.string().optional(),

  // Step 3
  primaryGoal: z.string().min(1, 'Please select a primary goal'),
  targetDemographics: z.string().min(1, 'Please describe your target audience'),
  targetProblem: z.string().optional(),
  targetAdvantage: z.string().optional(),
  desiredVisitorActions: z.array(z.string()).min(1, 'Select at least one action'),
  marketingChannels: z.array(z.string()).optional(),
  monthlyAdBudget: z.string().optional(),
  existingCampaigns: z.string().optional(),
  currentWebsiteUrl: z.string().optional(),
  targetKeywords: z.string().optional(),
  contentTopics: z.string().optional(),
  techStackNotes: z.string().optional(),

  // Step 4
  desiredFeel: z.array(z.string()).min(1, 'Select at least one style'),
  designTrends: z.array(z.string()).optional(),
  typographyFeel: z.string().optional(),
  iconStyle: z.string().optional(),
  imageStyle: z.string().optional(),
  uiDensity: z.string().optional(),
  inspirationUrls: z.string().optional(),
  inspirationUploadUrls: z.array(z.string()).optional(),
  brandColors: z.string().optional(),
  colorsYouLike: z.string().optional(),
  colorsYouDislike: z.string().optional(),
  websiteReferences: z.string().optional(),

  // Step 5
  competitors: z.array(competitor).optional(),

  // Step 6
  standardPages: z.array(z.string()).min(1, 'Select at least one page'),
  copyReadiness: z.string().min(1, 'Please select an option'),
  imagesReadiness: z.string().min(1, 'Please select an option'),
  logoReadiness: z.string().min(1, 'Please select an option'),
  dynamicContentNeeds: z.string().optional(),
  specificFeatures: z.array(z.string()).optional(),
  ecommerceProducts: z.string().optional(),
  ecommercePayments: z.string().optional(),
  ecommerceShipping: z.string().optional(),

  // Step 7
  platformPreference: z.string().min(1, 'Please select a platform'),
  ownDomain: z.string().min(1, 'Please select an option'),
  domainDetails: z.string().optional(),
  haveHosting: z.string().min(1, 'Please select an option'),
  hostingDetails: z.string().optional(),
  thirdPartyIntegrations: z.array(z.string()).optional(),

  // Step 8
  deadline: z.string().min(1, 'Please provide a target date'),
  deadlineReason: z.string().optional(),
  availability: z.string().min(1, 'Please select an option'),
  budgetExtras: z.string().optional(),
  projectBudget: z.string().optional(),
  decisionMakers: z.string().optional(),
  previousAgencyExperience: z.string().optional(),
  howTheyFoundUs: z.string().optional(),
  successMetrics: z.string().optional(),

  // Step 9
  additionalInfo: z.string().optional(),
  confirmation: z.boolean().refine(v => v === true, { message: 'You must confirm to submit' }),
})

export type QuestionnaireFormValues = z.output<typeof questionnaireSchema>

export const STEP_FIELDS: Array<Array<keyof QuestionnaireFormValues>> = [
  ['serviceType', 'businessName', 'businessDescription', 'yearsInBusiness', 'phone', 'email'],
  [],  // Brand Identity — all optional uploads, no required fields
  ['primaryGoal', 'targetDemographics', 'desiredVisitorActions'],
  ['desiredFeel'],
  [],  // Competitors — all optional
  ['standardPages', 'copyReadiness', 'imagesReadiness', 'logoReadiness'],
  ['platformPreference', 'ownDomain', 'haveHosting'],
  ['deadline', 'availability'],
  ['confirmation'],
]
