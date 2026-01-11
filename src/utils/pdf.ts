import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export async function createPdfBlobFromElement(el: HTMLElement): Promise<Blob> {
  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    // Force "desktop" media queries / MUI breakpoint CSS so mobile PDFs match laptop layout.
    // (MUI sx breakpoint objects compile to @media (min-width: ...), which depends on viewport width.)
    windowWidth: 1200,
    windowHeight: 1700,
    scrollX: 0,
    scrollY: 0,
  })
  const imgData = canvas.toDataURL('image/png')

  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'pt',
    format: 'a4',
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  // Always force a SINGLE page: scale down to fit A4.
  const scale = Math.min(pageWidth / canvas.width, pageHeight / canvas.height)
  const imgWidth = canvas.width * scale
  const imgHeight = canvas.height * scale
  const x = (pageWidth - imgWidth) / 2
  const y = (pageHeight - imgHeight) / 2
  pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight)

  return pdf.output('blob')
}

export async function downloadPdfFromElement(el: HTMLElement, filename: string): Promise<void> {
  const blob = await createPdfBlobFromElement(el)
  const url = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
  } finally {
    URL.revokeObjectURL(url)
  }
}


