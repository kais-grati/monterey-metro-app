import { LINES } from '../data/lines';
import type { RouteResult } from '../types';
import { Itinerary } from './Itinerary';
import { StationPicker } from './StationPicker';
import { TripSummary } from './TripSummary';
import { Wordmark } from './Wordmark';

interface PlannerPanelProps {
  originId: string;
  destinationId: string;
  route: RouteResult | null;
  onOriginChange: (stationId: string) => void;
  onDestinationChange: (stationId: string) => void;
  /** Set when the two pickers cannot produce a journey. */
  notice: string | null;
}

export function PlannerPanel({
  originId,
  destinationId,
  route,
  onOriginChange,
  onDestinationChange,
  notice,
}: PlannerPanelProps) {
  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto bg-steel px-6 py-6">
      <header className="flex flex-col gap-1">
        <Wordmark />
        <p className="text-sm text-mist">La ruta más rápida entre dos estaciones del metro.</p>
      </header>

      <div className="flex flex-col gap-4">
        <StationPicker
          id="origen"
          label="Origen"
          value={originId}
          onChange={onOriginChange}
        />
        <StationPicker
          id="destino"
          label="Destino"
          value={destinationId}
          onChange={onDestinationChange}
        />
      </div>

      <Legend />

      <div className="border-t border-graphite pt-5">
        {notice ? (
          <p className="text-sm text-mist">{notice}</p>
        ) : route ? (
          <TripSummary route={route} />
        ) : (
          <p className="text-sm leading-relaxed text-mist">
            Elige un origen y un destino. También puedes tocar dos estaciones en el plano.
          </p>
        )}
      </div>

      {route && !notice && (
        <div className="border-t border-graphite pt-5">
          <Itinerary route={route} />
        </div>
      )}
    </div>
  );
}

/** The key to the canvas. Everything the map draws differently is named here. */
function Legend() {
  return (
    <ul className="flex flex-col gap-2 border-t border-graphite pt-5 text-sm">
      {LINES.map((line) => (
        <li key={line.id} className="flex items-center gap-2.5">
          <span
            className="h-1 w-6 shrink-0 rounded-full"
            style={{ background: line.colorVar }}
            aria-hidden="true"
          />
          <span className="text-mist">{line.name}</span>
        </li>
      ))}
      <li className="flex items-center gap-2.5">
        <span
          className="h-2 w-6 shrink-0 rounded-full border-x-[3px] border-steel bg-tunnel outline outline-1 outline-graphite"
          aria-hidden="true"
        />
        <span className="text-mist">Tramo subterráneo</span>
      </li>
      <li className="flex items-center gap-2.5">
        <span
          className="ml-[9px] h-3 w-3 shrink-0 rounded-full border-[3px] border-chalk bg-tunnel"
          aria-hidden="true"
        />
        <span className="text-mist">Estación de transbordo</span>
      </li>
    </ul>
  );
}
