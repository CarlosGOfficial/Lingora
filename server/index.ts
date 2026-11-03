import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { app } from './app'
import { DATABASE_URL, IS_PROD, PORT } from './env'
import { ensurePushTable } from './push'

const root = new Hono()
root.route('/', app)

// Unknown API addresses get a JSON 404 instead of falling through to the web page.
root.all('/api/*', (c) => c.json({ error: 'Not found' }, 404))

// In production one process serves both the API and the built frontend.
if (IS_PROD) {
  root.use('*', serveStatic({ root: './dist' }))
  root.get('*', serveStatic({ path: './dist/index.html' }))
}

// The push table is shared with Banter and Wordle; make sure it exists.
void ensurePushTable()

serve({ fetch: root.fetch, port: PORT }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`)
  console.log(DATABASE_URL ? 'Database: configured' : 'Database: NOT configured — add DATABASE_URL to .env.local, then run `npm run db:migrate`')
})
