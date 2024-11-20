import type { ClientFunctions, ServerFunctions } from './rpc'
import { createRPCClient } from 'vite-dev-rpc'
import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <h1>vite-dev-rpc</h1>
  <div id="output"></div>
  <button id="button">Update</button>
  <div id="msg"></div>
`

if (import.meta.hot) {
  const div = document.getElementById('output')!
  const button = document.getElementById('button')!
  const msg = document.getElementById('msg')!
  button.addEventListener('click', update)

  const rpc = createRPCClient<ServerFunctions, ClientFunctions>('demo', import.meta.hot, {
    alert(message) {
      msg.textContent = message
    },
  })

  async function update() {
    const a = Math.floor(Math.random() * 100)
    const b = Math.floor(Math.random() * 100)
    div.textContent = `${a} + ${b} = ${await rpc.add(a, b)}`
  }

  update()
}
