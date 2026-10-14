import type { Station } from '../types';

interface StationMarkerProps {
  station: Station;
  /** Ring colour: the line the traveller is on, or chalk where two lines meet. */
  ringColor: string;
  isTransfer: boolean;
  dimmed: boolean;
  onSelect: (stationId: string) => void;
  onHover: (stationId: string | null) => void;
}

/**
 * A station tick. Ordinary stops are a ring in their line's colour; the three
 * interchanges are larger and carry a chalk core, because a station you can
 * change trains at is a different kind of thing from one you cannot.
 *
 * The markers are deliberately not focusable. Thirty-eight tab stops between a
 * keyboard user and the rest of the page would be worse than useless — the
 * pickers in the panel are the accessible route to the same action, and the map
 * is hidden from assistive technology rather than half-exposed.
 */
export function StationMarker({
  station,
  ringColor,
  isTransfer,
  dimmed,
  onSelect,
  onHover,
}: StationMarkerProps) {
  return (
    <g
      data-station={station.id}
      style={{ opacity: dimmed ? 0.3 : 1, transition: 'opacity 280ms ease' }}
      onMouseEnter={() => onHover(station.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Invisible target, generous enough to click without aiming. */}
      <circle
        cx={station.x}
        cy={station.y}
        r={17}
        fill="transparent"
        style={{ cursor: 'pointer' }}
        onClick={() => onSelect(station.id)}
      />
      <circle
        cx={station.x}
        cy={station.y}
        r={isTransfer ? 11 : 7}
        fill="var(--color-tunnel)"
        stroke={ringColor}
        strokeWidth={3}
        style={{ pointerEvents: 'none' }}
      />
      {isTransfer && (
        <circle
          cx={station.x}
          cy={station.y}
          r={3.6}
          fill="var(--color-chalk)"
          style={{ pointerEvents: 'none' }}
        />
      )}
    </g>
  );
}
