import { LINE_BY_ID } from '../data/lines';
import type { RouteResult } from '../types';

/**
 * The numbers for a resolved route.
 *
 * Duration leads because it is the question people actually ask. The rest sit
 * under it as a plain labelled list rather than a row of stat tiles — three
 * numbers do not need three boxes, and boxes would put this page in the same
 * clothes as every dashboard.
 */
export function TripSummary({ route }: { route: RouteResult }) {
  const linesUsed = [...new Set(route.steps.map((step) => step.lineId))];

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-extrabold tabular-nums tracking-tight">
          {route.totalMinutes}
        </span>
        <span className="text-lg font-semibold text-mist">min</span>
      </div>

      <dl className="flex flex-col text-sm">
        <div className="flex items-baseline justify-between border-t border-graphite py-2">
          <dt className="text-mist">Estaciones</dt>
          <dd className="font-semibold tabular-nums">{route.stationCount}</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-graphite py-2">
          <dt className="text-mist">Transbordos</dt>
          <dd className="font-semibold tabular-nums">{route.transfers}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-y border-graphite py-2">
          <dt className="text-mist">Líneas</dt>
          <dd className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
            {linesUsed.map((lineId) => (
              <span key={lineId} className="flex items-center gap-1.5 font-semibold">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: LINE_BY_ID[lineId].colorVar }}
                />
                {LINE_BY_ID[lineId].name}
              </span>
            ))}
          </dd>
        </div>
      </dl>

      <p className="text-xs leading-relaxed text-mist">
        {route.rideMinutes} min de viaje y {route.transferMinutes} min de transbordo.
      </p>
    </section>
  );
}
