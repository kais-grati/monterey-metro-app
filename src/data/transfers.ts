import type { Transfer } from '../types';

/**
 * The three interchanges the network recognises.
 *
 * Cuauhtémoc joins lines 1 and 2, Zaragoza joins lines 2 and 3, Félix U. Gómez
 * joins lines 1 and 3.
 *
 * This is the exact list the assignment fixes, and it is also what the diagram
 * shows. No other station is shared between two lines, so no other pair of
 * line-nodes is joined here — the search can only change lines at these three.
 */
export const TRANSFERS: Transfer[] = [
  { stationId: 'cuauhtemoc', between: ['L1', 'L2'] },
  { stationId: 'gral-i-zaragoza', between: ['L2', 'L3'] },
  { stationId: 'felix-u-gomez', between: ['L1', 'L3'] },
];

export const TRANSFER_STATION_IDS = new Set(TRANSFERS.map((t) => t.stationId));
