import { z } from 'zod'

export const questionnaireSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  tagline: z.string().default(''),
  businessDescription: z.string().min(1, 'Please describe your business'),
  competitorDifference: z.string().default(''),
  yearsInBusiness: z.string().min(1, 'Please select an option'),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Please enter a valid email'),
  address: z.string().default(''),
  businessHours: z.string().default(''),
  socialMediaLinks: z.object({
    instagram: z.string().default(''),
    linkedin: z.string().default(''),
    facebook: z.string().default(''),
    tiktok: z.string().default(''),
  }),

  primaryGoal: z.string().min(1, 'Please select a primary goal'),
  targetDemographics: z.string().min(1, 'Please describe your target audience'),
  targetProblem: z.string().default(''),
  targetAdvantage: z.string().default(''),
  desiredVisitorActions: z.array(z.string()).min(1, 'Select at least one action'),

  desiredFeel: z.array(z.string()).min(1, 'Select at least one style'),
  designTrends: z.array(z.string()).default([]),
  brandColors: z.string().default(''),
  colorsYouLike: z.string().default(''),
  colorsYouDislike: z.string().default(''),
  websiteReferences: z.string().default(''),

  standardPages: z.array(z.string()).min(1, 'Select at least one page'),
  copyReadiness: z.string().min(1, 'Please select an option'),
  imagesReadiness: z.string().min(1, 'Please select an option'),
  logoReadiness: z.string().min(1, 'Please select an option'),
  dynamicContentNeeds: z.string().default(''),
  specificFeatures: z.array(z.string()).default([]),
  ecommerceProducts: z.string().default(''),
  ecommercePayments: z.string().default(''),
  ecommerceShipping: z.string().default(''),

  platformPreference: z.string().min(1, 'Please select a platform'),
  ownDomain: z.string().min(1, 'Please select an option'),
  domainDetails: z.string().default(''),
  haveHosting: z.string().min(1, 'Please select an option'),
  hostingDetails: z.string().default(''),
  thirdPartyIntegrations: z.array(z.string()).default([]),

  deadline: z.string().min(1, 'Please provide a target date'),
  deadlineReason: z.string().default(''),
  availability: z.string().min(1, 'Please select an option'),
  budgetExtras: z.string().default(''),

  additionalInfo: z.string().default(''),
  confirmation: z.boolean().refine(v => v === true, { message: 'You must confirm to submit' }),
})

export type QuestionnaireFormValues = z.output<typeof questionnaireSchema>

export const STEP_FIELDS: Array<Array<keyof QuestionnaireFormValues>> = [
  ['businessName', 'businessDescription', 'yearsInBusiness', 'phone', 'email'],
  ['primaryGoal', 'targetDemographics', 'desiredVisitorActions'],
  ['desiredFeel'],
  ['standardPages', 'copyReadiness', 'imagesReadiness', 'logoReadiness', 'specificFeatures'],
  ['platformPreference', 'ownDomain', 'haveHosting'],
  ['deadline', 'availability'],
  ['confirmation'],
]
