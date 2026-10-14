/**
 * Ask the browser's own layout engine whether the map is legible.
 *
 *   npm run preview &
 *   chrome --headless --remote-debugging-port=9222 about:blank &
 *   node scripts/audit-labels.mjs [url] [origin] [destination]
 *
 * The station names are placed by hand, one `labelSide` at a time, against
 * tracks that run at every angle. Reading a screenshot catches the collisions
 * you happen to look at; this catches all of them, as numbers, because the
 * boxes come from the renderer rather than from a guess about text metrics.
 *
 * It reports four things: names a track is drawn through, names overlapping
 * other names, names sitting on somebody else's marker, and names hidden under
 * an Origen/Destino pill. Anything listed is a defect — there is no "expected"
 * line. Run it with no route set and with a few routes; the pills only exist
 * once there is one.
 */
const PORT = process.env.CDP_PORT ?? '9222';
const url = process.argv[2] ?? 'http://localhost:4173/';
const origin = process.argv[3] ?? '';
const destination = process.argv[4] ?? '';

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
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
};

await send('Page.enable');
await send('Runtime.enable');
await send('Network.enable');
await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Emulation.setDeviceMetricsOverride', {
  width: 1600,
  height: 1000,
  deviceScaleFactor: 1,
  mobile: false,
});
await send('Page.navigate', { url });
await new Promise((r) => setTimeout(r, 2500));

if (origin && destination) {
  await evaluate(`(() => {
    const selects = [...document.querySelectorAll('aside select')];
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
    setter.call(selects[0], ${JSON.stringify(origin)});
    selects[0].dispatchEvent(new Event('change', { bubbles: true }));
    setter.call(selects[1], ${JSON.stringify(destination)});
    selects[1].dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await new Promise((r) => setTimeout(r, 1400));
}

const report = await evaluate(`(() => {
  const svg = document.querySelector('svg[role="img"]');
  const layerOf = (el) => el.closest('[data-layer]')?.getAttribute('data-layer') ?? 'track';

  // --- station names -----------------------------------------------------
  const labels = [];
  for (const t of svg.querySelectorAll('text')) {
    // A badge's own text sits on an opaque pill by construction; it would
    // otherwise report itself, and any track the pill covers, as a collision.
    if (t.parentElement?.querySelector(':scope > rect')) continue;
    const b = t.getBBox();
    if (!b.width) continue;
    labels.push({
      id: t.getAttribute('data-station') || '',
      name: (t.textContent || '').trim(),
      layer: layerOf(t),
      x: b.x, y: b.y, right: b.x + b.width, bottom: b.y + b.height,
    });
  }

  // --- everything with a stroke ------------------------------------------
  const ink = [];
  for (const el of svg.querySelectorAll('polyline, path, line')) {
    if (!el.getAttribute('stroke') && !getComputedStyle(el).stroke) continue;
    const sw = parseFloat(getComputedStyle(el).strokeWidth) || 0;
    if (!sw) continue;
    const layer = layerOf(el);
    if (el.tagName.toLowerCase() === 'polyline') {
      const pts = el.getAttribute('points').trim().split(/\\s+/).map((p) => p.split(',').map(Number));
      for (let i = 1; i < pts.length; i++) ink.push({ layer, a: pts[i - 1], b: pts[i], sw });
    } else if (el.tagName.toLowerCase() === 'path') {
      const len = el.getTotalLength();
      const steps = Math.max(2, Math.ceil(len / 4));
      let prev = el.getPointAtLength(0);
      for (let i = 1; i <= steps; i++) {
        const p = el.getPointAtLength((len * i) / steps);
        ink.push({ layer, a: [prev.x, prev.y], b: [p.x, p.y], sw });
        prev = p;
      }
    }
  }

  // --- markers and badges -------------------------------------------------
  const dots = [];
  for (const c of svg.querySelectorAll('circle')) {
    // Only the visible ring: the transparent r=17 hit target would otherwise
    // report every neighbour as a collision.
    if (!c.getAttribute('stroke')) continue;
    const r = parseFloat(c.getAttribute('r') || '0');
    if (!r) continue;
    dots.push({ name: c.closest("g")?.getAttribute("data-station") || '?', cx: +c.getAttribute('cx'), cy: +c.getAttribute('cy'), r });
  }
  const pills = [];
  for (const g of svg.querySelectorAll('g')) {
    const rect = g.querySelector(':scope > rect');
    if (!rect) continue;
    const text = g.querySelector(':scope > text');
    if (!text) continue;
    pills.push({
      name: (text.textContent || '').trim(),
      x: +rect.getAttribute('x'), y: +rect.getAttribute('y'),
      right: +rect.getAttribute('x') + +rect.getAttribute('width'),
      bottom: +rect.getAttribute('y') + +rect.getAttribute('height'),
    });
  }

  const overlap = (a, b) =>
    Math.min(a.right, b.right) - Math.max(a.x, b.x) > 0.5 &&
    Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y) > 0.5;

  // Does a stroked segment pass through a box? Sampled along the segment; the
  // box is inset by the stroke's own half-width so a track merely touching an
  // edge is not reported.
  const crosses = (seg, box) => {
    const steps = Math.max(2, Math.ceil(Math.hypot(seg.b[0] - seg.a[0], seg.b[1] - seg.a[1]) / 2));
    const inset = seg.sw / 2;
    for (let i = 0; i <= steps; i++) {
      const x = seg.a[0] + ((seg.b[0] - seg.a[0]) * i) / steps;
      const y = seg.a[1] + ((seg.b[1] - seg.a[1]) * i) / steps;
      if (x > box.x + inset && x < box.right - inset && y > box.y + inset && y < box.bottom - inset) return true;
    }
    return false;
  };

  const out = { struckThrough: [], overlappingNames: [], nameOnMarker: [], nameUnderPill: [] };

  for (const label of labels) {
    const box = { x: label.x + 1, y: label.y + 1, right: label.right - 1, bottom: label.bottom - 1 };
    const hit = new Set();
    for (const seg of ink) if (crosses(seg, box)) hit.add(seg.layer);
    if (hit.size) out.struckThrough.push({ name: label.name, by: [...hit] });
  }

  const fmt = (l) => l.name + ' x[' + l.x.toFixed(1) + ',' + l.right.toFixed(1) + '] y[' + l.y.toFixed(1) + ',' + l.bottom.toFixed(1) + ']';
  for (let i = 0; i < labels.length; i++) {
    for (let j = i + 1; j < labels.length; j++) {
      if (overlap(labels[i], labels[j])) {
        out.overlappingNames.push(fmt(labels[i]) + '  ><  ' + fmt(labels[j]));
      }
    }
  }

  for (const label of labels) {
    for (const d of dots) {
      // A name is meant to sit near its own marker; only other markers matter.
      if (label.id && label.id === d.name) continue;
      if (overlap(label, { x: d.cx - d.r, y: d.cy - d.r, right: d.cx + d.r, bottom: d.cy + d.r })) {
        out.nameOnMarker.push({ name: label.name, marker: d.name });
      }
    }
  }

  for (const label of labels) {
    for (const p of pills) {
      if (overlap(label, p)) out.nameUnderPill.push({ name: label.name, pill: p.name });
    }
  }

  return out;
})()`);

const line = (s) => console.log(s);
line('--- station names struck through by a track ---');
if (!report.struckThrough.length) line('  none');
for (const v of report.struckThrough) line(`  ${v.name}  <- ${v.by.join(', ')}`);

line('--- overlapping names ---');
if (!report.overlappingNames.length) line('  none');
for (const v of report.overlappingNames) line(`  ${v}`);

line('--- names sitting on a marker ---');
if (!report.nameOnMarker.length) line('  none');
for (const v of report.nameOnMarker) line(`  ${v.name}  on  ${v.marker}`);

line('--- names under an Origen/Destino pill ---');
if (!report.nameUnderPill.length) line('  none');
for (const v of report.nameUnderPill) line(`  ${v.name}  under  ${v.pill}`);

ws.close();
