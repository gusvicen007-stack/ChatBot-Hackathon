import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { handleApi } from './server/api.mjs'

/**
 * Monta la API en el dev server de Vite. Es EXACTAMENTE el mismo handler
 * que corre en produccion (server/index.mjs), asi que lo que funciona en
 * `npm run dev` funciona igual en Railway.
 */
function apiDevServer(): Plugin {
  return {
    name: 'tandem-api-dev',
    apply: 'serve',
    configureServer(server) {
      // Sin prefijo de ruta a proposito: si se monta en '/api', connect le
      // quita ese prefijo a req.url y el handler ya no reconoce la ruta.
      server.middlewares.use((req, res, next) => {
        handleApi(req, res).then((handled) => { if (!handled) next() }, next)
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // Vite solo expone al cliente las variables VITE_*. Cargamos el resto aqui
  // para que la API vea ASSEMBLYAI_API_KEY en desarrollo: esto corre en
  // Node, nunca llega al bundle del navegador.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))

  return {
    plugins: [react(), tailwindcss(), apiDevServer()],
    server: { port: 3000 },
  }
})
