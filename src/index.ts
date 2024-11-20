import type { BirpcOptions, ChannelOptions, EventOptions } from 'birpc'
import type { WebSocketClient, WebSocketServer } from 'vite'
import type { ViteHotContext } from 'vite-hot-client'
import { cachedMap, createBirpc, createBirpcGroup } from 'birpc'

export function createRPCServer<ClientFunction extends object, ServerFunctions extends object>(
  name: string,
  ws: WebSocketServer,
  functions: ServerFunctions,
  options: EventOptions<ClientFunction> = {},
) {
  const event = `${name}:rpc`

  const group = createBirpcGroup<ClientFunction, ServerFunctions>(
    functions,
    () => cachedMap(
      Array.from(ws?.clients || []),
      (socket): ChannelOptions => {
        return {
          on: (fn) => {
            ws.on(event, (data: any, source: WebSocketClient) => {
              if (socket === source)
                fn(data)
            })
          },
          post: (data) => {
            socket.send(event, data)
          },
        }
      },
    ),
    options,
  )

  ws.on('connection', () => {
    group.updateChannels()
  })

  return group.broadcast
}

export function createRPCClient<ServerFunctions extends object, ClientFunctions extends object>(
  name: string,
  hot: ViteHotContext | undefined | Promise<ViteHotContext| undefined>,
  functions: ClientFunctions = {} as ClientFunctions,
  options: Omit<BirpcOptions<ServerFunctions>, 'on' | 'post'> = {},
) {
  const event = `${name}:rpc`

  const promise = Promise.resolve(hot)
    .then(r=>{
      if (!r) 
        console.warn('[vite-hot-client] Received undefined hot context, RPC calls are ignored')
      return r
    })

  return createBirpc<ServerFunctions, ClientFunctions>(
    functions,
    {
      ...options,
      on: async (fn) => {
        (await promise)?.on(event, fn)
      },
      post: async (data) => {
        (await promise)?.send(event, data)
      },
    },
  )
}
