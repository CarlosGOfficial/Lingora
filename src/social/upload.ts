import { MAX_GIF_BYTES, MAX_IMAGE_BYTES } from './chat'

/**
 * Upload a picture for a chat: photos are shrunk (longest side 1600px) and re-encoded;
 * GIFs go as they are so they keep moving. Returns the image id to send.
 */
export async function uploadChatImage(file: File): Promise<string> {
  const types = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
  if (!types.includes(file.type)) throw new Error('Pick a PNG, JPEG, GIF or WebP picture.')
  let blob: Blob = file
  let w = 0
  let h = 0
  if (file.type === 'image/gif') {
    if (file.size > MAX_GIF_BYTES) throw new Error(`GIFs can be up to ${MAX_GIF_BYTES / 1024 / 1024} MB.`)
    const bmp = await createImageBitmap(file).catch(() => null)
    if (bmp) {
      w = bmp.width
      h = bmp.height
      bmp.close()
    }
  } else {
    const bmp = await createImageBitmap(file).catch(() => {
      throw new Error('That picture couldn’t be opened.')
    })
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height))
    w = Math.round(bmp.width * scale)
    h = Math.round(bmp.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(bmp, 0, 0, w, h)
    bmp.close()
    const encode = (type: string) => new Promise<Blob | null>((r) => canvas.toBlob(r, type, 0.85))
    let out = await encode('image/webp')
    if (!out || out.type !== 'image/webp') {
      // No WebP encoder (older Safari): JPEG, on white so transparent parts don't go black.
      ctx.globalCompositeOperation = 'destination-over'
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, w, h)
      out = await encode('image/jpeg')
    }
    if (!out) throw new Error('That picture couldn’t be opened.')
    blob = out
    if (blob.size > MAX_IMAGE_BYTES) throw new Error('That picture is too big.')
  }
  const res = await fetch(`/api/chat-images?w=${w}&h=${h}`, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': blob.type }, body: blob })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Couldn’t upload the picture')
  return (data as { id: string }).id
}
