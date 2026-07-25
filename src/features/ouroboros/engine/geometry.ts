import type {
  CollisionContact,
  CollisionSystem,
  Point,
} from "./types";

const GEOMETRY_EPSILON = 1e-7;
const CLOSED_REGION_GRID_SIZE = 3;
const MAX_CLOSED_REGION_GRID_CELLS = 4_000_000;

export interface ClosedStrokeRegion {
  readonly enclosedArea: number;
  containsCircle(center: Point, radius: number): boolean;
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function polygonArea(points: readonly Point[]): number {
  if (points.length < 3) return 0;

  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    if (!current || !next) continue;
    area += current.x * next.y - next.x * current.y;
  }

  return Math.abs(area / 2);
}

export function pointInPolygon(point: Point, polygon: readonly Point[]): boolean {
  if (polygon.length < 3) return false;

  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index];
    const end = polygon[(index + 1) % polygon.length];
    if (start && end && pointOnSegment(point, start, end)) return true;
  }

  let inside = false;

  for (
    let current = 0, previous = polygon.length - 1;
    current < polygon.length;
    previous = current, current += 1
  ) {
    const a = polygon[current];
    const b = polygon[previous];
    if (!a || !b) continue;

    const intersects =
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;

    if (intersects) inside = !inside;
  }

  return inside;
}

export function pointToSegmentDistance(
  point: Point,
  segmentStart: Point,
  segmentEnd: Point,
): number {
  return Math.sqrt(
    pointToSegmentDistanceSquared(point, segmentStart, segmentEnd),
  );
}

function pointToSegmentDistanceSquared(
  point: Point,
  segmentStart: Point,
  segmentEnd: Point,
): number {
  return coordinatesToSegmentDistanceSquared(
    point.x,
    point.y,
    segmentStart,
    segmentEnd,
  );
}

function coordinatesToSegmentDistanceSquared(
  pointX: number,
  pointY: number,
  segmentStart: Point,
  segmentEnd: Point,
): number {
  const segmentX = segmentEnd.x - segmentStart.x;
  const segmentY = segmentEnd.y - segmentStart.y;
  const lengthSquared = segmentX * segmentX + segmentY * segmentY;
  const projection =
    lengthSquared <= GEOMETRY_EPSILON
      ? 0
      : ((pointX - segmentStart.x) * segmentX +
          (pointY - segmentStart.y) * segmentY) /
        lengthSquared;
  const clampedProjection = Math.max(0, Math.min(1, projection));
  const offsetX = pointX - (segmentStart.x + segmentX * clampedProjection);
  const offsetY = pointY - (segmentStart.y + segmentY * clampedProjection);
  return offsetX * offsetX + offsetY * offsetY;
}

export function circleIntersectsPolygon(
  center: Point,
  radius: number,
  polygon: readonly Point[],
): boolean {
  if (polygon.length < 3) return false;
  if (pointInPolygon(center, polygon)) return true;

  const captureRadius = Math.max(0, radius);
  return polygon.some((start, index) => {
    const end = polygon[(index + 1) % polygon.length];
    return (
      end !== undefined &&
      pointToSegmentDistance(center, start, end) <=
        captureRadius + GEOMETRY_EPSILON
    );
  });
}

/**
 * Builds the capture region formed by a closed, thick trail. Every trail
 * segment, including the implicit last-to-first segment, is rasterized as a
 * capsule. Open cells that cannot be reached from the grid boundary form the
 * enclosed region.
 */
export function buildClosedStrokeRegion(
  centerline: readonly Point[],
  strokeRadius: number,
): ClosedStrokeRegion {
  const points = centerline.map((point) => ({ ...point }));
  const normalizedStrokeRadius = Math.max(0, strokeRadius);
  if (
    points.length === 0 ||
    !Number.isFinite(normalizedStrokeRadius) ||
    points.some((point) => !Number.isFinite(point.x) || !Number.isFinite(point.y))
  ) {
    return emptyClosedStrokeRegion;
  }

  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const point of points) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }

  const gridSize = CLOSED_REGION_GRID_SIZE;
  const padding = normalizedStrokeRadius + gridSize * 2;
  const originX = minX - padding;
  const originY = minY - padding;
  const columns = Math.max(
    3,
    Math.ceil((maxX - minX + padding * 2) / gridSize),
  );
  const rows = Math.max(
    3,
    Math.ceil((maxY - minY + padding * 2) / gridSize),
  );
  const cellCount = columns * rows;
  if (
    !Number.isSafeInteger(cellCount) ||
    cellCount <= 0 ||
    cellCount > MAX_CLOSED_REGION_GRID_CELLS
  ) {
    return emptyClosedStrokeRegion;
  }

  // 0 = unvisited/open, 1 = capsule wall, 2 = exterior.
  const cells = new Uint8Array(cellCount);
  for (let index = 0; index < points.length; index += 1) {
    const start = points[index];
    const end = points[(index + 1) % points.length];
    if (!start || !end) continue;
    rasterizeCapsule(
      cells,
      columns,
      rows,
      originX,
      originY,
      gridSize,
      start,
      end,
      normalizedStrokeRadius,
    );
  }

  const queue = new Int32Array(cellCount);
  let queueHead = 0;
  let queueTail = 0;
  const enqueueExterior = (index: number) => {
    if (cells[index] !== 0) return;
    cells[index] = 2;
    queue[queueTail] = index;
    queueTail += 1;
  };

  for (let column = 0; column < columns; column += 1) {
    enqueueExterior(column);
    enqueueExterior((rows - 1) * columns + column);
  }
  for (let row = 1; row < rows - 1; row += 1) {
    enqueueExterior(row * columns);
    enqueueExterior(row * columns + columns - 1);
  }

  while (queueHead < queueTail) {
    const index = queue[queueHead];
    queueHead += 1;
    if (index === undefined) continue;

    const column = index % columns;
    const row = Math.floor(index / columns);
    if (column > 0) enqueueExterior(index - 1);
    if (column + 1 < columns) enqueueExterior(index + 1);
    if (row > 0) enqueueExterior(index - columns);
    if (row + 1 < rows) enqueueExterior(index + columns);
  }

  let enclosedCellCount = 0;
  for (const cell of cells) {
    if (cell === 0) enclosedCellCount += 1;
  }

  return {
    enclosedArea: enclosedCellCount * gridSize * gridSize,
    containsCircle(center, radius) {
      if (!Number.isFinite(center.x) || !Number.isFinite(center.y)) return false;

      const column = Math.floor((center.x - originX) / gridSize);
      const row = Math.floor((center.y - originY) / gridSize);
      if (
        column >= 0 &&
        column < columns &&
        row >= 0 &&
        row < rows &&
        cells[row * columns + column] === 0
      ) {
        return true;
      }

      const captureDistance =
        normalizedStrokeRadius +
        Math.max(0, Number.isFinite(radius) ? radius : 0);
      const captureDistanceSquared =
        (captureDistance + GEOMETRY_EPSILON) ** 2;
      return points.some((start, index) => {
        const end = points[(index + 1) % points.length];
        return (
          end !== undefined &&
          pointToSegmentDistanceSquared(center, start, end) <=
            captureDistanceSquared
        );
      });
    },
  };
}

const emptyClosedStrokeRegion: ClosedStrokeRegion = {
  enclosedArea: 0,
  containsCircle: () => false,
};

function rasterizeCapsule(
  cells: Uint8Array,
  columns: number,
  rows: number,
  originX: number,
  originY: number,
  gridSize: number,
  start: Point,
  end: Point,
  radius: number,
): void {
  const minColumn = Math.max(
    0,
    Math.floor((Math.min(start.x, end.x) - radius - originX) / gridSize),
  );
  const maxColumn = Math.min(
    columns - 1,
    Math.floor((Math.max(start.x, end.x) + radius - originX) / gridSize),
  );
  const minRow = Math.max(
    0,
    Math.floor((Math.min(start.y, end.y) - radius - originY) / gridSize),
  );
  const maxRow = Math.min(
    rows - 1,
    Math.floor((Math.max(start.y, end.y) + radius - originY) / gridSize),
  );
  const radiusSquared = radius * radius + GEOMETRY_EPSILON;

  for (let row = minRow; row <= maxRow; row += 1) {
    const cellMinY = originY + row * gridSize;
    const cellMaxY = cellMinY + gridSize;
    for (let column = minColumn; column <= maxColumn; column += 1) {
      const cellMinX = originX + column * gridSize;
      const cellMaxX = cellMinX + gridSize;
      if (
        segmentToRectangleDistanceSquared(
          start,
          end,
          cellMinX,
          cellMinY,
          cellMaxX,
          cellMaxY,
        ) <= radiusSquared
      ) {
        cells[row * columns + column] = 1;
      }
    }
  }
}

function segmentToRectangleDistanceSquared(
  start: Point,
  end: Point,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): number {
  if (segmentIntersectsRectangle(start, end, minX, minY, maxX, maxY)) return 0;

  const minimum = Math.min(
    pointToRectangleDistanceSquared(start, minX, minY, maxX, maxY),
    pointToRectangleDistanceSquared(end, minX, minY, maxX, maxY),
  );
  return Math.min(
    minimum,
    coordinatesToSegmentDistanceSquared(minX, minY, start, end),
    coordinatesToSegmentDistanceSquared(maxX, minY, start, end),
    coordinatesToSegmentDistanceSquared(maxX, maxY, start, end),
    coordinatesToSegmentDistanceSquared(minX, maxY, start, end),
  );
}

function segmentIntersectsRectangle(
  start: Point,
  end: Point,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): boolean {
  let entry = 0;
  let exit = 1;
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;

  for (const [position, delta, minimum, maximum] of [
    [start.x, deltaX, minX, maxX],
    [start.y, deltaY, minY, maxY],
  ] as const) {
    if (Math.abs(delta) <= GEOMETRY_EPSILON) {
      if (position < minimum || position > maximum) return false;
      continue;
    }

    const first = (minimum - position) / delta;
    const second = (maximum - position) / delta;
    entry = Math.max(entry, Math.min(first, second));
    exit = Math.min(exit, Math.max(first, second));
    if (entry > exit) return false;
  }

  return true;
}

function pointToRectangleDistanceSquared(
  point: Point,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): number {
  const offsetX = Math.max(minX - point.x, 0, point.x - maxX);
  const offsetY = Math.max(minY - point.y, 0, point.y - maxY);
  return offsetX * offsetX + offsetY * offsetY;
}

function pointOnSegment(point: Point, start: Point, end: Point): boolean {
  const cross =
    (end.x - start.x) * (point.y - start.y) -
    (end.y - start.y) * (point.x - start.x);
  if (Math.abs(cross) > GEOMETRY_EPSILON) return false;

  return (
    point.x >= Math.min(start.x, end.x) - GEOMETRY_EPSILON &&
    point.x <= Math.max(start.x, end.x) + GEOMETRY_EPSILON &&
    point.y >= Math.min(start.y, end.y) - GEOMETRY_EPSILON &&
    point.y <= Math.max(start.y, end.y) + GEOMETRY_EPSILON
  );
}

export function angleDifference(target: number, current: number): number {
  return Math.atan2(Math.sin(target - current), Math.cos(target - current));
}

export function contactFromNearestPoint(
  circle: Point,
  nearest: Point,
  combinedRadius: number,
  fallbackNormal: Point = { x: 1, y: 0 },
): CollisionContact | null {
  const offsetX = circle.x - nearest.x;
  const offsetY = circle.y - nearest.y;
  const contactDistance = Math.hypot(offsetX, offsetY);
  const penetration = combinedRadius - contactDistance;
  if (penetration <= 0) return null;

  if (contactDistance > Number.EPSILON) {
    return {
      normalX: offsetX / contactDistance,
      normalY: offsetY / contactDistance,
      penetration,
    };
  }

  const fallbackLength = Math.hypot(fallbackNormal.x, fallbackNormal.y);
  return {
    normalX: fallbackLength > Number.EPSILON ? fallbackNormal.x / fallbackLength : 1,
    normalY: fallbackLength > Number.EPSILON ? fallbackNormal.y / fallbackLength : 0,
    penetration,
  };
}

export const nativeCollisionSystem: CollisionSystem = {
  circleToCircle(first, firstRadius, second, secondRadius) {
    return contactFromNearestPoint(first, second, firstRadius + secondRadius);
  },
  circleToSegment(
    circle,
    circleRadius,
    segmentStart,
    segmentEnd,
    segmentRadius,
  ) {
    const segmentX = segmentEnd.x - segmentStart.x;
    const segmentY = segmentEnd.y - segmentStart.y;
    const lengthSquared = segmentX * segmentX + segmentY * segmentY;
    const projection =
      lengthSquared <= Number.EPSILON
        ? 0
        : ((circle.x - segmentStart.x) * segmentX +
            (circle.y - segmentStart.y) * segmentY) /
          lengthSquared;
    const clampedProjection = Math.max(0, Math.min(1, projection));
    const nearest = {
      x: segmentStart.x + segmentX * clampedProjection,
      y: segmentStart.y + segmentY * clampedProjection,
    };

    return contactFromNearestPoint(
      circle,
      nearest,
      circleRadius + segmentRadius,
      { x: -segmentY, y: segmentX },
    );
  },
  containsPoint(polygon, point) {
    return pointInPolygon(point, polygon);
  },
};

export function trimTrailToLength(trail: Point[], targetLength: number): void {
  if (trail.length < 2) return;

  let accumulated = 0;
  for (let index = trail.length - 1; index > 0; index -= 1) {
    const newer = trail[index];
    const older = trail[index - 1];
    if (!newer || !older) continue;

    const segmentLength = distance(newer, older);
    if (accumulated + segmentLength >= targetLength) {
      const remaining = targetLength - accumulated;
      const ratio = segmentLength === 0 ? 0 : remaining / segmentLength;
      const exactTail = {
        x: newer.x + (older.x - newer.x) * ratio,
        y: newer.y + (older.y - newer.y) * ratio,
      };

      trail.splice(0, index, exactTail);
      return;
    }

    accumulated += segmentLength;
  }
}
