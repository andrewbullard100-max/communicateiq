'use client'
import Link from 'next/link'
import { C } from '../../lib/data'

const SHEETS = [
  { id: 'master',  label: 'Master Reference Sheet', sub: 'All scenarios, all data, terminology guide', icon: '📋', color: '#0D9488' },
  { id: 'd1s1',   label: 'D1-S1 · CFO Orientation Complaint', sub: 'Six-Part Framework · Foundational', icon: '📞', color: '#1C2B5E' },
  { id: 'd1s2',   label: 'D1-S2 · Survey Drop — VP Student Life', sub: 'Satisfaction data · Foundational', icon: '📊', color: '#1C2B5E' },
  { id: 'd1s3',   label: 'D1-S3 · Undercooked Chicken', sub: 'Food safety + service recovery · Foundational', icon: '🍗', color: '#1C2B5E' },
  { id: 'd1s4',   label: 'D1-S4 · Meal Plan Exception', sub: 'Boundary setting + empathy · Foundational', icon: '👨‍👩‍👧', color: '#1C2B5E' },
  { id: 'd2s1',   label: 'D2-S1 · Rising Costs & Service Request', sub: 'Financial storytelling · Advanced', icon: '💰', color: '#1C2B5E' },
  { id: 'd3s2',   label: 'D3-S2 · Donor Dinner Failure', sub: 'Service recovery · Advanced', icon: '🍽️', color: '#1C2B5E' },
  { id: 'd3s3',   label: 'D3-S3 · Sysco Delivery Shortages', sub: 'Vendor accountability · Advanced', icon: '🚚', color: '#1C2B5E' },
  { id: 'qbr',    label: 'QBR Boardroom Delivery', sub: 'QBR data, personas, scoring guide', icon: '🏛️', color: '#1B6B2F' },
]

export default function ReferencePage() {
  function openSheet(id) {
    window.open(`/reference/print?sheet=${id}`, '_blank')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6F9' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '36px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <Link href="/" className="btn-ghost" style={{ fontSize: 12, padding: '8px 14px' }}>← Platform Home</Link>
        </div>

        <span className="label">Training Resources</span>
        <h1 className="section-title fade-up" style={{ marginBottom: 8 }}>Reference Sheets</h1>
        <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 28, lineHeight: 1.7 }}>
          Print these before your simulations. Each sheet gives you the data, opening lines, success criteria, and key talking points you need — so you can focus on delivery, not memorization.
        </p>

        <div style={{ display: 'grid', gap: 10 }}>
          {SHEETS.map((sheet, i) => (
            <div key={sheet.id} className={`card fade-up-${Math.min(i+1,5)}`}
              style={{ cursor: 'pointer', transition: 'all 0.2s', borderLeft: `4px solid ${sheet.color}` }}
              onClick={() => openSheet(sheet.id)}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#F4F6F9', border: '1.5px solid #D1D5DB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{sheet.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#1C2B5E', marginBottom: 2 }}>{sheet.label}</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{sheet.sub}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6B7280', fontSize: 12 }}>
                  <span>Open & Print</span>
                  <span style={{ fontSize: 18, color: '#1C2B5E' }}>›</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, background: '#FFFFFF', border: '1.5px solid #D1D5DB', borderLeft: '4px solid #1C2B5E', borderRadius: 8, padding: '14px 20px', fontSize: 13, color: '#374151', lineHeight: 1.7 }}>
          <strong style={{ color: '#1C2B5E' }}>How to use:</strong> Click any sheet to open it in a new tab. Use your browser's print function (Ctrl+P / Cmd+P) to print or save as PDF. The Master Reference Sheet prints all scenarios on multiple pages.
        </div>
      </div>
    </div>
  )
}
