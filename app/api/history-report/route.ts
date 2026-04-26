export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const { vin } = await request.json()
    if (!vin) return new Response('Missing VIN', { status: 400 })

    const url = `https://api.nhtsa.gov/recalls/recallsByVin?vin=${encodeURIComponent(vin)}`
    const res = await fetch(url)
    if (!res.ok) {
      return new Response('NHTSA lookup failed', { status: 502 })
    }

    const data = await res.json()
    const results = Array.isArray(data.results) ? data.results : []

    const items = results.map((r: any) => ({
      campaignNumber: r.NHTSACampaignNumber || r.CampaignNumber || '',
      component: r.Component || r.VehicleComponent || 'Unknown',
      summary: (r.Summary || r.Defect || r.SafetyIssue || '').trim(),
      remedy: (r.Remedy || r.CorrectiveAction || '').trim(),
    }))

    const summaryText = items.length
      ? items.slice(0, 2).map((i) => i.summary).join(' — ')
      : 'No recalls found'

    return new Response(
      JSON.stringify({
        provider: 'NHTSA',
        fetchedAt: Date.now(),
        count: items.length,
        items,
        summaryText,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response('Server error', { status: 500 })
  }
}
