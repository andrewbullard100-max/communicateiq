'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

function PrintContent() {
  const searchParams = useSearchParams()
  const sheet = searchParams.get('sheet') || 'master'

  useEffect(() => {
    const timer = setTimeout(() => {
      const iframe = document.getElementById('refframe')
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.printSheet(sheet)
      }
    }, 800)
    return () => clearTimeout(timer)
  }, [sheet])

  return (
    <iframe
      id="refframe"
      src="/reference-sheets.html"
      style={{ width: '100%', height: '100vh', border: 'none' }}
    />
  )
}

export default function PrintPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Arial', color: '#1C2B5E' }}>Loading reference sheet...</div>}>
      <PrintContent />
    </Suspense>
  )
}
