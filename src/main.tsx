import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './styles.css'
import { installCrossAppLinks } from './lib/crossAppLinks'

// Links to Banter and Wordle Unlimited open signed in (lib/crossAppLinks.ts).
installCrossAppLinks('lingora')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
