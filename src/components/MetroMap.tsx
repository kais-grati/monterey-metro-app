import { useEffect, useRef } from 'react';
import { LINES, LINE_BY_ID } from '../data/lines';
import { STATIONS, VIEWBOX } from '../data/stations';
import { TRANSFER_STATION_IDS } from '../data/transfers';
import type { LineId, RouteResult, Station } from '../types';
import { LineTrack } from './LineTrack';
import { Ridge } from './Ridge';
import { RouteOverlay } from './RouteOverlay';
import { StationLabel } from './StationLabel';
import { StationMarker } from './StationMarker';
import { TunnelCasing } from './TunnelCasing';
import { badgeAnchor } from './mapGeometry';

/** Which lines call at each station. Computed once — the network is static. */
const LINES_BY_STATION = new Map<string, LineId[]>();
for (const line of LINES) {
  for (const stationId of line.stationIds) {
    LINES_BY_STATION.set(stationId, [...(LINES_BY_STATION.get(stationId) ?? []), line.id]);
  }
}

interface MetroMapProps {
  originId: string | null;
  destinationId: string | null;
  route: RouteResult | null;
  onStationSelect: (stationId: string) => void;
  hoveredStationId: string | null;
  onHoverStation: (stationId: string | null) => void;
}

export function MetroMap({
  originId,
  destinationId,
  route,
  onStationSelect,
  hoveredStationId,
  onHoverStation,
}: MetroMapProps) {
  const lineByStationOnRoute = new Map<string, LineId>();
  for (const step of route?.steps ?? []) {
    if (!lineByStationOnRoute.has(step.stationId)) {
      lineByStationOnRoute.set(step.stationId, step.lineId);
    }
  }

  const litLines = new Set(route?.steps.map((step) => step.lineId) ?? []);
  const anyRoute = route !== null;

  const ringColor = (station: Station): string => {
    const onRoute = lineByStationOnRoute.get(station.id);
    if (onRoute) return LINE_BY_ID[onRoute].colorVar;

    const serving = LINES_BY_STATION.get(station.id) ?? [];
    // A station served by more than one line that is *not* an interchange —
    // Alameda — gets a neutral ring, so colour never implies you can change.
    return serving.length === 1
      ? LINE_BY_ID[serving[0]].colorVar
      : 'var(--color-graphite)';
  };

  const paneRef = useRef<HTMLDivElement>(null);

  /**
   * Bring the answer into view.
   *
   * Below about 900px wide the pane is narrower than the map, and the map is
   * held at a floor size rather than shrunk to fit — a network diagram whose
   * station names are five pixels tall is not a diagram. That leaves the pane
   * showing a slice of the map, so the slice it shows is the one with the
   * journey on it. With no journey yet, it centres the network.
   */
  useEffect(() => {
    const pane = paneRef.current;
    if (!pane) return;

    const stations = route
      ? route.steps
          .map((step) => STATION_BY_ID_MAP.get(step.stationId))
          .filter((station) => station !== undefined)
      : STATIONS;

    // The SVG letterboxes the viewBox inside its own box whenever the pane's
    // aspect ratio differs, so a map coordinate has to be projected through
    // that inset as well as through the scale.
    const scale = Math.min(
      pane.scrollWidth / VIEWBOX.width,
      pane.scrollHeight / VIEWBOX.height,
    );
    const insetX = (pane.scrollWidth - VIEWBOX.width * scale) / 2;
    const insetY = (pane.scrollHeight - VIEWBOX.height * scale) / 2;

    const scrollTo = (values: number[], origin: number, inset: number, view: number) => {
      const middle = (Math.min(...values) + Math.max(...values)) / 2;
      return Math.max(0, inset + (middle - origin) * scale - view / 2);
    };

    pane.scrollTo({
      left: scrollTo(stations.map((s) => s.x), VIEWBOX.x, insetX, pane.clientWidth),
      top: scrollTo(stations.map((s) => s.y), VIEWBOX.y, insetY, pane.clientHeight),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
    });
  }, [route]);

  return (
    <div ref={paneRef} className="h-full w-full overflow-auto">
      <svg
        viewBox={`${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.width} ${VIEWBOX.height}`}
        className="h-full w-full min-h-[659px] min-w-[860px]"
        role="img"
        aria-label="Plano esquemático de las líneas 1, 2 y 3 del metro de Monterrey"
      >
        <Ridge />

        <TunnelCasing anyRoute={anyRoute} lit={litLines.has('L2')} />

        {LINES.map((line) => (
          <LineTrack key={line.id} line={line} anyRoute={anyRoute} lit={litLines.has(line.id)} />
        ))}

        {route && <RouteOverlay route={route} />}

        {/* Markers before labels, so a name always sits above the ticks. */}
        {STATIONS.map((station) => (
          <StationMarker
            key={`dot-${station.id}`}
            station={station}
            ringColor={ringColor(station)}
            isTransfer={TRANSFER_STATION_IDS.has(station.id)}
            dimmed={
              (anyRoute && !lineByStationOnRoute.has(station.id)) ||
              (hoveredStationId !== null && hoveredStationId !== station.id)
            }
            onSelect={onStationSelect}
            onHover={onHoverStation}
          />
        ))}

        {STATIONS.map((station) => (
          <StationLabel
            key={`name-${station.id}`}
            station={station}
            emphasised={lineByStationOnRoute.has(station.id) || hoveredStationId === station.id}
            dimmed={anyRoute && !lineByStationOnRoute.has(station.id)}
            onSelect={onStationSelect}
            onHover={onHoverStation}
          />
        ))}

        {originId && <TripBadge label="Origen" stationId={originId} />}
        {destinationId && <TripBadge label="Destino" stationId={destinationId} />}
      </svg>
    </div>
  );
}

const STATION_BY_ID_MAP = new Map(STATIONS.map((station) => [station.id, station]));

/**
 * A pill naming one end of the journey.
 *
 * The two ends need telling apart at a glance, and a shape difference alone is
 * never as quick to read as a word. `badgeAnchor` picks the side, and it is
 * always a side no station name is using.
 */
function TripBadge({ label, stationId }: { label: string; stationId: string }) {
  const station = STATION_BY_ID_MAP.get(stationId);
  if (!station) return null;

  const { x: offsetX, y: offsetY, anchor } = badgeAnchor(station.labelSide);
  const width = label.length * 8 + 20;
  const height = 23;
  const centreX = station.x + offsetX;
  const centreY = station.y + offsetY;
  const rectX =
    anchor === 'end' ? centreX - width : anchor === 'middle' ? centreX - width / 2 : centreX;

  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect
        x={rectX}
        y={centreY - height / 2}
        width={width}
        height={height}
        rx={height / 2}
        fill="var(--color-chalk)"
      />
      <text
        x={rectX + width / 2}
        y={centreY + 5}
        textAnchor="middle"
        fontSize={14}
        fontWeight={700}
        fill="var(--color-tunnel)"
      >
        {label}
      </text>
    </g>
  );
}
