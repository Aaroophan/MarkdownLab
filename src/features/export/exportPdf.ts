import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { getFilename } from './fileName'
import { EXPORT_LIGHT_CSS } from './exportStyles'
import type { ExportOptions, ExportResult } from './exportTypes'

export async function exportPdf(options: ExportOptions): Promise<ExportResult> {
  try {
    const { title, htmlContent } = options

    if (!htmlContent) {
      throw new Error('HTML content is required for PDF export')
    }

    const filename = getFilename(title, 'pdf')

    // Create a hidden container with the content
    const container = document.createElement('div')
    container.style.position = 'fixed'
    container.style.left = '0'
    container.style.top = '0'
    container.style.width = '210mm' // A4 width
    container.style.backgroundColor = 'white'
    container.style.zIndex = '-9999'
    container.style.padding = '20mm'
    container.innerHTML = htmlContent

    // Apply export styles
    const styleEl = document.createElement('style')
    styleEl.textContent = EXPORT_LIGHT_CSS
    container.appendChild(styleEl)

    document.body.appendChild(container)

    // Wait for images and Mermaid to render
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Render to canvas
    const canvas = await html2canvas(container, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false,
      windowHeight: container.scrollHeight,
      windowWidth: 1200,
    })

    // Remove container
    document.body.removeChild(container)

    // Create PDF
    const imgData = canvas.toDataURL('image/png')
    const imgWidth = 210 // A4 width in mm
    const pageHeight = 297 // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight

    const pdf = new jsPDF('p', 'mm', 'a4')
    let position = 0

    // Add pages
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    // Save PDF
    pdf.save(filename)

    return {
      success: true,
      format: 'pdf',
      filename,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[v0] PDF export failed:', error)
    return {
      success: false,
      format: 'pdf',
      filename: '',
      error: errorMessage,
    }
  }
}
