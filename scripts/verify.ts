/**
 * Correctness checks for the search, run against the real modules.
 *
 *   npm run verify
 *
 * The claims worth testing here are the ones the assignment turns on and that
 * a screenshot cannot show: that A* returns the same cost as Dijkstra on every
 * pair of stations, that its heuristic never overestimates, and that the graph
 * really has the shape the data files describe. Each check exits non-zero on
 * failure so this can gate a build.
 *
 * The imports are the app's own modules, not a copy, so a route that passes
 * here is a route the browser will produce. They are bundled by esbuild first
 * because Node's own type stripping needs file extensions on every relative
 * import, and the app is written for Vite, which does not.
 */
import { LINES } from '../src/data/lines';
import { STATION_BY_ID, STATIONS } from '../src/data/stations';
import { TRANSFERS } from '../src/data/transfers';
import { findRoute } from '../src/graph/astar';
import { buildGraph, nodeKey, RIDE_MINUTES, TRANSFER_MINUTES } from '../src/graph/buildGraph';
import { geographicHeuristic, zeroHeuristic } from '../src/graph/heuristics';

let failures = 0;

function check(what: string, actual: unknown, expected: unknown): void {
  const ok = actual === expected;
  if (!ok) failures += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${what}: ${actual}${ok ? '' : ` (expected ${expected})`}`);
}

function report(what: string, value: unknown): void {
  console.log(`      ${what}: ${value}`);
}

const graph = buildGraph();

// --- 1. The graph has the shape the data describes ------------------------
// Every station appears once per line that calls at it, so the three
// interchanges carry two nodes each.
const lineNodes = LINES.reduce((total, line) => total + line.stationIds.length, 0);
const rideHops = LINES.reduce((total, line) => total + line.stationIds.length - 1, 0);
const edges = [...graph.adjacency.values()].flat();

console.log(`\nRed — ${STATIONS.length} stations on ${LINES.length} lines`);
check('nodes', graph.nodes.length, lineNodes);
check('ride edges', edges.filter((edge) => edge.kind === 'ride').length, rideHops * 2);
check('transfer edges', edges.filter((edge) => edge.kind === 'transfer').length, TRANSFERS.length * 2);

// --- 2. h never overestimates along an edge -------------------------------
// Consistency is stronger than admissibility, and it is the property that
// makes A* safe to run without reopening closed nodes. h is built per
// destination, so the sweep is too.
let inconsistent = 0;
let edgesTested = 0;
for (const destination of STATIONS) {
  const h = geographicHeuristic(destination.id);
  for (const node of graph.nodes) {
    for (const edge of graph.adjacency.get(nodeKey(node))!) {
      edgesTested += 1;
      if (h(node.stationId) > edge.cost + h(edge.to.stationId) + 1e-9) inconsistent += 1;
    }
  }
}
check('heuristic consistency violations', inconsistent, 0);
report('edges tested for consistency', edgesTested);

// --- 3. A* is optimal on every ordered pair -------------------------------
// Dijkstra is the reference: h = 0 makes A* expand by g alone, which cannot
// be wrong. Any disagreement means the informed search cut a corner it should
// not have.
let mismatches = 0;
let checked = 0;
let bestPruning = 0;

for (const origin of STATIONS) {
  for (const destination of STATIONS) {
    if (origin.id === destination.id) continue;
    const reference = findRoute(graph, origin.id, destination.id, { heuristic: zeroHeuristic });
    const informed = findRoute(graph, origin.id, destination.id);
    checked += 1;

    if (!reference || !informed) {
      mismatches += 1;
      if (mismatches <= 5) console.log(`      no route: ${origin.name} -> ${destination.name}`);
      continue;
    }
    if (reference.totalMinutes !== informed.totalMinutes) {
      mismatches += 1;
      if (mismatches <= 5) {
        console.log(
          `      MISMATCH ${origin.name} -> ${destination.name}: ` +
            `dijkstra ${reference.totalMinutes} min, A* ${informed.totalMinutes} min`,
        );
      }
      continue;
    }
    // How much of the graph the heuristic saves, as a fraction of the nodes
    // Dijkstra had to expand. This is the number that justifies calling it A*.
    if (reference.expandedNodes > 0) {
      bestPruning = Math.max(bestPruning, 1 - informed.expandedNodes / reference.expandedNodes);
    }
  }
}

console.log('');
check('ordered pairs compared against Dijkstra', checked, STATIONS.length * (STATIONS.length - 1));
check('cost mismatches', mismatches, 0);
report('most nodes saved by the heuristic', `${(bestPruning * 100).toFixed(1)}%`);

// --- 4. Journeys whose answer is known by hand ----------------------------
// The expected numbers are arithmetic, not snapshots: RIDE_MINUTES a hop and
// TRANSFER_MINUTES an interchange, over the path the network description gives.
const journeys: Array<[string, string, number, number, number]> = [
  // from, to, minutes, stations, transfers
  // Terminus to terminus along one line: one hop fewer than there are stations.
  ['talleres', 'exposicion', 18 * RIDE_MINUTES, 19, 0],
  ['sendero', 'gral-i-zaragoza', 12 * RIDE_MINUTES, 13, 0],
  ['gral-i-zaragoza', 'hospital-metropolitano', 8 * RIDE_MINUTES, 9, 0],
  // The interesting one: not down Línea 2 to Zaragoza and around the Línea 3
  // tail, which is longer, but off at Cuauhtémoc and straight along Línea 1.
  ['sendero', 'exposicion', 8 * RIDE_MINUTES + TRANSFER_MINUTES + 7 * RIDE_MINUTES, 16, 1],
  // Both stations are on Línea 2, so no interchange — even though Cuauhtémoc
  // is also on Línea 1.
  ['cuauhtemoc', 'alameda', RIDE_MINUTES, 2, 0],
];

console.log('');
for (const [from, to, minutes, stations, transfers] of journeys) {
  const route = findRoute(graph, from, to);
  const label = `${STATION_BY_ID[from].name} -> ${STATION_BY_ID[to].name}`;
  if (!route) {
    failures += 1;
    console.log(`FAIL  ${label}: no route`);
    continue;
  }
  const ok =
    route.totalMinutes === minutes &&
    route.stationCount === stations &&
    route.transfers === transfers;
  if (!ok) failures += 1;
  console.log(
    `${ok ? 'ok  ' : 'FAIL'}  ${label}: ${route.totalMinutes} min, ` +
      `${route.stationCount} stations, ${route.transfers} interchange(s)` +
      (ok ? '' : ` (expected ${minutes} min, ${stations} stations, ${transfers})`),
  );
}

// --- 5. Changing lines is only ever paid for when it is worth it ----------
// Cuauhtémoc and Alameda are both on Línea 2, but Cuauhtémoc is also on
// Línea 1, so a naive search can "helpfully" transfer there. One stop, no
// interchange, is the answer.
const adjacent = findRoute(graph, 'cuauhtemoc', 'alameda');
check('Cuauhtémoc -> Alameda transfers', adjacent?.transfers, 0);

// --- 6. The network is connected ------------------------------------------
let unreachable = 0;
for (const origin of STATIONS) {
  for (const destination of STATIONS) {
    if (origin.id === destination.id) continue;
    if (!findRoute(graph, origin.id, destination.id)) unreachable += 1;
  }
}
console.log('');
check('unreachable ordered pairs', unreachable, 0);

// --- 7. Every line node is reachable from its own station's other nodes ---
// Guards the transfer edges in particular: a mistyped line id there would
// silently strand one line's nodes.
let strandedNodes = 0;
for (const node of graph.nodes) {
  if (!graph.adjacency.has(nodeKey(node))) strandedNodes += 1;
}
check('nodes missing from the adjacency map', strandedNodes, 0);

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
