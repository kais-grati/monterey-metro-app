/**
 * Domain types for the Metrorrey network and for A* search over it.
 *
 * The network covers lines 1, 2 and 3 only. Everything else drawn on the
 * official map (Metrobús, Metroenlace, the Transmetro feeders) is out of scope.
 */

export type LineId = 'L1' | 'L2' | 'L3';

/**
 * Where a station name is drawn relative to its marker. Set per station
 * because the three lines run at different angles and a single rule puts
 * half the names on top of a track.
 *
 * `below` and `below-far` differ only in how far out the name sits. A name
 * centred under a marker collides with the track whenever the run leaves that
 * marker on a shallow diagonal — the track is still crossing the band of text
 * by the time it reaches the name's right-hand edge. `below-far` pushes the
 * name past that crossing, which is what Línea 1's eastern arm needs.
 */
export type LabelSide = 'left' | 'right' | 'above' | 'below' | 'below-far';

export interface Station {
  /** Stable slug, used as the graph key and in the URL hash. */
  id: string;
  name: string;
  /** Schematic coordinates in the map's own viewBox units. */
  x: number;
  y: number;
  labelSide: LabelSide;
  /** Listed as underground in the official network description. */
  underground?: boolean;
}

export interface MetroLine {
  id: LineId;
  name: string;
  /** CSS custom property holding the line colour. */
  colorVar: string;
  /** Ordered from one terminus to the other. */
  stationIds: string[];
}

/** A station where two lines meet and a passenger may change trains. */
export interface Transfer {
  stationId: string;
  between: [LineId, LineId];
}

/**
 * A search node is a station *as seen from one line*. Cuauhtémoc is therefore
 * two nodes, and changing between them costs a transfer. This is what lets the
 * search count and price transfers instead of treating the network as a plain
 * station-to-station graph.
 */
export interface Node {
  stationId: string;
  lineId: LineId;
}

export type EdgeKind = 'ride' | 'transfer';

export interface Edge {
  to: Node;
  kind: EdgeKind;
  /** Minutes. */
  cost: number;
  /** Only present on transfer edges. */
  toLineId?: LineId;
}

export interface Graph {
  /** Keyed by `nodeKey()`. */
  adjacency: Map<string, Edge[]>;
  /** Every node in the network. */
  nodes: Node[];
}

/** One leg of a resolved route. */
export interface RouteStep {
  stationId: string;
  lineId: LineId;
  /** True when this step begins by changing lines at this station. */
  isTransfer: boolean;
}

export interface RouteResult {
  steps: RouteStep[];
  /** Total journey time in minutes, transfers included. */
  totalMinutes: number;
  rideMinutes: number;
  transferMinutes: number;
  /** Number of line changes. */
  transfers: number;
  /** Number of stations visited, origin and destination included. */
  stationCount: number;
  /** Stations expanded by the search, for inspection. */
  expandedNodes: number;
}
