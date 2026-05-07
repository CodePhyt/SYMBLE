/**
 * Generates a Dobble/Spot-It style deck based on a Finite Projective Plane of order N.
 * For a prime number N, the projective plane has:
 * Total symbols = N^2 + N + 1
 * Total cards = N^2 + N + 1
 * Symbols per card = N + 1
 * Any two cards will share exactly ONE symbol.
 * @param order The prime order of the projective plane (default 7 for 57 cards, 8 symbols each)
 * @returns An array of cards, where each card is an array of symbol IDs.
 */
export function generateDeck(order: number = 7): number[][] {
  const deck: number[][] = [];
  const firstCard = [0];
  for (let i = 1; i <= order; i++) {
    firstCard.push(i);
  }
  deck.push(firstCard);
  for (let j = 0; j < order; j++) {
    const card = [0];
    for (let k = 0; k < order; k++) {
      card.push(order + 1 + j * order + k);
    }
    deck.push(card);
  }
  for (let i = 0; i < order; i++) {
    for (let j = 0; j < order; j++) {
      const card = [i + 1];
      for (let k = 0; k < order; k++) {
        const val = order + 1 + k * order + ((i * k + j) % order);
        card.push(val);
      }
      deck.push(card);
    }
  }
  return deck;
}
