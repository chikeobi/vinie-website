'use client'

import { ReactNode, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'

interface Props {
  children: ReactNode
  onDelete: () => void | Promise<void>
}

const ACTION_WIDTH = 82
const OPEN_THRESHOLD = 44

export default function SwipeableCard({ children, onDelete }: Props) {
  const [offset, setOffset] = useState(0)
  const [open, setOpen] = useState(false)
  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const startOffsetRef = useRef(0)
  const draggingRef = useRef(false)
  const horizontalRef = useRef(false)
  const suppressClickRef = useRef(false)

  function clamp(value: number) {
    return Math.max(0, Math.min(ACTION_WIDTH, value))
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    startXRef.current = e.clientX
    startYRef.current = e.clientY
    startOffsetRef.current = open ? ACTION_WIDTH : 0
    draggingRef.current = true
    horizontalRef.current = false
    suppressClickRef.current = false
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return

    const dx = startXRef.current - e.clientX
    const dy = Math.abs(startYRef.current - e.clientY)

    if (!horizontalRef.current) {
      if (Math.abs(dx) < 8) return
      if (Math.abs(dx) <= dy) {
        draggingRef.current = false
        return
      }
      horizontalRef.current = true
    }

    suppressClickRef.current = true
    setOffset(clamp(startOffsetRef.current + dx))
  }

  function handlePointerEnd() {
    if (!horizontalRef.current) {
      draggingRef.current = false
      return
    }

    const shouldOpen = offset > OPEN_THRESHOLD
    setOffset(shouldOpen ? ACTION_WIDTH : 0)
    setOpen(shouldOpen)
    draggingRef.current = false
    horizontalRef.current = false
  }

  function handleClickCapture(e: React.MouseEvent<HTMLDivElement>) {
    if (suppressClickRef.current) {
      e.preventDefault()
      e.stopPropagation()
      suppressClickRef.current = false
      return
    }

    if (open) {
      e.preventDefault()
      e.stopPropagation()
      setOpen(false)
      setOffset(0)
    }
  }

  async function handleDeleteClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    e.stopPropagation()
    await onDelete()
    setOpen(false)
    setOffset(0)
  }

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-card)]">
      <div className="absolute inset-y-0 right-0 flex items-center">
        <button
          type="button"
          onClick={handleDeleteClick}
          className="mr-0 flex h-[72px] w-[72px] items-center justify-center rounded-[16px]"
          style={{ backgroundColor: '#FF3B30' }}
          aria-label="Delete card"
        >
          <Trash2 size={20} color="#FFFFFF" />
        </button>
      </div>

      <div
        className="relative touch-pan-y transition-transform duration-200 ease-out"
        style={{ transform: `translateX(-${offset}px)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onClickCapture={handleClickCapture}
      >
        {children}
      </div>
    </div>
  )
}
