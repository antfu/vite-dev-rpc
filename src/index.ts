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
  hot: ViteHotContext | Promise<ViteHotContext>,
  functions: ClientFunctions = {} as ClientFunctions,
  options: Omit<BirpcOptions<ServerFunctions>, 'on' | 'post'> = {},
) {
  const event = `${name}:rpc`
  return createBirpc<ServerFunctions, ClientFunctions>(
    functions,
    {
      ...options,
      on: async (fn) => {
        (await hot).on(event, fn)
      },
      post: async (data) => {
        (await hot).send(event, data)
      },
    },
  )
}
