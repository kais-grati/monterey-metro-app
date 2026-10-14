import type { MetroLine } from '../types';

/**
 * The three lines in scope, each ordered from one terminus to the other.
 *
 * Colours come from the official Metrorrey diagram. They are the only hues in
 * the interface — every other surface is a step on the steel ramp — so a colour
 * on screen always means a specific line and nothing else.
 */
export const LINES: MetroLine[] = [
  {
    id: 'L1',
    name: 'Línea 1',
    colorVar: 'var(--color-line-1)',
    stationIds: [
      'talleres',
      'san-bernabe',
      'unidad-modelo',
      'aztlan',
      'penitenciaria',
      'alfonso-reyes',
      'mitras',
      'simon-bolivar',
      'hospital',
      'edison',
      'central',
      'cuauhtemoc',
      'del-golfo',
      'felix-u-gomez',
      'parque-fundidora',
      'y-griega',
      'eloy-cavazos',
      'lerdo-de-tejada',
      'exposicion',
    ],
  },
  {
    id: 'L2',
    name: 'Línea 2',
    colorVar: 'var(--color-line-2)',
    stationIds: [
      'sendero',
      'santiago-tapia',
      'san-nicolas',
      'anahuac',
      'universidad',
      'ninos-heroes',
      'regina',
      'gral-anaya',
      'cuauhtemoc',
      'alameda',
      'fundadores',
      'padre-mier',
      'gral-i-zaragoza',
    ],
  },
  {
    id: 'L3',
    name: 'Línea 3',
    colorVar: 'var(--color-line-3)',
    stationIds: [
      'gral-i-zaragoza',
      'santa-lucia',
      'col-obrera',
      'felix-u-gomez',
      'metalurgicos',
      'col-moderna',
      'ruiz-cortines',
      'los-angeles',
      'hospital-metropolitano',
    ],
  },
];

export const LINE_BY_ID = Object.fromEntries(LINES.map((line) => [line.id, line])) as Record<
  MetroLine['id'],
  MetroLine
>;

/**
 * The stretch of Línea 2 that runs underground, from Regina to Zaragoza.
 * Drawn as a cased tunnel so the map shows where the train goes under the
 * city rather than pretending the whole network is on the surface.
 */
export const TUNNEL: { lineId: MetroLine['id']; fromId: string; toId: string } = {
  lineId: 'L2',
  fromId: 'regina',
  toId: 'gral-i-zaragoza',
};

/** Every distinct pair of stations joined by a single hop on some line. */
export function ridePairs(): { a: string; b: string; lineId: MetroLine['id'] }[] {
  const pairs: { a: string; b: string; lineId: MetroLine['id'] }[] = [];
  for (const line of LINES) {
    for (let i = 0; i < line.stationIds.length - 1; i += 1) {
      pairs.push({ a: line.stationIds[i], b: line.stationIds[i + 1], lineId: line.id });
    }
  }
  return pairs;
}
