import html2pdf from 'html2pdf.js'

const PDF_OPT = {
  margin: 0,
  image: { type: 'jpeg' as const, quality: 0.98 },
  html2canvas: { scale: 2, useCORS: true },
  jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' as const },
}

function hideEditorChrome(element: HTMLElement) {
  const els = element.querySelectorAll<HTMLElement>('.no-print')
  els.forEach(el => { el.style.display = 'none' })
  element.classList.add('pdf-clean')
  return els
}

function restoreEditorChrome(element: HTMLElement, els: NodeListOf<HTMLElement>) {
  els.forEach(el => { el.style.display = '' })
  element.classList.remove('pdf-clean')
}

export async function exportToPDF(elementId: string, filename: string) {
  const element = document.getElementById(elementId)
  if (!element) return
  const hidden = hideEditorChrome(element)
  await html2pdf().set({ ...PDF_OPT, filename: `${filename}.pdf` }).from(element).save()
  restoreEditorChrome(element, hidden)
}

/**
 * Renders the document element to a PDF Blob without downloading.
 * Used by autoVault to upload directly to Supabase Storage.
 */
export async function generatePDFBlob(elementId: string): Promise<Blob> {
  const element = document.getElementById(elementId)
  if (!element) throw new Error(`Element #${elementId} not found in DOM`)
  const hidden = hideEditorChrome(element)
  try {
    const blob: Blob = await html2pdf().set(PDF_OPT).from(element).outputPdf('blob')
    return blob
  } finally {
    restoreEditorChrome(element, hidden)
  }
}
