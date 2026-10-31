import { useEffect } from 'react'
import { speak, ttsSupported } from '../lib/speech'
import { useStore } from '../store/useStore'
import { Icon } from './Icon'

interface Props {
  text: string
  lang: string
  autoPlay?: boolean
  big?: boolean
  withSlow?: boolean
}

export function AudioButton({ text, lang, autoPlay, big, withSlow }: Props) {
  const rate = useStore((s) => s.settings.speechRate)

  useEffect(() => {
    if (autoPlay) speak(text, lang, rate)
  }, [autoPlay, text, lang, rate])

  if (!ttsSupported()) return null
  return (
    <span className="audio-group">
      <button type="button" className={`audio-btn ${big ? 'audio-btn-big' : ''}`} onClick={() => speak(text, lang, rate)} aria-label="Play audio">
        <Icon name="volume" size={big ? 36 : 20} />
      </button>
      {withSlow && (
        <button type="button" className="audio-btn audio-btn-slow" onClick={() => speak(text, lang, rate * 0.6)} aria-label="Play slowly">
          <Icon name="slow" size={18} />
        </button>
      )}
    </span>
  )
}
