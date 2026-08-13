'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Scoring Review now lives as a tab inside the Admin Console
// (app/admin/ReviewsPanel.js) — this route just forwards old links/bookmarks.
export default function ReviewsRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin?tab=reviews')
  }, [router])
  return null
}
