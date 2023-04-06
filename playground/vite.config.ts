import { resolve } from 'node:path'
import type { Plugin } from 'vite'
import { defineConfig } from 'vite'
import { createRPCServer } from 'vite-dev-rpc'
import type { ClientFunctions, ServerFunctions } from './src/rpc'

function DemoPlugin(): Plugin {
  return {
    name: 'demo',
    configureServer(server) {
      const rpc = createRPCServer<ClientFunctions, ServerFunctions>('demo', server.ws, {
        add(a, b) {
          // eslint-disable-next-line no-console
          console.log(`RPC ${a} ADD ${b}`)
          const result = a + b
          if (result > 150) {
            setTimeout(() => {
              rpc.alert.asEvent(`Someone got ${result}!`)
            }, 50)
          }
          return result
        },
      })
    },
  }
}

export default defineConfig({
  resolve: {
    alias: {
      'vite-dev-rpc': resolve(__dirname, '../src/index.ts'),
    },
  },
  plugins: [
    DemoPlugin(),
  ],
})
