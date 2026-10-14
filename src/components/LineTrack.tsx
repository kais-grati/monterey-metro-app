import type { MetroLine } from '../types';
import { polylineThrough } from './mapGeometry';

interface LineTrackProps {
  line: MetroLine;
  /** The route uses this line, so it stays lit while the rest recedes. */
  lit: boolean;
  /** A route is on screen at all. */
  anyRoute: boolean;
}

export function LineTrack({ line, lit, anyRoute }: LineTrackProps) {
  const opacity = !anyRoute ? 1 : lit ? 0.85 : 0.18;

  return (
    <polyline
      points={polylineThrough(line.stationIds)}
      fill="none"
      stroke={line.colorVar}
      strokeWidth="var(--track-width)"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ opacity, transition: 'opacity 280ms ease' }}
    />
  );
}
