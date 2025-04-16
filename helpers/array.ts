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

export const groupBySets = (hand: Card[], len: number) => {
  const wildCards = hand.filter((card) => card.type == "wild");
  const groups = hand
    .filter((card) => card.type !== "skip" && card.type !== "wild")
    .reduce((acc, card) => {
      const index = acc.findIndex((set) => set[0].text == card.text);
      if (index >= 0) {
        acc[index].push(card);
      } else acc.push([card]);
      return acc;
    }, [] as Card[][]);
  while (wildCards.length > 0) {
    let index = groups.findIndex(
      (group) => group.length > 1 && group.length < len
    );
    if (index < 0)
      index = groups.reduce(
        (biggestIndex, group, index) => {
          if (biggestIndex == null) return index;
          if (group.length > groups[biggestIndex].length) return index;
          return biggestIndex;
        },
        null as number | null
      )!;
    const wildCard = wildCards.pop()!;
    groups[index].push(wildCard);
  }
  return groups.sort((a, b) => b.length - a.length);
};

const getWildCardValue = (wildCard: Card, cards: Card[]) => {
  const index = cards.findIndex((card) => card.id === wildCard.id);
  const firstNumberIndex = cards.findLastIndex(
    (card, i) => card.type == "number" && i < index
  );
  if (firstNumberIndex < 0) return -1;
  const firstNumber = parseInt(cards[firstNumberIndex].text, 10);
  return firstNumberIndex - index + firstNumber;
};

export const groupByRuns = (hand: Card[]) => {
  let wildCards = hand.filter((card) => card.type == "wild");
  const runs = [...hand]
    .sort(sortByNumber)
    .filter((card) => card.type !== "skip")
    .reduce(
      (acc, card: Card) => {
        if (card.type == "wild") return acc;
        if (!acc) {
          return [[card]];
        }
        // wilds will be used when there are gaps
        const index = acc.length - 1;
        const currentRun = acc[index];
        const lastCard = currentRun[currentRun.length - 1];
        if (!lastCard) {
          console.log(currentRun.map((card) => card.text));
          return acc;
        }
        const lastNumber =
          lastCard.type == "wild"
            ? getWildCardValue(card, currentRun)
            : parseInt(lastCard.text, 10);

        const currentNumber = parseInt(card.text, 10);
        const diff = currentNumber - lastNumber;
        console.log(
          `${lastCard.text} has been valued at ${lastNumber}. ${card.text} has been valued at ${currentNumber}. There is a diff of ${diff}`
        );
        if (diff == 0) {
          acc.push([card]);
          return acc;
        } else if (diff == 1) {
          currentRun.push(card);
        } else if (diff <= wildCards.length) {
          for (let i = 0; i < diff; i++) {
            const wildCard = wildCards.pop()!;
            currentRun.push(wildCard);
          }
          currentRun.push(card);
        } else {
          acc.push([card]);
          wildCards = hand.filter((card) => card.type == "wild");
        }
        return acc;
      },
      null as null | Card[][]
    )!
    .sort((a, b) => b.length - a.length);
  console.log(runs.map((cards) => cards.map((card) => card.text).join(",")));
  return runs;
};

export const groupByColors = (hand: Card[]) => {
  const wildCards = hand.filter((card) => card.type == "wild");
  const possiblePhaseAreas = hand
    .filter((card) => card.type !== "skip" && card.type !== "wild")
    .reduce(
      (acc, card) => {
        if (!acc) return [[card]];
        const index = acc.findIndex((group) => group[0].color == card.color);
        if (index >= 0) {
          acc[index].push(card);
        } else acc.push([card]);
        return acc;
      },
      null as Card[][] | null
    )!
    .sort((a, b) => b.length - a.length);
  // add wild cards to biggest group
  possiblePhaseAreas[0] = possiblePhaseAreas[0].concat(wildCards);
  return possiblePhaseAreas;
};

export function groupBy(
  hand: Card[],
  type: "run" | "color" | "set",
  len?: number
): Card[][] {
  if (type == "color") return groupByColors(hand);
  else if (type == "set" && len) return groupBySets(hand, len);
  return groupByRuns(hand);
}
