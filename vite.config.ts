/// <reference types="vitest" />
import { getRequestListener } from '@hono/node-server'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/** Serves the Hono API at /api inside the dev server; edits to server/ hot-reload. */
function api(): Plugin {
  return {
    name: 'lingora-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api')) return next()
        try {
          const { app } = await server.ssrLoadModule('/server/app.ts')
          await getRequestListener(app.fetch)(req, res)
        } catch (e) {
          next(e)
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), api()],
  server: { port: 5173 },
  test: { environment: 'node' },
})
