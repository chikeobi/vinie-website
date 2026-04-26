'use client'

import { useState } from 'react'
import PageHeader from '@/components/PageHeader'
import StepCard from '@/components/StepCard'
import ObjectionCard from '@/components/ObjectionCard'

const SECTIONS = [
  {
    emoji: '🎯',
    label: 'Build Connection & Understand the Buyer',
    steps: [
      { number: 1, title: 'Ask discovery questions first', description: "Find out what they drive now, why they're looking, who's riding along, and what matters most — safety, fuel, cargo, payments." },
      { number: 2, title: 'Confirm their lifestyle fit', description: "Daily commute, road trips, hauling, kids, pets — match the vehicle's design to their real life before you walk the lot." },
    ],
  },
  {
    emoji: '🚗',
    label: 'Walk-Around Presentation',
    steps: [
      { number: 3, title: 'Exterior design & first impression', description: 'Color, body lines, wheel size. Let them feel proud pulling into a parking lot — emotion sells cars.' },
      { number: 4, title: 'Safety features & ratings', description: 'Lead with 5-star ratings and ADAS features. Safety justifies price and builds trust instantly.' },
    ],
  },
  {
    emoji: '💰',
    label: 'Building Value & Handling Price',
    steps: [
      { number: 5, title: 'Features vs. price justification', description: "Every dollar needs a story. Walk them through what they're getting for the price before you show the numbers." },
      { number: 6, title: 'Trade-in conversation', description: "Ask early, handle late. Get their trade info upfront but don't anchor the deal to it until you've built full value." },
    ],
  },
  {
    emoji: '🤝',
    label: 'Closing the Deal',
    steps: [
      { number: 7, title: 'Trial close', description: '"If the numbers work, is there any reason we can\'t do this today?"' },
      { number: 8, title: 'Handle final objections', description: 'Use the FEEL FELT FOUND method. "I understand how you feel, others have felt the same, here\'s what they found..."' },
    ],
  },
]

const OBJECTIONS = [
  { objection: 'I need to think about it', response: "Acknowledge, then ask: \"What specifically would you like to think over? Let's address it now so you have all the info.\"" },
  { objection: 'The price is too high', response: '"Compared to what? Let me show you what else is in this range and why this one is actually the better value."' },
  { objection: 'I can get it cheaper elsewhere', response: "\"You might! But can they match our service department, our warranty, and the relationship you'll have with me after the sale?\"" },
  { objection: "I'm just looking", response: '"Perfect, looking is exactly how great decisions start. What brought you in today specifically?"' },
  { objection: 'I need to talk to my spouse', response: "\"That makes total sense. Would it help if we called them together so you can share what you've found?\"" },
  { objection: "My credit isn't great", response: "\"Let's let our finance team run a soft pull — it won't affect your score and they've helped people in every situation.\"" },
]

export default function CoachPage() {
  const [tab, setTab] = useState<'steps' | 'objections'>('steps')

  return (
    <div>
      <PageHeader title="Coach" />

      <div className="px-4 pt-4">
        {/* Tab pills */}
        <div className="flex gap-2 mb-5">
          {(['steps', 'objections'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 h-9 rounded-[14px] text-[14px] font-semibold transition-colors"
              style={{
                backgroundColor: tab === t ? 'var(--chip-active-bg)' : 'var(--card)',
                color: tab === t ? 'var(--chip-active-text)' : 'var(--text-secondary)',
                border: tab === t ? 'none' : '1px solid var(--border)',
              }}
            >
              {t === 'steps' ? 'Steps to the Sale' : 'Objections'}
            </button>
          ))}
        </div>

        {tab === 'steps' ? (
          <div className="space-y-6">
            {SECTIONS.map((section) => (
              <div key={section.label}>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
                  {section.emoji} {section.label}
                </p>
                <div className="space-y-3">
                  {section.steps.map((step) => <StepCard key={step.number} {...step} />)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {OBJECTIONS.map((o) => <ObjectionCard key={o.objection} {...o} />)}
          </div>
        )}
      </div>
    </div>
  )
}
