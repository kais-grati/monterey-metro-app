/**
 * Measure and photograph the running app, at a chosen viewport, with a route.
 *
 *   npm run preview &
 *   chrome --headless --remote-debugging-port=9222 about:blank &
 *   node scripts/screenshot.mjs [url] [out.png] [width] [height] [from] [to]
 *
 * Prints the box model of the layout and of the SVG inside it, the scale the
 * viewBox is drawn at, the bounds of everything drawn, and anything drawn
 * outside the viewBox. This is how the map pane was caught pushing Línea 1 off
 * the right-hand edge: the SVG carried an intrinsic width the flex row would
 * not shrink below, which a screenshot at one window size does not reveal.
 */
const PORT = process.env.CDP_PORT ?? '9222';
const url = process.argv[2] ?? 'http://localhost:4173/';
const shotPath = process.argv[3] ?? '/tmp/cdp-shot.png';
const width = Number(process.argv[4] ?? 1600);
const height = Number(process.argv[5] ?? 1000);
const origin = process.argv[6] ?? '';
const destination = process.argv[7] ?? '';

const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const page = list.find((t) => t.type === 'page');
if (!page) throw new Error('no page target');

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true });
  ws.addEventListener('error', reject, { once: true });
});

let nextId = 1;
const pending = new Map();
ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(JSON.stringify(msg.error)));
    else resolve(msg.result);
  }
});

function send(method, params = {}) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
};

await send('Page.enable');
await send('Runtime.enable');
await send('Network.enable');
await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Emulation.setDeviceMetricsOverride', {
  width,
  height,
  deviceScaleFactor: 1,
  mobile: false,
});

await send('Page.navigate', { url });
await new Promise((r) => setTimeout(r, 2500));

if (origin && destination) {
  await evaluate(`(() => {
    const selects = [...document.querySelectorAll('aside select')];
    const setValue = (el, value) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
      setter.call(el, value);
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    setValue(selects[0], ${JSON.stringify(origin)});
    setValue(selects[1], ${JSON.stringify(destination)});
    return selects.length;
  })()`);
  await new Promise((r) => setTimeout(r, 1400));
}

const measurements = await evaluate(`(() => {
  const svg = document.querySelector('svg[role="img"]');
  const rect = svg.getBoundingClientRect();
  const viewBox = svg.viewBox.baseVal;
  const scale = Math.min(rect.width / viewBox.width, rect.height / viewBox.height);

  const overflowing = [];
  const bounds = { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity };
  for (const node of svg.querySelectorAll('text, circle, path, polyline, rect')) {
    let box;
    try { box = node.getBBox(); } catch { continue; }
    if (!box || (box.width === 0 && box.height === 0)) continue;
    const kind = node.tagName.toLowerCase();
    const outer = node.closest('[data-layer]')?.getAttribute('data-layer') ?? kind;
    if (outer === 'ridge') continue;
    bounds.left = Math.min(bounds.left, box.x);
    bounds.right = Math.max(bounds.right, box.x + box.width);
    bounds.top = Math.min(bounds.top, box.y);
    bounds.bottom = Math.max(bounds.bottom, box.y + box.height);
    if (box.x < viewBox.x || box.x + box.width > viewBox.x + viewBox.width ||
        box.y < viewBox.y || box.y + box.height > viewBox.y + viewBox.height) {
      overflowing.push({
        tag: kind,
        text: (node.textContent || '').trim().slice(0, 30),
        x: +box.x.toFixed(1), y: +box.y.toFixed(1),
        right: +(box.x + box.width).toFixed(1), bottom: +(box.y + box.height).toFixed(1),
      });
    }
  }

  const box = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      tag: el.tagName.toLowerCase() + '.' + (el.className || '').toString().slice(0, 40),
      left: +r.left.toFixed(1), width: +r.width.toFixed(1), height: +r.height.toFixed(1),
      minWidth: cs.minWidth, display: cs.display, flex: cs.flex, padding: cs.padding,
    };
  };

  return {
    innerWidth: window.innerWidth,
    root: box(document.querySelector('#root')),
    rootChild: box(document.querySelector('#root > *')),
    main: box(document.querySelector('main')),
    aside: box(document.querySelector('aside')),
    body: box(document.body),
    svgRect: { left: +rect.left.toFixed(1), top: +rect.top.toFixed(1), width: +rect.width.toFixed(1), height: +rect.height.toFixed(1) },
    viewBox: { x: viewBox.x, y: viewBox.y, width: viewBox.width, height: viewBox.height },
    scale: +scale.toFixed(4),
    paneScroll: {
      left: Math.round(svg.parentElement.scrollLeft),
      top: Math.round(svg.parentElement.scrollTop),
      scrollWidth: svg.parentElement.scrollWidth,
      clientWidth: svg.parentElement.clientWidth,
    },
    contentBounds: {
      left: +bounds.left.toFixed(1), right: +bounds.right.toFixed(1),
      top: +bounds.top.toFixed(1), bottom: +bounds.bottom.toFixed(1),
    },
    overflowing,
  };
})()`);

console.log(JSON.stringify(measurements, null, 2));

const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
const { writeFileSync } = await import('node:fs');
writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
console.log(`screenshot: ${shotPath}`);
ws.close();
