import { STATION_BY_ID } from '../data/stations';
import { maxSchematicSpeed, schematicDistance } from './buildGraph';

/**
 * Heuristic functions h(n): an estimate of the minutes still to travel from a
 * station to the destination.
 *
 * A* only returns an optimal route if h never overestimates the true remaining
 * cost. Both heuristics here respect that.
 */
export type Heuristic = (stationId: string) => number;

/**
 * h = 0. A* degrades to Dijkstra: optimal, but it expands in every direction
 * instead of leaning towards the destination. Kept as the reference to check
 * the informed heuristic against.
 */
export function zeroHeuristic(): Heuristic {
  return () => 0;
}

/**
 * h = straight-line distance to the destination ÷ the network's top speed.
 *
 * Straight-line distance is never longer than the distance actually travelled
 * along the tracks, and the top speed is measured from the longest hop on any
 * line, so dividing one by the other can only ever under-estimate the time
 * left. Two things make it safely conservative:
 *
 *  - it ignores transfers entirely, and every transfer only adds cost;
 *  - schematic distance is not real distance, so the estimate is loose.
 *
 * The result is admissible but weak — it barely prunes a 38-station network.
 * A tighter admissible option is to add the minimum number of interchanges
 * still required, priced at TRANSFER_MINUTES.
 */
export function geographicHeuristic(destinationId: string): Heuristic {
  const speed = maxSchematicSpeed();
  const destination = STATION_BY_ID[destinationId];

  return (stationId: string) => {
    if (stationId === destinationId) return 0;
    return schematicDistance(stationId, destination.id) / speed;
  };
}
