import type { BirpcOptions, ChannelOptions, EventOptions } from 'birpc'
import type { WebSocketClient, WebSocketServer } from 'vite'
import type { ViteHotContext } from 'vite-hot-client'
import { createBirpc, createBirpcGroup } from 'birpc'

const channelCache = new WeakMap<WebSocketClient, ChannelOptions>()

export function createRPCServer<ClientFunction extends object, ServerFunctions extends object>(
  name: string,
  ws: WebSocketServer,
  functions: ServerFunctions,
  options: EventOptions<ClientFunction, ServerFunctions> = {},
) {
  const event = `${name}:rpc`

  const group = createBirpcGroup<ClientFunction, ServerFunctions>(
    functions,
    () => Array.from(ws?.clients || [])
      .map((channel: WebSocketClient): ChannelOptions | undefined => {
        if (channel.socket.readyState === channel.socket.CLOSED)
          return undefined
        const cached = channelCache.get(channel)
        if (cached)
          return cached
        const options: ChannelOptions = {
          on: (fn) => {
            function handler(data: any, source: WebSocketClient) {
              if (!source.socket)
                throw new Error('source.socket is undefined')
              if (channel.socket === source.socket)
                fn(data, source)
            }
            ws.on(event, handler)
            channel.socket.on('close', () => {
              ws.off(event, handler)
            })
          },
          post: (data) => {
            channel.send(event, data)
          },
        }
        channelCache.set(channel, options)
        return options
      })
      .filter(c => !!c),
    options,
  )

  ws.on('connection', () => {
    group.updateChannels()
  })

  return group.broadcast
}

export function createRPCClient<ServerFunctions extends object, ClientFunctions extends object>(
  name: string,
  hot: ViteHotContext | undefined | Promise<ViteHotContext | undefined>,
  functions: ClientFunctions = {} as ClientFunctions,
  options: Omit<BirpcOptions<ServerFunctions, ClientFunctions>, 'on' | 'post'> = {},
) {
  const event = `${name}:rpc`

  const promise = Promise.resolve(hot)
    .then((r) => {
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
