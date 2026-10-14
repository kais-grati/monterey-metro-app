import { LINES } from '../data/lines';
import { TRANSFERS } from '../data/transfers';
import { STATION_BY_ID, STATIONS } from '../data/stations';
import type { Edge, Graph, LineId, Node } from '../types';

/** Minutes to travel between two adjacent stations. */
export const RIDE_MINUTES = 2;

/**
 * Minutes added for changing lines: the walk between platforms plus the wait
 * for the next train. Priced separately from riding so the search can trade a
 * longer route against one fewer interchange.
 */
export const TRANSFER_MINUTES = 5;

export const nodeKey = (node: Node): string => `${node.stationId}#${node.lineId}`;

/**
 * Straight-line distance between two stations in schematic units.
 *
 * Schematic coordinates are not real distances, but they are monotonic with
 * them along a line, which is all the heuristic in `heuristics.ts` needs.
 */
export function schematicDistance(aId: string, bId: string): number {
  const a = STATION_BY_ID[aId];
  const b = STATION_BY_ID[bId];
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Build the search graph.
 *
 * Nodes are stations *as seen from a particular line*, so a station served by
 * two lines becomes two nodes joined by a priced transfer edge. Riding edges
 * link consecutive stations along a line. Modelling it this way is what lets
 * the cost function count interchanges rather than silently treating the
 * network as a flat map of stations.
 */
export function buildGraph(): Graph {
  const adjacency = new Map<string, Edge[]>();
  const nodes: Node[] = [];

  const addNode = (node: Node) => {
    nodes.push(node);
    adjacency.set(nodeKey(node), []);
  };

  const addEdge = (from: Node, edge: Edge) => {
    adjacency.get(nodeKey(from))!.push(edge);
  };

  // One node per (station, line) pair.
  for (const line of LINES) {
    for (const stationId of line.stationIds) {
      addNode({ stationId, lineId: line.id });
    }
  }

  // Ride edges, both directions.
  for (const line of LINES) {
    for (let i = 0; i < line.stationIds.length - 1; i += 1) {
      const a: Node = { stationId: line.stationIds[i], lineId: line.id };
      const b: Node = { stationId: line.stationIds[i + 1], lineId: line.id };

      addEdge(a, { to: b, kind: 'ride', cost: RIDE_MINUTES });
      addEdge(b, { to: a, kind: 'ride', cost: RIDE_MINUTES });
    }
  }

  // Transfer edges between the two line-specific nodes of an interchange.
  for (const transfer of TRANSFERS) {
    const [lineA, lineB] = transfer.between;
    const a: Node = { stationId: transfer.stationId, lineId: lineA };
    const b: Node = { stationId: transfer.stationId, lineId: lineB };

    if (!adjacency.has(nodeKey(a)) || !adjacency.has(nodeKey(b))) {
      throw new Error(
        `Transfer at "${transfer.stationId}" names a line that does not serve it.`,
      );
    }

    addEdge(a, { to: b, kind: 'transfer', cost: TRANSFER_MINUTES, toLineId: lineB });
    addEdge(b, { to: a, kind: 'transfer', cost: TRANSFER_MINUTES, toLineId: lineA });
  }

  return { adjacency, nodes };
}

/**
 * The fastest the network can move a passenger, in schematic units per minute.
 *
 * Measured from the data rather than hard-coded: the longest hop on any line
 * divided by `RIDE_MINUTES`. The heuristic divides distance by this figure, so
 * it must be a true upper bound — derive it from the graph and it stays
 * admissible when stations are added or the layout is redrawn.
 */
export function maxSchematicSpeed(): number {
  let longestHop = 0;

  for (const line of LINES) {
    for (let i = 0; i < line.stationIds.length - 1; i += 1) {
      longestHop = Math.max(longestHop, schematicDistance(line.stationIds[i], line.stationIds[i + 1]));
    }
  }

  return longestHop / RIDE_MINUTES;
}

/** Stations that can be reached from a station, and on which lines. */
export function linesServingStation(stationId: string): LineId[] {
  const lineIds: LineId[] = [];
  for (const line of LINES) {
    if (line.stationIds.includes(stationId)) lineIds.push(line.id);
  }
  return lineIds;
}

export const ALL_STATION_IDS = STATIONS.map((station) => station.id);
