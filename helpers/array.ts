import { Card } from "@/types";

export function shuffleArray<T>(arr: Array<T>) {
  const array = [...arr];
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {
    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}

export function countDuplicates(cards: Card[], key: keyof Card) {
  const keys = cards.map((card) => card[key]);
  const counter: { [key: string]: number } = keys.reduce(
    (prev, k) => ({ ...prev, [k]: 0 }),
    {}
  );
  return cards.reduce((prev, card) => {
    prev[card[key]]++;
    return prev;
  }, counter);
}

export function removeCardFromArray(arr: Card[], item: Card) {
  return arr.filter((card2) => card2.id !== item.id);
}

export function scoreCards(arr: Card[]) {
  return arr.reduce((total, card) => total + card.value, 0);
}
