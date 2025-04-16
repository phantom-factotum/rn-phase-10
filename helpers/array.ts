import { canHit } from "@/constants/phases";
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
  let remainingCards = [...arr];
  cards.forEach((card) => {
    remainingCards = removeCardFromArray(remainingCards, card);
  });
  return remainingCards;
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

export const findHit = (run: Card[], hand: Card[]) => {
  return findEndHit(run, hand) || findFrontHit(run, hand);
};

export const findEndHit = (run: Card[], hand: Card[]) => {
  return hand.find((card) => canHit("run", run, card, false));
};
export const findFrontHit = (run: Card[], hand: Card[]) => {
  return hand.find((card) => canHit("run", run, card, true));
};

export const groupByRuns2 = (hand: Card[]): Card[][] => {
  const runs: Card[][] = [];
  hand.sort(sortByNumber).forEach((card) => {
    let remainingCards = removeCardFromArray(hand, card);
    if (!runs[runs.length - 1]) {
      runs.push([card]);
    }
    const currentRun = runs[runs.length - 1];

    while (findHit(currentRun, remainingCards)) {
      const hit = findHit(currentRun, remainingCards)!;
      remainingCards = removeCardFromArray(currentRun, hit);
      currentRun.push(hit);
    }
  });

  console.log(
    "cards:",
    hand
      .sort(sortByNumber)
      .map((card) => card.text)
      .join(",")
  );
  console.log(
    "runs:",
    runs.map((cards) => cards.map((card) => card.text).join(","))
  );
  return runs.sort((a, b) => b.length - a.length);
};

export const groupByRuns = (hand: Card[]) => {
  const wildCards = hand.filter((card) => card.type == "wild");
  const runs = [...hand]
    .filter((card) => card.type !== "skip")
    .sort(sortByNumber)
    .reduce(
      (acc, card: Card) => {
        if (!acc) {
          return [[card]];
        }
        const currentRun = acc[acc.length - 1];
        const canHitFromEnd = canHit("run", currentRun, card);
        const canHitFromStart = canHit("run", currentRun, card, true);
        // try to run from end
        if (canHitFromEnd) {
          currentRun.push(card);
        }
        // try to hit run from start
        else if (canHitFromStart) {
          currentRun.unshift(card);
        }
        // make sure run has used all wildcards
        else {
          if (
            currentRun.filter((card) => card.type == "wild").length !==
            wildCards.length
          ) {
            const lastCard = currentRun[currentRun.length - 1];
            let lastNumber: number;
            if (lastCard.type == "number") lastNumber = parseInt(card.text, 10);
            else {
              const indexOffset = currentRun.findLastIndex(
                (card) => card.type == "number"
              );
              const num = parseInt(currentRun[indexOffset].text, 10);
              lastNumber = currentRun.length - indexOffset + num;
            }
            const wildCard = removeCardsFromArray(hand, currentRun).find(
              (card) => card.type == "wild"
            )!;
            if (lastNumber < 12) currentRun.push(wildCard);
            else currentRun.unshift(wildCard);
          }
          acc.push([card]);
        }
        return acc;
      },
      null as null | Card[][]
    )!
    .sort((a, b) => b.length - a.length);
  console.log(
    "cards:",
    hand
      .sort(sortByNumber)
      .map((card) => card.text)
      .join(",")
  );
  console.log(
    "runs:",
    runs.map((cards) => cards.map((card) => card.text).join(","))
  );
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
