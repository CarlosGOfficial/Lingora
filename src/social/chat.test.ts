import { describe, expect, it } from 'vitest'
import { asPlainText, gifId, imageId, inviteCode, isEmoji, isPlainText, messagePreview, sharedClip } from './chat'

describe('chat formats shared with Wordle Unlimited', () => {
  it('recognises cards and keeps typed look-alikes as text', () => {
    expect(imageId('IMG:abc')).toBe('abc')
    expect(gifId('GIF:xyz1')).toBe('xyz1')
    expect(inviteCode('INVITE:ABCD')).toBe('ABCD')
    expect(sharedClip('CLIP:rec1:Great round')).toEqual({ recordingId: 'rec1', title: 'Great round' })
    const typed = asPlainText('IMG:not-really')
    expect(typed).toBe(' IMG:not-really')
    expect(imageId(typed)).toBeNull()
    expect(isPlainText(typed)).toBe(true)
    expect(asPlainText('olá')).toBe('olá')
  })

  it('previews messages in one line', () => {
    expect(messagePreview('IMG:abc')).toBe('📷 Photo')
    expect(messagePreview('INVITE:ABCD')).toBe('🎮 Game invite')
    expect(messagePreview(' GIF:typed')).toBe('GIF:typed')
    expect(messagePreview('x'.repeat(200))).toHaveLength(121)
  })

  it('accepts single emoji only', () => {
    for (const e of ['❤️', '👍🏽', '🇧🇷', '👨‍👩‍👧', '🔥']) expect(isEmoji(e), e).toBe(true)
    for (const e of ['', 'a', '👍 ', '👍x', '1']) expect(isEmoji(e), e).toBe(false)
  })
})
