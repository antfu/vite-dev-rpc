import { resolve } from 'path'
import type { Plugin } from 'vite'
import { defineConfig } from 'vite'
import { createRPCServer } from 'vite-dev-rpc'
import type { RPCFunctions } from './src/rpc'

function DemoPlugin(): Plugin {
  return {
    name: 'demo',
    configureServer(server) {
      createRPCServer<RPCFunctions>(
        'demo',
        server.ws,
        {
          add(a, b) {
            return a + b
          },
        },
      )
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
