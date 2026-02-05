import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        // Critical: Configure proxy to handle SSE properly
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Disable buffering for SSE
            proxyReq.setHeader('X-Accel-Buffering', 'no')
          })
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Don't compress or buffer SSE responses
            if (
              proxyRes.headers['content-type']?.includes('text/event-stream')
            ) {
              delete proxyRes.headers['content-encoding']
            }
          })
        },
      },
    },
  },
})
