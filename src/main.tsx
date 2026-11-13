import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './styles.css'
import { installCrossAppLinks } from './lib/crossAppLinks'
import { registerOffline } from './lib/offline'

// Links to Banter and Wordle Unlimited open signed in (lib/crossAppLinks.ts).
installCrossAppLinks('lingora')
// Works offline once loaded (lib/offline.ts, public/sw.js).
registerOffline()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
