import { addLog, getPlayer } from "./state.js";

export function calculateTriangleOwner(state, triangle, closingPlayerId) {
  const counts = new Map();

  for (const unitEdgeId of triangle.boundaryEdges) {
    const ownerId = state.edgeOwners.get(unitEdgeId);
    counts.set(ownerId, (counts.get(ownerId) || 0) + 1);
  }

  let bestCount = -1;
  let leaders = [];

  for (const [playerId, count] of counts.entries()) {
    if (count > bestCount) {
      bestCount = count;
      leaders = [playerId];
    } else if (count === bestCount) {
      leaders.push(playerId);
    }
  }

  return leaders.length === 1 ? leaders[0] : closingPlayerId;
}

export function getTrianglePreview(state, triangle, closingPlayerId, includeLengthBonus = false) {
  const ownerId = calculateTriangleOwner(state, triangle, closingPlayerId);
  const unclaimedCells = triangle.innerSmallCells.filter((cellId) => !state.cellOwners.has(cellId));
  const sites = state.grid.sites.filter(
    (site) => unclaimedCells.includes(site.cellId) && !state.collectedSites.has(site.id)
  );
  const siteBonus = sites.reduce((sum, site) => sum + site.bonus, 0);
  const lengthBonus = includeLengthBonus && unclaimedCells.length > 0 ? 1 : 0;

  return {
    triangleId: triangle.id,
    sideLength: triangle.sideLength,
    orientation: triangle.orientation,
    ownerId,
    area: unclaimedCells.length,
    sites,
    siteBonus,
    lengthBonus,
    total: unclaimedCells.length + siteBonus + lengthBonus
  };
}

export function resolveTriangle(state, triangle, closingPlayerId, includeLengthBonus = false) {
  const preview = getTrianglePreview(state, triangle, closingPlayerId, includeLengthBonus);
  const owner = getPlayer(state, preview.ownerId);
  const claimedCells = triangle.innerSmallCells.filter((cellId) => !state.cellOwners.has(cellId));

  state.lastClaimedCells = new Set(claimedCells);

  for (const cellId of claimedCells) {
    state.cellOwners.set(cellId, owner.id);
  }

  for (const site of preview.sites) {
    state.collectedSites.set(site.id, owner.id);
  }

  owner.score += preview.total;
  owner.claimedCells += preview.area;
  owner.collectedSites += preview.sites.length;
  owner.sitePoints += preview.siteBonus;

  state.resolvedTriangles.add(triangle.id);

  const siteText =
    preview.sites.length > 0
      ? `, site bonus +${preview.siteBonus}`
      : "";
  const lengthText = preview.lengthBonus ? ", full-length bonus +1" : "";

  addLog(
    state,
    `${owner.name} claimed a side-${triangle.sideLength} coverage triangle for +${preview.total} (${preview.area} area${siteText}${lengthText}).`
  );

  return preview;
}
