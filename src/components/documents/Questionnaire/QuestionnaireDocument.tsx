import type { KSDocument, Client, QuestionnaireContent, QuestionnaireCompetitor } from '../../../types'
import { DocumentShell } from '../DocumentShell'

interface Props {
  document: KSDocument
  client: Client
}

function Row({ label, value }: { label: string; value?: string | string[] | boolean | Record<string, string> | null }) {
  if (value === null || value === undefined || value === '' || value === false) return null
  if (Array.isArray(value) && value.length === 0) return null

  let display: React.ReactNode

  if (typeof value === 'boolean') {
    display = <span className="font-body text-[12px] text-green-600 font-medium">✓ Confirmed</span>
  } else if (Array.isArray(value)) {
    display = (
      <div className="flex flex-wrap gap-1.5">
        {value.map((v, i) => (
          <span key={i} className="px-2 py-1 bg-ks-smoke border border-ks-rule text-ks-slate text-[10px] font-body rounded-ks">{v}</span>
        ))}
      </div>
    )
  } else if (typeof value === 'object') {
    const entries = Object.entries(value).filter(([, v]) => v)
    if (entries.length === 0) return null
    display = (
      <div className="space-y-0.5">
        {entries.map(([k, v]) => (
          <p key={k} className="font-body text-[12px] text-ks-slate"><span className="text-ks-silver capitalize">{k}:</span> {v}</p>
        ))}
      </div>
    )
  } else {
    display = <p className="font-body text-[12px] text-ks-slate whitespace-pre-line">{value}</p>
  }

  return (
    <div className="grid grid-cols-[160px_1fr] gap-4 py-3 border-b border-ks-hairline last:border-0">
      <p className="font-body font-medium text-[10px] uppercase tracking-[0.1em] text-ks-silver pt-0.5">{label}</p>
      <div>{display}</div>
    </div>
  )
}

function FileRow({ label, url }: { label: string; url?: string | null }) {
  if (!url) return null
  const isImage = !/\.pdf(\?|$)/i.test(url)
  const filename = decodeURIComponent(url.split('/').pop()?.split('?')[0] ?? '')
  return (
    <div className="grid grid-cols-[160px_1fr] gap-4 py-3 border-b border-ks-hairline last:border-0">
      <p className="font-body font-medium text-[10px] uppercase tracking-[0.1em] text-ks-silver pt-0.5">{label}</p>
      <div>
        {isImage ? (
          <div className="space-y-1.5">
            <img src={url} alt={label} className="max-h-28 max-w-full object-contain rounded border border-ks-rule" />
            <a href={url} target="_blank" rel="noreferrer" className="font-body text-[10px] text-ks-lava hover:opacity-70 transition-opacity block">View full size ↗</a>
          </div>
        ) : (
          <a href={url} target="_blank" rel="noreferrer" className="font-body text-[11px] text-ks-lava hover:opacity-70 transition-opacity flex items-center gap-1.5">
            <span>📄</span> {filename}
          </a>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <p className="font-body font-medium text-[9px] uppercase tracking-[0.15em] text-ks-lava mb-3">{title}</p>
      <div className="border border-ks-hairline bg-white px-4">{children}</div>
    </div>
  )
}

function CompetitorTable({ competitors }: { competitors: QuestionnaireCompetitor[] }) {
  const filled = competitors.filter(c => c.name || c.url)
  if (filled.length === 0) return null
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-ks-hairline">
            <th className="font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-silver py-2 pr-4 w-[140px]">Name</th>
            <th className="font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-silver py-2 pr-4">URL</th>
            <th className="font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-silver py-2 pr-4">What they like</th>
            <th className="font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-silver py-2">What they dislike</th>
          </tr>
        </thead>
        <tbody>
          {filled.map((c, i) => (
            <tr key={i} className="border-b border-ks-hairline last:border-0">
              <td className="font-body text-[12px] text-ks-slate py-2.5 pr-4">{c.name || '—'}</td>
              <td className="font-body text-[11px] py-2.5 pr-4">
                {c.url ? (
                  <a href={c.url.startsWith('http') ? c.url : `https://${c.url}`} target="_blank" rel="noreferrer" className="text-ks-lava hover:opacity-70 transition-opacity truncate block max-w-[160px]">{c.url}</a>
                ) : '—'}
              </td>
              <td className="font-body text-[12px] text-ks-slate py-2.5 pr-4">{c.like || '—'}</td>
              <td className="font-body text-[12px] text-ks-slate py-2.5">{c.dislike || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function QuestionnaireDocument({ document, client }: Props) {
  if (document.status !== 'completed') {
    return (
      <div className="bg-white border border-ks-hairline p-16 text-center max-w-[850px]">
        <div className="w-10 h-10 rounded-full bg-ks-smoke border border-ks-rule flex items-center justify-center mx-auto mb-4">
          <span className="text-ks-silver text-[16px]">?</span>
        </div>
        <p className="font-display font-bold text-[15px] text-ks-ink mb-2">Awaiting Response</p>
        <p className="font-body text-[12px] text-ks-silver">The client brief will appear here once the client has submitted the questionnaire.</p>
        {document.sent_at && (
          <p className="font-body text-[11px] text-ks-silver mt-3">
            Sent {new Date(document.sent_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}
      </div>
    )
  }

  const c = document.content as QuestionnaireContent

  const hasServiceSpecific = !!(
    (c.marketingChannels && c.marketingChannels.length > 0) ||
    c.monthlyAdBudget || c.existingCampaigns || c.currentWebsiteUrl ||
    c.targetKeywords || c.contentTopics || c.techStackNotes
  )

  const hasInspirationUploads = c.inspirationUploadUrls && c.inspirationUploadUrls.filter(Boolean).length > 0

  return (
    <DocumentShell document={document} client={client}>
      <div className="mb-8">
        <p className="font-body font-medium text-[9px] uppercase tracking-[0.15em] text-ks-lava mb-1">Project Brief</p>
        <h2 className="font-display font-bold text-[20px] text-ks-ink tracking-[-0.02em]">{c.businessName}</h2>
        {c.tagline && <p className="font-body text-[13px] text-ks-silver mt-1 italic">"{c.tagline}"</p>}
        {document.completed_at && (
          <p className="font-body text-[11px] text-ks-silver mt-2">
            Submitted {new Date(document.completed_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}
      </div>

      {/* Step 1 — Basics */}
      <Section title="Business">
        {c.serviceType && <Row label="Service type" value={c.serviceType} />}
        <Row label="Description" value={c.businessDescription} />
        <Row label="What sets them apart" value={c.competitorDifference} />
        <Row label="Years in business" value={c.yearsInBusiness} />
        <Row label="Phone" value={c.phone} />
        <Row label="Email" value={c.email} />
        <Row label="Address" value={c.address} />
        <Row label="Business hours" value={c.businessHours} />
        <Row label="Social media" value={c.socialMediaLinks} />
      </Section>

      {/* Step 2 — Brand Identity */}
      {(c.logoUrl || c.brandGuideUrl || c.brandArchetype || c.brandStory || c.brandValues || c.currentBrandIssues || (c.toneOfVoice && c.toneOfVoice.length > 0)) && (
        <Section title="Brand Identity">
          <FileRow label="Logo" url={c.logoUrl} />
          <FileRow label="Brand guide" url={c.brandGuideUrl} />
          <Row label="Tone of voice" value={c.toneOfVoice} />
          <Row label="Brand archetype" value={c.brandArchetype} />
          <Row label="Brand story" value={c.brandStory} />
          <Row label="Brand values" value={c.brandValues} />
          <Row label="Brand issues" value={c.currentBrandIssues} />
        </Section>
      )}

      {/* Step 3 — Goals & Audience */}
      <Section title="Goals & Audience">
        <Row label="Primary goal" value={c.primaryGoal} />
        <Row label="Target audience" value={c.targetDemographics} />
        <Row label="Problem solved" value={c.targetProblem} />
        <Row label="Competitive advantage" value={c.targetAdvantage} />
        <Row label="Visitor actions" value={c.desiredVisitorActions} />
      </Section>

      {/* Service-specific fields */}
      {hasServiceSpecific && (
        <Section title="Service-Specific Details">
          <Row label="Marketing channels" value={c.marketingChannels} />
          <Row label="Monthly ad budget" value={c.monthlyAdBudget} />
          <Row label="Existing campaigns" value={c.existingCampaigns} />
          <Row label="Current website" value={c.currentWebsiteUrl} />
          <Row label="Target keywords" value={c.targetKeywords} />
          <Row label="Content topics" value={c.contentTopics} />
          <Row label="Tech stack notes" value={c.techStackNotes} />
        </Section>
      )}

      {/* Step 4 — Aesthetics */}
      <Section title="Look & Feel">
        <Row label="Brand feel" value={c.desiredFeel} />
        <Row label="Design trends" value={c.designTrends} />
        <Row label="Typography feel" value={c.typographyFeel} />
        <Row label="Icon style" value={c.iconStyle} />
        <Row label="Image style" value={c.imageStyle} />
        <Row label="UI density" value={c.uiDensity} />
        <Row label="Brand colours" value={c.brandColors} />
        <Row label="Colours they like" value={c.colorsYouLike} />
        <Row label="Colours to avoid" value={c.colorsYouDislike} />
        <Row label="Reference websites" value={c.websiteReferences} />
        <Row label="Inspiration URLs" value={c.inspirationUrls} />
        {hasInspirationUploads && (
          <div className="grid grid-cols-[160px_1fr] gap-4 py-3 border-b border-ks-hairline last:border-0">
            <p className="font-body font-medium text-[10px] uppercase tracking-[0.1em] text-ks-silver pt-0.5">Inspiration uploads</p>
            <div className="flex flex-wrap gap-3">
              {c.inspirationUploadUrls!.filter(Boolean).map((url, i) => {
                const isImg = !/\.pdf(\?|$)/i.test(url)
                return isImg ? (
                  <a key={i} href={url} target="_blank" rel="noreferrer">
                    <img src={url} alt={`Inspiration ${i + 1}`} className="h-24 w-24 object-cover rounded border border-ks-rule hover:opacity-80 transition-opacity" />
                  </a>
                ) : (
                  <a key={i} href={url} target="_blank" rel="noreferrer" className="font-body text-[11px] text-ks-lava hover:opacity-70 transition-opacity flex items-center gap-1">
                    <span>📄</span> File {i + 1}
                  </a>
                )
              })}
            </div>
          </div>
        )}
      </Section>

      {/* Step 5 — Competitors */}
      {c.competitors && c.competitors.filter(x => x.name || x.url).length > 0 && (
        <Section title="Competitors">
          <div className="py-3">
            <CompetitorTable competitors={c.competitors} />
          </div>
        </Section>
      )}

      {/* Step 6 — Content & Features */}
      <Section title="Content & Features">
        <Row label="Pages needed" value={c.standardPages} />
        <Row label="Copy readiness" value={c.copyReadiness} />
        <Row label="Images readiness" value={c.imagesReadiness} />
        <Row label="Logo readiness" value={c.logoReadiness} />
        <Row label="Dynamic content" value={c.dynamicContentNeeds} />
        <Row label="Special features" value={c.specificFeatures} />
        {c.specificFeatures?.includes('E-commerce (Online Store)') && (
          <>
            <Row label="Products / SKUs" value={c.ecommerceProducts} />
            <Row label="Payment methods" value={c.ecommercePayments} />
            <Row label="Shipping" value={c.ecommerceShipping} />
          </>
        )}
      </Section>

      {/* Step 7 — Technical Setup */}
      <Section title="Technical Setup">
        <Row label="Platform preference" value={c.platformPreference} />
        <Row label="Own domain?" value={c.ownDomain} />
        <Row label="Domain name" value={c.domainDetails} />
        <Row label="Have hosting?" value={c.haveHosting} />
        <Row label="Hosting details" value={c.hostingDetails} />
        <Row label="Integrations" value={c.thirdPartyIntegrations} />
      </Section>

      {/* Step 8 — Timeline & Meeting Prep */}
      <Section title="Timeline & Meeting Prep">
        <Row label="Target launch" value={c.deadline ? new Date(c.deadline).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }) : undefined} />
        <Row label="Why this date" value={c.deadlineReason} />
        <Row label="Availability" value={c.availability} />
        <Row label="Budget for extras" value={c.budgetExtras} />
        <Row label="Project budget" value={c.projectBudget} />
        <Row label="Decision makers" value={c.decisionMakers} />
        <Row label="Previous agency" value={c.previousAgencyExperience} />
        <Row label="How they found us" value={c.howTheyFoundUs} />
        <Row label="Success metrics" value={c.successMetrics} />
      </Section>

      {c.additionalInfo && (
        <Section title="Additional Notes">
          <Row label="Notes" value={c.additionalInfo} />
        </Section>
      )}
    </DocumentShell>
  )
}
