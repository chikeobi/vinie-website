import { getAnthropicClient } from '@/lib/anthropic'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const {
    vin,
    year,
    make,
    model,
    trim,
    mileage,
    price,
    daysOnLot,
    warrantySummary,
    marketStats,
  } = await request.json()

  const anthropic = getAnthropicClient()

  const vehicleDesc = `${year} ${make} ${model}${trim ? ' ' + trim : ''}`
  let prompt = `You are an expert automotive sales coach. Create a punchy AI sales brief for a salesperson about to show this vehicle.

Vehicle: ${vehicleDesc}
VIN: ${vin}
Price: $${Number(price).toLocaleString('en-US')}
Mileage: ${Number(mileage).toLocaleString('en-US')} miles
Days on lot: ${daysOnLot}`

  if (warrantySummary) {
    prompt += `\nWarranty summary: ${warrantySummary}`
  } else if (request && request.headers && request.headers.get && request.headers.get('x-warranty')) {
    // noop - preserve signature
  }

  if (marketStats && typeof marketStats === 'object') {
    if (marketStats.medianPrice) prompt += `\nMedian market price: $${Math.round(marketStats.medianPrice).toLocaleString()}`
    if (marketStats.activeCount) prompt += `\nActive listings nearby: ${marketStats.activeCount}`
    if (marketStats.avgMiles) prompt += `\nAverage comparable miles: ${Math.round(marketStats.avgMiles).toLocaleString()} mi`
  }

  prompt += `\n\nProvide exactly 3 bullet points that help the salesperson close the deal. Each should be specific, value-focused, and persuasive. Reference the actual vehicle details.\n\nFormat:\n• [Point 1]\n• [Point 2]\n• [Point 3]`

  const stream = anthropic.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }],
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
