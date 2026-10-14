import { LINE_BY_ID, TUNNEL } from '../data/lines';
import { STATION_BY_ID } from '../data/stations';
import type { LabelSide, RouteStep } from '../types';

export type TextAnchor = 'start' | 'middle' | 'end';

/** `points` attribute for a polyline through the given stations, in order. */
export function polylineThrough(stationIds: string[]): string {
  return stationIds
    .map((id) => {
      const station = STATION_BY_ID[id];
      return `${station.x},${station.y}`;
    })
    .join(' ');
}

/** The stretch of Línea 2 that runs in tunnel, termini included. */
export function tunnelStationIds(): string[] {
  const line = LINE_BY_ID[TUNNEL.lineId];
  const from = line.stationIds.indexOf(TUNNEL.fromId);
  const to = line.stationIds.indexOf(TUNNEL.toId);
  return line.stationIds.slice(from, to + 1);
}

/**
 * The resolved route as a polyline.
 *
 * Consecutive steps share a coordinate wherever the traveller changes lines —
 * the arrival node and the departure node are the same place — so the path
 * stays continuous through an interchange without any special casing.
 */
export function routePolyline(steps: RouteStep[]): string {
  return polylineThrough(steps.map((step) => step.stationId));
}

/**
 * Where to put a badge reading "Origen" or "Destino" so it does not land on a
 * station name.
 *
 * Sideways names get the badge opposite them: left of the marker for a name
 * that runs right, and the reverse. There is no room to stack a badge beyond a
 * sideways name without measuring the text, and the free space is unambiguous.
 *
 * A name drawn above or below its marker is the awkward case. The opposite side
 * is not reliably free — Talleres has San Bernabé's name below it, and on
 * Línea 3's tail the next station north-east is close enough that its name
 * starts within a badge-width of this marker. So the badge goes beyond its own
 * name instead. It is narrower than any name it sits beside, so it stays inside
 * the name's footprint and can only run into whatever lies *past* the name,
 * which both places keep clear.
 */
export function badgeAnchor(side: LabelSide): {
  x: number;
  y: number;
  anchor: TextAnchor;
} {
  switch (side) {
    case 'left':
      return { x: 18, y: 5, anchor: 'start' };
    case 'right':
      return { x: -18, y: 5, anchor: 'end' };
    case 'above':
      // Clear of a name whose baseline sits 18 units up.
      return { x: 0, y: -48, anchor: 'middle' };
    case 'below':
      // Just clear of a name whose baseline sits 30 units down.
      return { x: 0, y: 52, anchor: 'middle' };
    case 'below-far':
      // Same, for the 42-unit drop Línea 1's eastern arm uses.
      return { x: 0, y: 62, anchor: 'middle' };
  }
}

/** Where to draw a station name relative to its marker. */
export function labelAnchor(side: LabelSide): {
  dx: number;
  dy: number;
  anchor: TextAnchor;
} {
  switch (side) {
    case 'left':
      return { dx: -16, dy: 5, anchor: 'end' };
    case 'right':
      return { dx: 16, dy: 5, anchor: 'start' };
    case 'above':
      return { dx: 0, dy: -18, anchor: 'middle' };
    case 'below':
      return { dx: 0, dy: 30, anchor: 'middle' };
    case 'below-far':
      return { dx: 0, dy: 42, anchor: 'middle' };
  }
}
