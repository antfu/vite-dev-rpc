import { createBirpc } from 'birpc'
import type { WebSocket, WebSocketServer } from 'vite'
import type { ViteHotContext } from 'vite-hot-client'

export function createRPCServer<LocalFunctions = {}>(
  name: string,
  ws: WebSocketServer,
  functions: LocalFunctions,
) {
  const event = `${name}:rpc`
  return createBirpc(functions, {
    on: (fn) => {
      ws.on(event, fn)
    },
    post: (data, socket?: WebSocket) => {
      if (socket)
        socket.send(event, data)
      else
        ws.send(event, data)
    },
  })
}

export function createRPCClient<Functions = {}>(
  name: string,
  hot: ViteHotContext,
) {
  const event = `${name}:rpc`
  return createBirpc<Functions>({}, {
    on: (fn) => {
      // @ts-expect-error bug
      hot.on(event, fn)
    },
    post: (data) => {
      hot.send(event, data)
    },
  })
}
