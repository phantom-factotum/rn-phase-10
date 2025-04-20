import { Card, NumberCard } from "@/types";

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
  if (card.type == "wild") return 15;
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

export function getLastArrayItem<T>(arr: T[]) {
  // specify that item could possibly not exist
  return arr[arr.length - 1] || null;
}
export const getUniqueCardNumbers = (hand: Card[]) => {
  return hand
    .reduce((cards, card) => {
      if (
        card.type == "number" &&
        !cards.find((card2) => card2.text == card.text)
      ) {
        cards.push(card);
      }
      return cards;
    }, [] as NumberCard[])
    .sort(sortByNumber);
};
export const printCards = (hand: Card[]) => {
  console.log(hand.map((card) => card.text).join(","));
};
export const printRuns = (runs: Card[][]) =>
  console.log(runs.map((run) => run.map((card) => card.text).join(",")));

export function getCardValue(card: Card, run: Card[]) {
  if (card.type == "number") {
    run;
    return parseInt(card.text, 10);
  }
  const cardIndex = run.findIndex((card2) => card2.id == card.id);
  const numberCardIx = run.findIndex((card, index) => card.type == "number");
  const lastNumber = parseInt(run[numberCardIx].text, 10);
  const indexDiff = cardIndex - numberCardIx;
  // there is no numberCard before the wild
  if (indexDiff > 0) {
    return indexDiff + lastNumber;
  } else {
    return indexDiff + lastNumber;
  }
}
export const groupByRuns = (hand: Card[]) => {
  const numberCards = getUniqueCardNumbers(hand);
  const runs = numberCards.reduce((runs, startCard, index) => {
    const currentRun: Card[] = [];
    const wildCards = hand.filter((card) => card.type == "wild");
    // start a run at each card
    for (let i = index; i < numberCards.length; i++) {
      const card = numberCards[i];
      const lastCard = getLastArrayItem(currentRun);
      if (!lastCard) {
        currentRun.push(card);
        continue;
      }
      const lastNumber = getCardValue(lastCard, currentRun);
      const currNumber = getCardValue(card, currentRun);
      const gap = currNumber - lastNumber;
      if (gap == 1) {
        currentRun.push(card);
      } else if (gap - 1 <= wildCards.length) {
        for (let j = 0; j < gap - 1; j++) {
          const wildcard = wildCards.pop()!;
          currentRun.push(wildcard);
        }
        currentRun.push(card);
      } else {
        console.log(
          "remaining cards cant be used to continue run. Wilds remaining:",
          wildCards.length
        );
        printCards(currentRun);
        printCards(hand.slice(index));
        break;
      }
    }
    while (wildCards.length > 0) {
      const wildCard = wildCards.pop()!;
      const lastCardNumber = getCardValue(
        getLastArrayItem(currentRun)!,
        currentRun
      );
      const firstCardNumber = getCardValue(currentRun[0], currentRun);
      if (lastCardNumber < 12) {
        currentRun.push(wildCard);
      } else if (firstCardNumber > 1) {
        currentRun.unshift(wildCard);
      } else {
        console.log("wilds remain but you somehow messed up");
      }
    }
    runs.push(currentRun);
    return runs;
  }, [] as Card[][])!;
  return runs.sort((a, b) => b.length - a.length);
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
