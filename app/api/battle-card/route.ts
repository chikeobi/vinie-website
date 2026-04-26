import { getAnthropicClient } from '@/lib/anthropic'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const { vin, year, make, model, trim, mileage, price, daysOnLot } = await request.json()

  const anthropic = getAnthropicClient()

  const vehicleDesc = `${year} ${make} ${model}${trim ? ' ' + trim : ''}`
  const prompt = `You are an expert automotive sales coach. Create a punchy AI sales brief for a salesperson about to show this vehicle.

Vehicle: ${vehicleDesc}
VIN: ${vin}
Price: $${Number(price).toLocaleString('en-US')}
Mileage: ${Number(mileage).toLocaleString('en-US')} miles
Days on lot: ${daysOnLot}

Provide exactly 3 bullet points that help the salesperson close the deal. Each should be specific, value-focused, and persuasive. Reference the actual vehicle details.

Format:
• [Point 1]
• [Point 2]
• [Point 3]`

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
