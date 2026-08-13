'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// The Team Dashboard now lives as a tab inside the Admin Console
// (app/admin/TeamPanel.js) — this route just forwards old links/bookmarks.
export default function TeamRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin?tab=team')
  }, [router])
  return null
}
