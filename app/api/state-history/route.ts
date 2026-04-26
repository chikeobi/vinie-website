export const runtime = 'nodejs'

// Scaffold for state DMV integrations.
// Many states do not expose public VIN/title APIs. Add provider functions
// here when you have a partner/reseller endpoint for a specific state.

type StateHandler = (vin: string) => Promise<any>

const handlers: Record<string, StateHandler> = {
  // Example provider (pseudo-code):
  // CA: async (vin) => {
  //   const res = await fetch(`https://california.example.com/v1/vehicle/${vin}?key=${process.env.CA_API_KEY}`)
  //   const json = await res.json()
  //   return { provider: 'CA DMV (example)', data: json }
  // }
}

export async function POST(request: Request) {
  try {
    const { vin, state } = await request.json()
    if (!vin || !state) return new Response('Missing vin or state', { status: 400 })

    const key = String(state).trim().toUpperCase()
    const handler = handlers[key]
    if (!handler) {
      return new Response(JSON.stringify({ available: false, message: `No state provider configured for ${key}` }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const result = await handler(vin)
    return new Response(JSON.stringify({ available: true, result }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ available: false, message: 'Server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
