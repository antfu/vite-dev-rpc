import './style.css'
import { createRPCClient } from 'vite-dev-rpc'
import type { RPCFunctions } from './rpc'

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <h1>Calculated at server</h1>
`

if (import.meta.hot) {
  const rpc = createRPCClient<RPCFunctions>('demo', import.meta.hot)

  const div = document.createElement('div')
  div.textContent = `100 + 500 = ${await rpc.add(100, 500)}`
  document.body.appendChild(div)
}
