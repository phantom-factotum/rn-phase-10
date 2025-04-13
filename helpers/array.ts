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
export function removeCardsFromArray(arr: Card[], cards: Card[]) {
  return arr.filter((card) => !cards.find((card2) => card2.id == card.id));
}
export function scoreCards(arr: Card[]) {
  return arr.reduce((total, card) => total + card.value, 0);
}

export function getRandomItem<T>(arr: T[]) {
  const index = getRandomInt(0, arr.length);
  return arr[index];
}

export const getRandomInt = (min = 0, max = 1) => {
  const range = max - min;
  return Math.floor(Math.random() * range) + min;
};

const getCardNumber = (card: Card) => {
  if (card.type == "wild") return 13;
  if (card.type == "skip") return 14;
  return parseInt(card.text, 10);
};
const sortByNumber = (a: Card, b: Card) => {
  return getCardNumber(a) - getCardNumber(b);
};
const getColorStr = (card: Card) => {
  if (card.type == "wild") return "yyyy";
  if (card.type == "skip") return "zzzz";
  return card.color;
};
const sortByColor = (a: Card, b: Card) => {
  return getColorStr(a).localeCompare(getColorStr(b));
};
export const sortCards = (cards: Card[], sortBy: "number" | "color") => {
  const copy = [...cards];
  return copy.sort(sortBy == "number" ? sortByNumber : sortByColor);
};

export const groupBySets = (hand: Card[]) => {
  return hand
    .filter((card) => card.type !== "skip" && card.type !== "wild")
    .reduce((acc, card) => {
      const index = acc.findIndex((set) => set[0].text == card.text);
      if (index >= 0) {
        acc[index].push(card);
      } else acc.push([card]);
      return acc;
    }, [] as Card[][])
    .filter((set) => set.length > 1)
    .sort((a, b) => b.length - a.length);
};

export const groupByRuns = (hand: Card[]) => {
  const totalWilds = hand.filter((card) => card.type == "wild").length;
  let remainingWilds = 0;
  return [...hand]
    .sort(sortByNumber)
    .filter((card) => card.type !== "skip" && card.type !== "wild")
    .reduce(
      (acc, card) => {
        const index = acc.length - 1;
        const currentRun = acc[index];
        const lastCard = currentRun[currentRun.length - 1];
        if (!lastCard) {
          acc[index] = [card];
          return acc;
        }
        const lastNumber = parseInt(lastCard.text, 10);
        const currentNumber = parseInt(card.text, 10);
        const diff = currentNumber - lastNumber;
        if (diff < 2) {
          currentRun.push(card);
        } else acc.push([card]);
        return acc;
      },
      [[]] as Card[][]
    );
};

export const groupByColors = (hand: Card[]) => {
  return hand
    .filter((card) => card.type !== "skip" && card.type !== "wild")
    .reduce((acc, card) => {
      const index = acc.findIndex((group) => group[0].color == card.color);
      if (index >= 0) {
        acc[index].push(card);
      } else acc.push([card]);
      return acc;
    }, [] as Card[][]);
};

export const groupBy = (hand: Card[], type: "run" | "set" | "color") => {
  if (type == "color") return groupByColors(hand);
  else if (type == "set") return groupBySets(hand);
  return groupByRuns(hand);
};
