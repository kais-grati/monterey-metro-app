import type { Edge, Graph, Node, RouteResult, RouteStep } from '../types';
import { nodeKey } from './buildGraph';
import { geographicHeuristic, type Heuristic } from './heuristics';
import { PriorityQueue } from './priorityQueue';

interface CameFrom {
  key: string;
  kind: Edge['kind'];
  cost: number;
}

export interface SearchOptions {
  /** Defaults to the straight-line heuristic. */
  heuristic?: (destinationId: string) => Heuristic;
  graph: Graph;
}

/**
 * A* over the (station, line) graph.
 *
 * f(n) = g(n) + h(n), where
 *   g(n) is the minutes actually spent so far — two per hop ridden, five per
 *        interchange made;
 *   h(n) is the estimate from `heuristics.ts`, which never overestimates, so
 *        the first time the destination is popped the route is optimal.
 *
 * Both origin and destination may sit on more than one line, so the search is
 * seeded with every line-specific node of the origin and stops at the first
 * node of the destination it pops. That means the traveller is free to start
 * and finish on whichever line suits them, rather than being forced onto one.
 */
export function findRoute(
  graph: Graph,
  originId: string,
  destinationId: string,
  options: Omit<SearchOptions, 'graph'> = {},
): RouteResult | null {
  if (originId === destinationId) return null;

  const buildHeuristic = options.heuristic ?? geographicHeuristic;
  const heuristic = buildHeuristic(destinationId);

  const originNodes = graph.nodes.filter((node) => node.stationId === originId);
  if (originNodes.length === 0) return null;

  const gScore = new Map<string, number>();
  const cameFrom = new Map<string, CameFrom>();
  const closed = new Set<string>();
  const open = new PriorityQueue<string>();

  for (const node of originNodes) {
    const key = nodeKey(node);
    gScore.set(key, 0);
    open.push(key, heuristic(originId));
  }

  let expandedNodes = 0;
  let destinationKey: string | null = null;

  while (open.size > 0) {
    const currentKey = open.pop()!;
    if (closed.has(currentKey)) continue;
    closed.add(currentKey);
    expandedNodes += 1;

    const currentG = gScore.get(currentKey)!;
    const at = currentKey.indexOf('#');
    const stationId = currentKey.slice(0, at);

    if (stationId === destinationId) {
      destinationKey = currentKey;
      break;
    }

    for (const edge of graph.adjacency.get(currentKey) ?? []) {
      const neighbourKey = nodeKey(edge.to);
      const tentativeG = currentG + edge.cost;
      const knownG = gScore.get(neighbourKey);

      if (knownG === undefined || tentativeG < knownG) {
        gScore.set(neighbourKey, tentativeG);
        cameFrom.set(neighbourKey, { key: currentKey, kind: edge.kind, cost: edge.cost });
        open.push(neighbourKey, tentativeG + heuristic(edge.to.stationId));

        // A consistent heuristic never improves a node already settled; this
        // only matters if a bolder heuristic is substituted later.
        closed.delete(neighbourKey);
      }
    }
  }

  if (destinationKey === null) return null;

  return reconstruct(graph, cameFrom, destinationKey, gScore.get(destinationKey)!, expandedNodes);
}

function reconstruct(
  graph: Graph,
  cameFrom: Map<string, CameFrom>,
  destinationKey: string,
  totalMinutes: number,
  expandedNodes: number,
): RouteResult {
  const nodeByKey = new Map<string, Node>();
  for (const node of graph.nodes) nodeByKey.set(nodeKey(node), node);

  // Walk the parent chain back to an origin node.
  const rawPath: Node[] = [];
  let rideMinutes = 0;
  let transferMinutes = 0;

  let key: string | undefined = destinationKey;
  while (key !== undefined) {
    rawPath.push(nodeByKey.get(key)!);

    const arrival: CameFrom | undefined = cameFrom.get(key);
    if (arrival === undefined) break;
    if (arrival.kind === 'ride') rideMinutes += arrival.cost;
    else transferMinutes += arrival.cost;
    key = arrival.key;
  }

  rawPath.reverse();

  // A change of lines produces two consecutive nodes at the same station — the
  // line you arrive on and the line you leave on. Fold them into a single step
  // that names the line you continue on and flags the interchange.
  const steps: RouteStep[] = [];
  for (let i = 0; i < rawPath.length; i += 1) {
    const node = rawPath[i];
    const previous = rawPath[i - 1];
    const next = rawPath[i + 1];

    if (next !== undefined && next.stationId === node.stationId) continue;

    steps.push({
      stationId: node.stationId,
      lineId: node.lineId,
      isTransfer: previous !== undefined && previous.stationId === node.stationId,
    });
  }

  return {
    steps,
    totalMinutes,
    rideMinutes,
    transferMinutes,
    transfers: steps.filter((step) => step.isTransfer).length,
    stationCount: steps.length,
    expandedNodes,
  };
}
