import type { CelebrationKind } from '../shop/catalog'

/**
 * Lesson-complete celebrations, drawn on one temporary full-screen canvas (no
 * libraries). Devices set to reduce motion get a short, sparse version.
 */

interface P {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  rot: number
  vr: number
  life: number
  /** Seconds before it appears (staggered bursts). */
  delay: number
  phase: number
}

const rand = (a: number, b: number) => a + Math.random() * (b - a)
const pick = <T>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)]

const CONFETTI = ['#ff5f6d', '#ffc371', '#47e891', '#3fa7ff', '#c56cf0', '#ffd23f']
const DURATION = 3.6

function spawn(kind: CelebrationKind, w: number, h: number, scale: number): P[] {
  const n = (count: number) => Math.round(count * scale)
  const base = { rot: 0, vr: 0, life: 1, delay: 0, phase: Math.random() * Math.PI * 2 }
  switch (kind) {
    case 'confetti':
      return Array.from({ length: n(160) }, () => ({
        ...base, x: rand(0, w), y: rand(-h * 0.5, -10), vx: rand(-60, 60), vy: rand(120, 320), size: rand(6, 11),
        color: pick(CONFETTI), rot: rand(0, 6), vr: rand(-8, 8),
      }))
    case 'fireworks':
      return Array.from({ length: n(6) }).flatMap((_, b) => {
        const cx = rand(w * 0.15, w * 0.85)
        const cy = rand(h * 0.15, h * 0.5)
        const color = pick(CONFETTI)
        return Array.from({ length: 56 }, (_, i) => {
          const a = (i / 56) * Math.PI * 2
          const v = rand(140, 260)
          return { ...base, x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, size: rand(2, 3.5), color, delay: b * 0.45 }
        })
      })
    case 'petals':
      return Array.from({ length: n(70) }, () => ({
        ...base, x: rand(0, w), y: rand(-h * 0.6, -10), vx: rand(20, 70), vy: rand(50, 110), size: rand(7, 12),
        color: pick(['#ffb7c5', '#ffc8d6', '#f8a5c2', '#ffe0e9']), rot: rand(0, 6), vr: rand(-2, 2),
      }))
    case 'lanterns':
      return Array.from({ length: n(22) }, () => ({
        ...base, x: rand(0, w), y: rand(h + 20, h * 1.6), vx: rand(-15, 15), vy: rand(-140, -80), size: rand(16, 26),
        color: pick(['#ff4d2e', '#ff7a1a', '#e8361c']),
      }))
    case 'coins':
      return Array.from({ length: n(80) }, () => ({
        ...base, x: rand(0, w), y: rand(-h * 0.7, -10), vx: rand(-30, 30), vy: rand(80, 200), size: rand(9, 14), color: '#f2c94c', vr: rand(4, 9),
      }))
    case 'stars':
      return Array.from({ length: n(55) }, () => ({
        ...base, x: rand(-w * 0.2, w), y: rand(-h * 0.6, -10), vx: rand(120, 220), vy: rand(160, 260), size: rand(5, 10),
        color: pick(['#ffffff', '#fff3b0', '#ffd23f', '#c9e4ff']), vr: rand(-3, 3),
      }))
  }
}

function star(ctx: CanvasRenderingContext2D, r: number) {
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2
    const rr = i % 2 ? r * 0.45 : r
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr)
  }
  ctx.closePath()
  ctx.fill()
}

function draw(ctx: CanvasRenderingContext2D, kind: CelebrationKind, p: P, t: number) {
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.rotate(p.rot)
  ctx.globalAlpha = Math.max(0, Math.min(1, p.life))
  ctx.fillStyle = p.color
  switch (kind) {
    case 'confetti':
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, (p.size / 2) * Math.abs(Math.cos(p.rot * 2)) + 1)
      break
    case 'fireworks':
      ctx.shadowBlur = 8
      ctx.shadowColor = p.color
      ctx.beginPath()
      ctx.arc(0, 0, p.size, 0, Math.PI * 2)
      ctx.fill()
      break
    case 'petals':
      ctx.beginPath()
      ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2)
      ctx.fill()
      break
    case 'lanterns': {
      ctx.rotate(-p.rot + Math.sin(t * 2 + p.phase) * 0.08)
      ctx.shadowBlur = 24
      ctx.shadowColor = '#ffb347'
      const s = p.size
      ctx.beginPath()
      ctx.roundRect(-s * 0.55, -s * 0.7, s * 1.1, s * 1.4, s * 0.35)
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.fillStyle = '#ffd27a'
      ctx.fillRect(-s * 0.25, -s * 0.85, s * 0.5, s * 0.15)
      ctx.fillRect(-s * 0.25, s * 0.7, s * 0.5, s * 0.15)
      break
    }
    case 'coins': {
      const squash = Math.abs(Math.cos(p.rot))
      ctx.rotate(-p.rot)
      ctx.beginPath()
      ctx.ellipse(0, 0, p.size * squash + 1, p.size, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#c99a1e'
      ctx.lineWidth = 2
      ctx.stroke()
      break
    }
    case 'stars':
      ctx.shadowBlur = 10
      ctx.shadowColor = p.color
      star(ctx, p.size)
      break
  }
  ctx.restore()
}

export function celebrate(kind: CelebrationKind = 'confetti') {
  if (typeof document === 'undefined') return
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const canvas = document.createElement('canvas')
  canvas.className = 'celebration-canvas'
  canvas.setAttribute('aria-hidden', 'true')
  document.body.appendChild(canvas)
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = window.innerWidth
  const h = window.innerHeight
  canvas.width = w * dpr
  canvas.height = h * dpr
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas.remove()
  ctx.scale(dpr, dpr)

  const parts = spawn(kind, w, h, reduced ? 0.3 : 1)
  const duration = reduced ? 1.6 : DURATION
  const gravity = kind === 'fireworks' ? 160 : kind === 'coins' ? 260 : 0
  let last = performance.now()
  const start = last

  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    const t = (now - start) / 1000
    ctx.clearRect(0, 0, w, h)
    for (const p of parts) {
      if (t < p.delay) continue
      p.vy += gravity * dt
      if (kind === 'petals' || kind === 'confetti') p.x += Math.sin(t * 2 + p.phase) * 30 * dt
      if (kind === 'fireworks') {
        p.vx *= 0.985
        p.vy *= 0.985
        p.life -= dt * 0.9
      }
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.rot += p.vr * dt
      // Everything fades out over the last half second.
      if (t > duration - 0.5) p.life = Math.min(p.life, (duration - t) / 0.5)
      draw(ctx, kind, p, t)
    }
    if (t < duration) requestAnimationFrame(frame)
    else canvas.remove()
  }
  requestAnimationFrame(frame)
}
