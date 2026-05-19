export function nodeId(q, r) {
  return `node-${q}-${r}`;
}

export function cellId(q, r, orientation) {
  return `cell-${q}-${r}-${orientation}`;
}

export function edgeId(a, b) {
  return [a, b].sort().join("--");
}

export function coordKey(q, r) {
  return `${q},${r}`;
}

export function samePoint(a, b) {
  return a.q === b.q && a.r === b.r;
}

export function isAlignedDelta(dq, dr) {
  return dq === 0 || dr === 0 || dq + dr === 0;
}

export function latticeDistance(a, b) {
  const dq = b.q - a.q;
  const dr = b.r - a.r;

  if (!isAlignedDelta(dq, dr)) {
    return null;
  }

  return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr));
}

export function normalizeDelta(dq, dr) {
  const length = Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr));

  if (length === 0 || !isAlignedDelta(dq, dr)) {
    return null;
  }

  return {
    q: dq / length,
    r: dr / length,
    length
  };
}

export function pointInTriangle(point, a, b, c) {
  const denominator =
    (b.y - c.y) * (a.x - c.x) +
    (c.x - b.x) * (a.y - c.y);

  if (Math.abs(denominator) < 0.00001) {
    return false;
  }

  const alpha =
    ((b.y - c.y) * (point.x - c.x) +
      (c.x - b.x) * (point.y - c.y)) /
    denominator;
  const beta =
    ((c.y - a.y) * (point.x - c.x) +
      (a.x - c.x) * (point.y - c.y)) /
    denominator;
  const gamma = 1 - alpha - beta;
  const epsilon = -0.0001;

  return alpha >= epsilon && beta >= epsilon && gamma >= epsilon;
}

export function polygonCentroid(points) {
  const total = points.reduce(
    (acc, point) => {
      acc.x += point.x;
      acc.y += point.y;
      return acc;
    },
    { x: 0, y: 0 }
  );

  return {
    x: total.x / points.length,
    y: total.y / points.length
  };
}
