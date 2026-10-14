import { LINE_BY_ID } from '../data/lines';
import { STATION_BY_ID } from '../data/stations';
import type { RouteResult } from '../types';

/**
 * The route written out, station by station.
 *
 * Numbers are right here because this genuinely is a sequence — the order is
 * the information. Each row carries the line it belongs to, and an interchange
 * gets its own row so the instruction to change trains is impossible to scroll
 * past.
 */
export function Itinerary({ route }: { route: RouteResult }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-bold text-mist">Itinerario</h2>

      <ol className="flex flex-col">
        {route.steps.map((step, index) => {
          const station = STATION_BY_ID[step.stationId];
          const line = LINE_BY_ID[step.lineId];

          return (
            <li key={`${step.stationId}-${index}`}>
              {step.isTransfer && (
                <div className="my-1 flex items-center gap-2 border-l-2 border-graphite py-1 pl-3 text-sm">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: line.colorVar }}
                  />
                  <span className="text-mist">
                    Cambia a <span className="font-semibold text-chalk">{line.name}</span>
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 border-b border-graphite/60 py-1.5 last:border-b-0">
                <span className="w-5 shrink-0 text-right text-xs tabular-nums text-mist">
                  {index + 1}
                </span>
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: line.colorVar }}
                  aria-hidden="true"
                />
                <span className="grow text-sm font-medium">{station.name}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
