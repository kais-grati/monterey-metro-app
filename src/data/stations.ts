import type { Station } from '../types';

/**
 * The 38 stations of lines 1, 2 and 3, in the map's own coordinate space.
 *
 * Coordinates are schematic, not geographic: the layout snaps to 45° where it
 * can, the way a printed transit diagram does, so the topology reads at a
 * glance. Line 1 runs as one clean 45° diagonal from Talleres into the centre
 * before turning east; line 2 is the vertical spine; line 3 climbs north-east
 * out of Zaragoza. The three interchanges — Cuauhtémoc, Félix U. Gómez and
 * Zaragoza — appear on two lines each and therefore carry a single shared
 * coordinate.
 *
 * Note which line owns which station. On the current diagram Alameda is served
 * by L2 alone and Col. Obrera by L3 alone: L1 runs Del Golfo → Félix U. Gómez
 * without dipping through them, as it did before L3 was extended to Zaragoza.
 */
export const STATIONS: Station[] = [
  // --- Línea 1, the north-west diagonal --------------------------------
  { id: 'talleres', name: 'Talleres', x: 105, y: 125, labelSide: 'above' },
  { id: 'san-bernabe', name: 'San Bernabé', x: 150, y: 170, labelSide: 'left' },
  { id: 'unidad-modelo', name: 'Unidad Modelo', x: 195, y: 215, labelSide: 'left' },
  { id: 'aztlan', name: 'Aztlán', x: 240, y: 260, labelSide: 'left' },
  { id: 'penitenciaria', name: 'Penitenciaría', x: 285, y: 305, labelSide: 'left' },
  { id: 'alfonso-reyes', name: 'Alfonso Reyes', x: 330, y: 350, labelSide: 'left' },
  { id: 'mitras', name: 'Mitras', x: 375, y: 395, labelSide: 'left' },
  { id: 'simon-bolivar', name: 'Simón Bolívar', x: 420, y: 440, labelSide: 'left' },
  { id: 'hospital', name: 'Hospital', x: 465, y: 485, labelSide: 'left' },
  { id: 'edison', name: 'Edison', x: 510, y: 530, labelSide: 'left' },
  { id: 'central', name: 'Central', x: 555, y: 575, labelSide: 'left' },

  // --- The interchange at the centre -----------------------------------
  { id: 'cuauhtemoc', name: 'Cuauhtémoc', x: 600, y: 620, labelSide: 'right', underground: true },

  // --- Línea 1, the eastern arm ----------------------------------------
  // The eastern arm settles into a long, shallow descent. The names sit in a
  // staggered row under it, which needs an even 25-unit drop per hop: any
  // tighter and consecutive names run into each other.
  { id: 'del-golfo', name: 'Del Golfo', x: 670, y: 656, labelSide: 'right' },
  // Félix U. Gómez is the one station on the network with no free side: Línea 1
  // arrives from the north-west and leaves east, Línea 3 leaves north-east and
  // arrives from the south-west. Above is between two tracks, right is along
  // the departing arm, below is along the arriving tail. West, under the Línea 1
  // run in, is the only quadrant the tracks do not cross.
  { id: 'felix-u-gomez', name: 'Félix U. Gómez', x: 745, y: 760, labelSide: 'left' },
  { id: 'parque-fundidora', name: 'Parque Fundidora', x: 829, y: 785, labelSide: 'below-far' },
  { id: 'y-griega', name: 'Y Griega', x: 913, y: 810, labelSide: 'below-far' },
  { id: 'eloy-cavazos', name: 'Eloy Cavazos', x: 997, y: 835, labelSide: 'below-far' },
  { id: 'lerdo-de-tejada', name: 'Lerdo de Tejada', x: 1081, y: 860, labelSide: 'below-far' },
  { id: 'exposicion', name: 'Exposición', x: 1165, y: 885, labelSide: 'below-far' },

  // --- Línea 2, the spine ----------------------------------------------
  { id: 'sendero', name: 'Sendero', x: 600, y: 60, labelSide: 'right' },
  { id: 'santiago-tapia', name: 'Santiago Tapia', x: 600, y: 132, labelSide: 'right' },
  { id: 'san-nicolas', name: 'San Nicolás', x: 600, y: 204, labelSide: 'right' },
  { id: 'anahuac', name: 'Anáhuac', x: 600, y: 274, labelSide: 'right' },
  { id: 'universidad', name: 'Universidad', x: 600, y: 344, labelSide: 'right' },
  { id: 'ninos-heroes', name: 'Niños Héroes', x: 600, y: 412, labelSide: 'right' },

  // Regina southward runs in tunnel — the seven underground stations.
  { id: 'regina', name: 'Regina', x: 600, y: 480, labelSide: 'right', underground: true },
  { id: 'gral-anaya', name: 'Gral. Anaya', x: 600, y: 550, labelSide: 'right', underground: true },
  { id: 'alameda', name: 'Alameda', x: 600, y: 692, labelSide: 'left', underground: true },
  { id: 'fundadores', name: 'Fundadores', x: 600, y: 762, labelSide: 'left', underground: true },
  { id: 'padre-mier', name: 'Padre Mier', x: 600, y: 832, labelSide: 'left', underground: true },
  {
    id: 'gral-i-zaragoza',
    name: 'Gral. I. Zaragoza',
    x: 600,
    y: 905,
    labelSide: 'left',
    underground: true,
  },

  // --- Línea 3, climbing north-east ------------------------------------
  // The tail climbs at a true 45°, and a name set *under* a marker is crossed
  // by the track whenever the run into that marker comes from below-left: the
  // track is still inside the name's band by the time it reaches the first
  // letter. Clearing it would take an offset of 60-odd units, more than the gap
  // to the next station. So the names go to the right of the track, into the
  // wedge between it and Línea 1, where the marker's own 16 units of clearance
  // is enough at that angle.
  { id: 'santa-lucia', name: 'Santa Lucía', x: 652, y: 853, labelSide: 'right' },
  // Col. Obrera sits further up the tail than an even three-way split would put
  // it: its name needs to clear Parque Fundidora's, which lies along the same
  // band of the canvas.
  { id: 'col-obrera', name: 'Col. Obrera', x: 710, y: 795, labelSide: 'right' },
  { id: 'metalurgicos', name: 'Metalúrgicos', x: 818, y: 688, labelSide: 'right' },
  { id: 'col-moderna', name: 'Col. Moderna', x: 890, y: 616, labelSide: 'right' },
  { id: 'ruiz-cortines', name: 'Ruiz Cortines', x: 955, y: 551, labelSide: 'right' },
  { id: 'los-angeles', name: 'Los Ángeles', x: 1019, y: 487, labelSide: 'right' },
  {
    // The longest name on the network, and the north-east terminus: its label
    // has to run back over the empty space to the left or it leaves the canvas.
    id: 'hospital-metropolitano',
    name: 'Hospital Metropolitano',
    x: 1082,
    y: 424,
    labelSide: 'left',
  },
];

/**
 * Map viewBox. Wide enough for the station names that sit outside the
 * outermost markers, and tall enough for the ridge in the empty south-west.
 *
 * The height is set by the worst case rather than by the tracks: an
 * "Origen"/"Destino" badge drawn beyond Exposición's name reaches 958, and it
 * would be clipped by a box that stopped at the map's own content.
 */
export const VIEWBOX = { x: 0, y: 20, width: 1240, height: 950 };

export const STATION_BY_ID: Record<string, Station> = Object.fromEntries(
  STATIONS.map((station) => [station.id, station]),
);

/** Stations in the order a picker should list them. */
export const STATIONS_ALPHABETICAL: Station[] = [...STATIONS].sort((a, b) =>
  a.name.localeCompare(b.name, 'es'),
);
