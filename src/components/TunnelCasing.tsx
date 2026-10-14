import { polylineThrough, tunnelStationIds } from './mapGeometry';

/**
 * The seven underground stations of Línea 2, between Regina and Zaragoza,
 * drawn as a bore the line runs inside.
 *
 * Underground running is real information about this network — it is why those
 * stations have no street-level access, and why changing at Cuauhtémoc costs
 * as much as it does. A casing is also the standard cartographic convention
 * for a tunnel, so it needs no explaining.
 *
 * Two strokes make the ring: a wide band in the raised steel tone, then a
 * narrower one in the ground colour punched through it. The line itself is
 * drawn on top by `LineTrack`, which leaves a gap of ground either side and
 * turns the pair into a tube seen end-on.
 */
export function TunnelCasing({ lit, anyRoute }: { lit: boolean; anyRoute: boolean }) {
  const opacity = !anyRoute ? 1 : lit ? 1 : 0.2;
  const points = polylineThrough(tunnelStationIds());

  return (
    <g style={{ opacity, transition: 'opacity 280ms ease' }}>
      <polyline
        points={points}
        fill="none"
        stroke="var(--color-steel)"
        strokeWidth="var(--casing-width)"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points={points}
        fill="none"
        stroke="var(--color-tunnel)"
        strokeWidth="17"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}
