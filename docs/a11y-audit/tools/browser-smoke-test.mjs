import fs from 'node:fs'

const base = 'http://127.0.0.1:5173/'
function parseColor(value) { const m=value.match(/rgba?\\(([^)]+)\\)/); if(!m)return null; const p=m[1].split(',').map(Number); return {r:p[0],g:p[1],b:p[2],a:p[3] ?? 1} }
function composite(fg, bg) { const a=fg.a + bg.a*(1-fg.a); if(!a)return {r:0,g:0,b:0,a:0}; return {r:(fg.r*fg.a+bg.r*bg.a*(1-fg.a))/a,g:(fg.g*fg.a+bg.g*bg.a*(1-fg.a))/a,b:(fg.b*fg.a+bg.b*bg.a*(1-fg.a))/a,a} }
function luminance(c) { const v=[c.r,c.g,c.b].map(x=>x/255).map(x=>x<=.03928?x/12.92:((x+.055)/1.055)**2.4); return .2126*v[0]+.7152*v[1]+.0722*v[2] }
function contrastRatio(fg,bg) { const a=luminance(fg), b=luminance(bg); return (Math.max(a,b)+.05)/(Math.min(a,b)+.05) }
const targets = await (await fetch('http://127.0.0.1:9222/json')).json()
const target = targets.find(t => t.type === 'page')
if (!target?.webSocketDebuggerUrl) throw new Error('No Chrome page target')
const ws = new WebSocket(target.webSocketDebuggerUrl)
let seq = 0
const pending = new Map()
ws.addEventListener('message', ({ data }) => {
  const msg = JSON.parse(data)
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id) }
})
await new Promise((resolve, reject) => { ws.addEventListener('open', resolve); ws.addEventListener('error', reject) })
function call(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++seq; pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params }));
    setTimeout(() => { if (pending.delete(id)) reject(new Error(`Timeout: ${method}`)) }, 10000)
  })
}
async function evaluate(expression) {
  const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || 'Evaluation failed')
  return result.result?.result?.value
}
await call('Page.enable'); await call('Runtime.enable'); await call('DOM.enable'); await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await call('Page.navigate', { url: base }); await new Promise(r => setTimeout(r, 1800))
const measurements = await evaluate(`(() => {
  const els = [...document.querySelectorAll('button, a, input, [role="status"], h1, p')].filter(e => { const r=e.getBoundingClientRect(); return r.width && r.height && getComputedStyle(e).visibility !== 'hidden' }).slice(0, 8)
  return els.map((e,i) => { const s=getComputedStyle(e), r=e.getBoundingClientRect(); return {i, selector:e.tagName.toLowerCase()+(e.id?'#'+e.id:e.className&&typeof e.className==='string'?'.'+e.className.trim().split(/\\s+/).slice(0,2).join('.'):''), text:(e.innerText||e.getAttribute('aria-label')||'').trim().slice(0,80), color:s.color, backgroundColor:s.backgroundColor, fontSize:s.fontSize, lineHeight:s.lineHeight, rect:{x:r.x,y:r.y,width:r.width,height:r.height}} })
})()`)
const button = await evaluate(`(() => { const e=[...document.querySelectorAll('button')].find(e=>{const r=e.getBoundingClientRect();return r.width&&r.height}); if(!e)return null; const r=e.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2, selector:e.tagName.toLowerCase()+(e.className&&typeof e.className==='string'?'.'+e.className.trim().split(/\\s+/).slice(0,2).join('.'):''), text:(e.innerText||e.getAttribute('aria-label')||'').trim().slice(0,80)} })()`)
let hover = null
if (button) {
  hover = { default: await evaluate(`(() => {const e=document.elementFromPoint(${button.x},${button.y});const s=getComputedStyle(e);return {color:s.color,backgroundColor:s.backgroundColor,boxShadow:s.boxShadow}})()`) }
  await call('Input.dispatchMouseEvent', { type:'mouseMoved', x:button.x, y:button.y })
  await new Promise(r=>setTimeout(r,100))
  hover.hover = await evaluate(`(() => {const e=document.elementFromPoint(${button.x},${button.y});const s=getComputedStyle(e);return {color:s.color,backgroundColor:s.backgroundColor,boxShadow:s.boxShadow}})()`)
}
const focus = []
for (let i=0;i<7;i++) { await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9,nativeVirtualKeyCode:9}); await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9,nativeVirtualKeyCode:9}); focus.push(await evaluate(`(() => {const e=document.activeElement,s=getComputedStyle(e);return {tag:e?.tagName,id:e?.id||'',aria:e?.getAttribute('aria-label')||'',text:(e?.innerText||'').trim().slice(0,60),outline:s?.outline,outlineColor:s?.outlineColor,boxShadow:s?.boxShadow}})()`)) }
const dark = await evaluate(`(() => { const b=[...document.querySelectorAll('button')].find(e=>(e.innerText||e.getAttribute('aria-label')||'').trim()==='Настройки'); if(b){b.click(); return true} return false })()`)
await new Promise(r=>setTimeout(r,500))
await evaluate(`(() => { const e=[...document.querySelectorAll('button,a')].find(e=>(e.innerText||'').trim()==='Внешний вид'); if(e){e.click();return true} return false })()`)
await new Promise(r=>setTimeout(r,300))
const settingsProbe = await evaluate(`(() => ({themeControls:[...document.querySelectorAll('button,[role="radio"],[role="combobox"],select')].map(e=>(e.innerText||e.getAttribute('aria-label')||'').trim()).filter(Boolean).filter(t=>/тем|свет|тём|dark|light/i.test(t)).slice(0,10), text:document.body.innerText.slice(-1200), html:document.documentElement.outerHTML.includes('data-theme="dark"')}))()`)
let darkResult = { opened: dark, ...settingsProbe }
if (settingsProbe.themeControls.length) {
  const clicked = await evaluate(`(() => { const e=[...document.querySelectorAll('button,[role="radio"],[role="combobox"]')].find(e=>/тём|dark/i.test((e.innerText||e.getAttribute('aria-label')||''))); if(!e)return false; e.click(); return true })()`)
  await new Promise(r=>setTimeout(r,400))
  darkResult = {...darkResult, clicked, theme:await evaluate('document.documentElement.getAttribute("data-theme")'), sample:await evaluate(`(() => {const e=document.querySelector('button');if(!e)return null;const s=getComputedStyle(e);return {color:s.color,backgroundColor:s.backgroundColor}})()`)}
}
const out = { node: process.version, chrome: (await (await fetch('http://127.0.0.1:9222/json/version')).json()).Browser, url: base, measurements, button, hover, focus, dark:darkResult, axe: { status:'unavailable', reason:'axe-core install failed in temporary environment; package was not resolved' } }
fs.writeFileSync('docs/a11y-audit/browser-smoke-test.json', JSON.stringify(out,null,2))
console.log(JSON.stringify(out,null,2))
ws.close()
