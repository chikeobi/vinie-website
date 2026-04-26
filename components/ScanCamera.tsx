'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Flashlight, X, Camera } from 'lucide-react'

interface Props {
  onDetected?: (vin: string) => void | Promise<void>
}

export default function ScanCamera({ onDetected }: Props) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [torchOn, setTorchOn] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const controlsRef = useRef<{ stop: () => void } | null>(null)
  const detectedRef = useRef(false)

  const startScanner = useCallback(async () => {
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser')
      const reader = new BrowserMultiFormatReader()

      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current!,
        async (result) => {
          if (result && !detectedRef.current) {
            const text = result.getText()
            // Basic VIN validation: 17 alphanumeric chars
            if (/^[A-HJ-NPR-Z0-9]{17}$/i.test(text)) {
              detectedRef.current = true
              navigator.vibrate?.(200)
              controls.stop()
              if (onDetected) {
                await onDetected(text.toUpperCase())
              } else {
                router.push(`/vin/${text.toUpperCase()}`)
              }
            }
          }
        },
      )
      controlsRef.current = controls

      if (videoRef.current?.srcObject instanceof MediaStream) {
        setStream(videoRef.current.srcObject)
      }
    } catch (err) {
      console.error('Scanner error:', err)
    }
  }, [router, onDetected])

  useEffect(() => {
    startScanner()
    return () => {
      controlsRef.current?.stop()
    }
  }, [startScanner])

  async function toggleTorch() {
    if (!stream) return
    const track = stream.getVideoTracks()[0]
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as MediaTrackConstraintSet] })
      setTorchOn((p) => !p)
    } catch {
      // torch not supported
    }
  }

  return (
    <div className="relative w-full h-full bg-black rounded-[var(--radius-panel)] overflow-hidden min-h-0">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/65 pointer-events-none" />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-56 h-32">
          <span className="absolute top-0 left-0 w-7 h-7 border-t-[3px] border-l-[3px] border-white rounded-tl-sm" />
          <span className="absolute top-0 right-0 w-7 h-7 border-t-[3px] border-r-[3px] border-white rounded-tr-sm" />
          <span className="absolute bottom-0 left-0 w-7 h-7 border-b-[3px] border-l-[3px] border-white rounded-bl-sm" />
          <span className="absolute bottom-0 right-0 w-7 h-7 border-b-[3px] border-r-[3px] border-white rounded-br-sm" />
        </div>
      </div>

      <div className="absolute bottom-5 left-4 right-4 flex items-center justify-between gap-3">
        <button
          onClick={toggleTorch}
          className="flex h-12 w-12 items-center justify-center rounded-[14px] border transition-colors"
          style={{
            backgroundColor: torchOn ? 'rgba(255,255,255,0.22)' : 'rgba(22,22,24,0.55)',
            borderColor: 'rgba(255,255,255,0.16)',
          }}
          aria-label="Toggle torch"
        >
          <Flashlight size={20} className="text-white" />
        </button>

        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-full border-4 border-white/90 flex items-center justify-center bg-white/10 backdrop-blur-sm">
            <Camera size={24} className="text-white" />
          </div>
          <span className="text-[11px] font-medium text-white/88">Live scan</span>
        </div>

        <button
          onClick={() => router.push('/dashboard')}
          className="flex h-12 w-12 items-center justify-center rounded-[14px] border"
          style={{
            backgroundColor: 'rgba(22,22,24,0.55)',
            borderColor: 'rgba(255,255,255,0.16)',
          }}
          aria-label="Close scanner"
        >
          <X size={20} className="text-white" />
        </button>
      </div>
    </div>
  )
}
