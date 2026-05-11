import html2pdf from 'html2pdf.js'

export async function exportToPDF(elementId: string, filename: string) {
  const element = document.getElementById(elementId)
  if (!element) return

  const editorEls = element.querySelectorAll<HTMLElement>('.no-print')
  editorEls.forEach(el => { el.style.display = 'none' })
  element.classList.add('pdf-clean')

  const opt = {
    margin: 0,
    filename: `${filename}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' as const },
  }

  await html2pdf().set(opt).from(element).save()

  editorEls.forEach(el => { el.style.display = '' })
  element.classList.remove('pdf-clean')
}
