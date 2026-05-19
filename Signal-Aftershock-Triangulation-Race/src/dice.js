export function rollD6() {
  return Math.floor(Math.random() * 6) + 1;
}

export function createBalancedDiceSequence(turnsPerPlayer) {
  const sequence = [];
  const baseCycle = [1, 2, 3, 4, 5, 6];
  const balancedRemainder = [2, 3, 4, 5, 1, 6];

  while (sequence.length + baseCycle.length <= turnsPerPlayer) {
    sequence.push(...baseCycle);
  }

  let remainderIndex = 0;
  while (sequence.length < turnsPerPlayer) {
    sequence.push(balancedRemainder[remainderIndex]);
    remainderIndex += 1;
  }

  return shuffle(sequence);
}

export function getBalancedDiceValue(state, playerId) {
  const turnIndex = state.turnsTaken[playerId] ?? 0;
  return state.diceSequence[turnIndex] ?? rollD6();
}

function shuffle(values) {
  const shuffled = [...values];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}
