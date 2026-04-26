import { getFirebaseDb } from '@/lib/firebase'
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const { vin, historyReport } = await request.json()
    if (!vin || !historyReport) return new Response('Missing vin or historyReport', { status: 400 })

    const db = getFirebaseDb()
    const q = query(collection(db, 'vehicles'), where('vin', '==', vin), )
    const snap = await getDocs(q)
    if (snap.empty) {
      return new Response('Vehicle not found', { status: 404 })
    }

    const ref = snap.docs[0].ref
    const payload = { ...historyReport, fetchedAt: Date.now() }
    await updateDoc(ref, { historyReport: payload })

    return new Response(JSON.stringify({ success: true, historyReport: payload }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response('Server error', { status: 500 })
  }
}
