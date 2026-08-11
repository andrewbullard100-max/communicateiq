// ─── Policy document text extraction ────────────────────────────────────────
// Pulls plain text out of an uploaded policy/procedure document so it can be
// fed to the AI generation prompt in lib/policies.js. Supports the three
// formats orgs actually author policies in: PDF, Word (.docx), and plain
// text/markdown. Anything else is rejected up front by ACCEPTED_MIME_TYPES
// in lib/policies.js before this is ever called.
//
// pdf-parse and mammoth are dynamically imported (not top-level) because
// pdf-parse's module-level code does a debug-mode file read that only
// matters in isolated test scripts, not here — dynamic import keeps that
// cost (and both libraries' fairly large parse dependency trees) out of
// every route that imports this file for other reasons, and out of the
// client bundle entirely since this only ever runs server-side.

export async function extractText(buffer, mimeType) {
  if (mimeType === 'application/pdf') {
    const pdfParse = (await import('pdf-parse')).default
    const result = await pdfParse(buffer)
    return result.text.trim()
  }

  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const mammoth = (await import('mammoth')).default
    const result = await mammoth.extractRawText({ buffer })
    return result.value.trim()
  }

  if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
    return buffer.toString('utf-8').trim()
  }

  throw new Error(`Unsupported document type: ${mimeType}`)
}
