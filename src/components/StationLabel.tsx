import type { Station } from '../types';
import { labelAnchor } from './mapGeometry';

interface StationLabelProps {
  station: Station;
  /** Part of the resolved route, or currently under the pointer. */
  emphasised: boolean;
  dimmed: boolean;
  onSelect: (stationId: string) => void;
  onHover: (stationId: string | null) => void;
}

/**
 * A station name.
 *
 * Names rest in the mist tone and only come up to full chalk when they belong
 * to the route — that keeps the canvas calm at rest and makes the answer
 * legible the moment there is one. The halo comes from `.station-label`, which
 * paints a stroke of ground colour under the glyphs so a name crossing a track
 * stays readable.
 */
export function StationLabel({
  station,
  emphasised,
  dimmed,
  onSelect,
  onHover,
}: StationLabelProps) {
  const { dx, dy, anchor } = labelAnchor(station.labelSide);

  return (
    <text
      className="station-label"
      data-station={station.id}
      x={station.x + dx}
      y={station.y + dy}
      textAnchor={anchor}
      fontSize={17}
      fontWeight={emphasised ? 700 : 400}
      fill={emphasised ? 'var(--color-chalk)' : 'var(--color-mist)'}
      style={{
        opacity: dimmed ? 0.35 : 1,
        transition: 'opacity 280ms ease, fill 280ms ease',
        cursor: 'pointer',
      }}
      onClick={() => onSelect(station.id)}
      onMouseEnter={() => onHover(station.id)}
      onMouseLeave={() => onHover(null)}
    >
      {station.name}
    </text>
  );
}
