import { CONFIG } from "./config.js";
import {
  cellId,
  coordKey,
  edgeId,
  nodeId,
  normalizeDelta,
  pointInTriangle,
  polygonCentroid
} from "./geometry.js";

export function createGrid() {
  const nodes = [];
  const nodesById = new Map();
  const nodesByCoord = new Map();
  const edges = [];
  const edgesById = new Map();
  const cells = [];
  const cellsById = new Map();
  const triangles = [];

  const h = (CONFIG.spacing * Math.sqrt(3)) / 2;

  for (let r = 0; r < CONFIG.gridSize; r += 1) {
    for (let q = 0; q < CONFIG.gridSize; q += 1) {
      const node = {
        id: nodeId(q, r),
        q,
        r,
        x: CONFIG.marginX + q * CONFIG.spacing + r * CONFIG.spacing * 0.5,
        y: CONFIG.marginY + r * h
      };
      nodes.push(node);
      nodesById.set(node.id, node);
      nodesByCoord.set(coordKey(q, r), node);
    }
  }

  const getNode = (q, r) => nodesByCoord.get(coordKey(q, r));

  for (const node of nodes) {
    for (const direction of CONFIG.baseDirections) {
      const next = getNode(node.q + direction.q, node.r + direction.r);
      if (!next) {
        continue;
      }
      const edge = {
        id: edgeId(node.id, next.id),
        a: node.id,
        b: next.id
      };
      edges.push(edge);
      edgesById.set(edge.id, edge);
    }
  }

  for (let r = 0; r < CONFIG.gridSize - 1; r += 1) {
    for (let q = 0; q < CONFIG.gridSize - 1; q += 1) {
      const a = getNode(q, r);
      const b = getNode(q + 1, r);
      const c = getNode(q, r + 1);
      const d = getNode(q + 1, r + 1);

      addCell(cells, cellsById, q, r, "forward", [a, b, c]);
      addCell(cells, cellsById, q, r, "back", [b, d, c]);
    }
  }

  for (let sideLength = 1; sideLength <= CONFIG.maxTriangleSide; sideLength += 1) {
    for (let r = 0; r + sideLength < CONFIG.gridSize; r += 1) {
      for (let q = 0; q + sideLength < CONFIG.gridSize; q += 1) {
        const forwardVertices = [
          getNode(q, r),
          getNode(q + sideLength, r),
          getNode(q, r + sideLength)
        ];
        addCandidateTriangle(triangles, cells, nodesById, forwardVertices, {
          id: `tri-${q}-${r}-${sideLength}-forward`,
          q,
          r,
          sideLength,
          orientation: "forward"
        });

        const backVertices = [
          getNode(q + sideLength, r),
          getNode(q + sideLength, r + sideLength),
          getNode(q, r + sideLength)
        ];
        addCandidateTriangle(triangles, cells, nodesById, backVertices, {
          id: `tri-${q}-${r}-${sideLength}-back`,
          q,
          r,
          sideLength,
          orientation: "back"
        });
      }
    }
  }

  const width = CONFIG.marginX * 2 + (CONFIG.gridSize - 1) * CONFIG.spacing * 1.5;
  const height = CONFIG.marginY * 2 + (CONFIG.gridSize - 1) * h;

  const sites = CONFIG.sites
    .map((site) => {
      const cell = cellsById.get(site.cellId);
      if (!cell) {
        return null;
      }
      return {
        ...site,
        x: cell.centroid.x,
        y: cell.centroid.y
      };
    })
    .filter(Boolean);

  return {
    nodes,
    nodesById,
    nodesByCoord,
    edges,
    edgesById,
    cells,
    cellsById,
    triangles,
    sites,
    viewBox: `0 0 ${Math.ceil(width)} ${Math.ceil(height)}`
  };
}

export function getNodeAt(grid, q, r) {
  return grid.nodesByCoord.get(coordKey(q, r));
}

export function getPathEdges(grid, startId, endId) {
  const start = grid.nodesById.get(startId);
  const end = grid.nodesById.get(endId);
  const step = normalizeDelta(end.q - start.q, end.r - start.r);

  if (!step) {
    return null;
  }

  const path = [];
  let q = start.q;
  let r = start.r;

  for (let i = 0; i < step.length; i += 1) {
    const current = getNodeAt(grid, q, r);
    const next = getNodeAt(grid, q + step.q, r + step.r);

    if (!current || !next) {
      return null;
    }

    const unitEdgeId = edgeId(current.id, next.id);
    if (!grid.edgesById.has(unitEdgeId)) {
      return null;
    }

    path.push(unitEdgeId);
    q += step.q;
    r += step.r;
  }

  return path;
}

function addCell(cells, cellsById, q, r, orientation, vertices) {
  const id = cellId(q, r, orientation);
  const points = vertices.map((node) => ({ x: node.x, y: node.y }));
  const cell = {
    id,
    q,
    r,
    orientation,
    vertices: vertices.map((node) => node.id),
    points,
    centroid: polygonCentroid(points),
    boundaryEdges: [
      edgeId(vertices[0].id, vertices[1].id),
      edgeId(vertices[1].id, vertices[2].id),
      edgeId(vertices[2].id, vertices[0].id)
    ]
  };

  cells.push(cell);
  cellsById.set(id, cell);
}

function addCandidateTriangle(triangles, cells, nodesById, vertices, meta) {
  const boundaryEdges = [
    ...getBoundaryPath(vertices[0], vertices[1]),
    ...getBoundaryPath(vertices[1], vertices[2]),
    ...getBoundaryPath(vertices[2], vertices[0])
  ];
  const points = vertices.map((node) => ({ x: node.x, y: node.y }));
  const innerSmallCells = cells
    .filter((cell) => pointInTriangle(cell.centroid, points[0], points[1], points[2]))
    .map((cell) => cell.id);

  triangles.push({
    ...meta,
    vertices: vertices.map((node) => node.id),
    points,
    boundaryEdges,
    innerSmallCells
  });

  function getBoundaryPath(start, end) {
    const step = normalizeDelta(end.q - start.q, end.r - start.r);
    const path = [];
    let q = start.q;
    let r = start.r;

    for (let i = 0; i < step.length; i += 1) {
      const current = nodesById.get(nodeId(q, r));
      const next = nodesById.get(nodeId(q + step.q, r + step.r));
      path.push(edgeId(current.id, next.id));
      q += step.q;
      r += step.r;
    }

    return path;
  }
}
