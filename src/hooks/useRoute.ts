import { useMemo } from 'react';
import { findRoute } from '../graph/astar';
import { buildGraph } from '../graph/buildGraph';
import type { RouteResult } from '../types';

/** The network never changes at runtime, so the graph is built once. */
const GRAPH = buildGraph();

/**
 * Resolve the best route between two stations.
 *
 * The search itself is a pure function over an immutable graph, so this hook is
 * only here to keep it out of the render path — it recomputes when an endpoint
 * changes and not on every hover.
 */
export function useRoute(originId: string, destinationId: string): RouteResult | null {
  return useMemo(() => {
    if (!originId || !destinationId || originId === destinationId) return null;
    return findRoute(GRAPH, originId, destinationId);
  }, [originId, destinationId]);
}
