# Metrorrey · Traza tu viaje

A route planner for lines 1, 2 and 3 of the Monterrey metro. Pick two stations
and it returns the fastest journey in minutes, with the interchanges named.

Everything runs in the browser: the network is a handful of static tables, the
search is a few hundred lines of TypeScript, and there is no server.

```bash
npm install
npm run dev       # http://localhost:5173
npm run verify    # correctness checks on the search
npm run build     # typecheck + production bundle into dist/
```

## The model

The interesting decision in this project is what a node is.

A station is *not* a node. A node is a station **as seen from one line**, so
Cuauhtémoc — where lines 1 and 2 meet — is two nodes joined by an edge that
costs a transfer. Sendero and Alameda, each served by a single line, are one
node each.

That is what makes the cost function honest. A search over plain stations can
tell you a route is 20 minutes but not how many times you have to get off and
wait; a search over `(station, line)` pairs cannot reach the second line without
crossing a priced transfer edge, so the number of interchanges falls out of the
route instead of being reconstructed afterwards.

Costs, all in minutes:

| | |
|---|---|
| one hop between adjacent stations | 2 |
| one interchange | 5 |

### The heuristic

`h(n)` is the straight-line distance from the station to the destination,
divided by the top speed on the network. Both parts are measured from the data
rather than assumed: the distance is taken in the map's own coordinates, and
the top speed is the longest hop on any line. Straight-line distance never
exceeds the distance travelled along the tracks, so `h` can only underestimate
what is left, which is what A\* needs to stay optimal.

It is admissible but weak — it ignores interchanges entirely, and every
interchange only adds cost. On a network this size it saves up to about two
thirds of the expansions Dijkstra would make; `npm run verify` reports the exact
figure.

Origin and destination are both free to sit on any line, so the search is seeded
with every line-specific node of the origin and stops the first time it pops any
node of the destination.

## The map

The map is drawn, not loaded. There is no image of the official diagram in the
bundle — the lines are `<polyline>` elements through coordinates in
`src/data/stations.ts`, laid out schematically the way a printed transit diagram
is, snapping to 45° where it can.

Two conventions carry information rather than decoration:

- the seven underground stations of Línea 2 are drawn as a cased tunnel — two
  stacked strokes — the way the official diagram marks them;
- an interchange is a larger marker with a chalk core, so a station you can
  change trains at looks like a different kind of thing from one you cannot.

Station names sit in a dim tone and come up to full brightness only when they
belong to the route, so the canvas is quiet until there is an answer on it.

Below roughly 900px wide the pane is narrower than a legible diagram, so the map
holds a minimum size and the pane scrolls instead of shrinking the type. It
centres itself on the journey once there is one.

## Verifying the search

`npm run verify` bundles `scripts/verify.ts` and runs it against the real
modules. It checks:

- the graph has the shape the data describes (nodes, ride edges, transfer edges);
- `h` is consistent along every edge, for every destination;
- A\* returns the same total as Dijkstra **on all 1406 ordered pairs** — this is
  the check that catches a search which is fast because it is wrong;
- five journeys whose answers are derivable by hand, one of which is a case
  where the shortest path is *not* the one down the obvious line;
- every station is reachable from every other.

It exits non-zero on failure, so it can gate a build.

## Layout

```
src/
  data/          the network: lines, stations and their coordinates, interchanges
  graph/         buildGraph, heuristics, astar, priorityQueue — no React
  components/    MetroMap and the pieces it composes; the planner panel
  hooks/         useRoute: memoised A* behind a graph built once at load
  types.ts       domain types, including the (station, line) node
scripts/
  verify.ts         correctness checks, run with `npm run verify`
  audit-labels.mjs  measures the rendered map for unreadable names
  screenshot.mjs    measures the layout and photographs it at any viewport
```

The two browser scripts drive a headless Chrome over the DevTools protocol:

```bash
npm run preview &
chrome --headless --remote-debugging-port=9222 about:blank &
npm run audit:labels -- http://localhost:4173/ santa-lucia exposicion
npm run shot -- http://localhost:4173/ /tmp/map.png 430 932 santa-lucia exposicion
```

`graph/` has no dependency on React or on the DOM, so the search can be run and
tested on its own.

## Notes on the data

The three lines are the ones the assignment covers; Metrobús, Metroenlace and
the Transmetro feeders are out of scope.

Alameda is served by Línea 2 alone and Col. Obrera by Línea 3 alone. Línea 1
runs Del Golfo → Félix U. Gómez without dipping through them — the arrangement
in place since Línea 3 was extended to Zaragoza. The three interchanges are
Cuauhtémoc, Félix U. Gómez and Gral. I. Zaragoza, and they are the only places a
passenger can change lines.

Coordinates are schematic. They are chosen so the topology reads at a glance and
so no station name is crossed by a track or another name — a constraint that is
checked by rendering the map in a browser and measuring the text boxes, not by
eye.
