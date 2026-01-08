import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export async function downloadPdfFromElement(
  el: HTMLElement,
  filename: string,
): Promise<void> {
  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
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

  pdf.save(filename)
}


