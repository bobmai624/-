export const CONFIG = {
  gridSize: 7,
  spacing: 76,
  marginX: 86,
  marginY: 78,
  maxTriangleSide: 4,
  claimThreshold: 0.7,
  players: [
    {
      id: "blue",
      name: "Blue Team",
      unit: "SkyLink Unit",
      color: "#3ad7c7",
      softColor: "rgba(58, 215, 199, 0.32)"
    },
    {
      id: "orange",
      name: "Orange Team",
      unit: "Ground Relay Unit",
      color: "#f39a38",
      softColor: "rgba(243, 154, 56, 0.32)"
    },
    {
      id: "green",
      name: "Green Team",
      unit: "Civic Signal Unit",
      color: "#76d66d",
      softColor: "rgba(118, 214, 109, 0.32)"
    }
  ],
  directions: [
    { q: 1, r: 0 },
    { q: 0, r: 1 },
    { q: -1, r: 1 },
    { q: -1, r: 0 },
    { q: 0, r: -1 },
    { q: 1, r: -1 }
  ],
  baseDirections: [
    { q: 1, r: 0 },
    { q: 0, r: 1 },
    { q: -1, r: 1 }
  ],
  sites: [
    { id: "shelter", name: "Shelter", label: "SOS", icon: "shelter", bonus: 2, cellId: "cell-1-1-forward" },
    { id: "hospital", name: "Hospital", label: "H", icon: "hospital", bonus: 3, cellId: "cell-4-1-back" },
    { id: "relay", name: "Relay Tower", label: "RLY", icon: "relay", bonus: 2, cellId: "cell-2-3-forward" },
    { id: "power", name: "Power Station", label: "PWR", icon: "power", bonus: 3, cellId: "cell-5-4-back" },
    { id: "supply", name: "Supply Point", label: "SUP", icon: "supply", bonus: 2, cellId: "cell-1-5-back" }
  ]
};
