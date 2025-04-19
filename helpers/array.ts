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
  const wildcards = hand.filter((card) => card.type == "wild");
  let wildsRemainingInRun = wildcards.length;
  // its easier to create runs if we remove duplicates
  // and work with numbers rather than objects
  const numbers = Array.from(
    new Set(
      hand
        .filter((card) => card.type == "number")
        .map((card) => parseInt(card.text, 10))
    )
  ).sort((a, b) => a - b);
  const numberRuns = numbers
    .reduce(
      (runs, num, index) => {
        if (!runs) {
          return [[num]];
        }
        const currentRun = runs[runs.length - 1];
        const lastNum = currentRun[currentRun.length - 1];
        const gap = num - lastNum;
        if (gap < 0) {
          // the only time gaps are less than 0 is when the previous iteration
          // last push to the run was a wildcard. this shoud be impossible
          console.log("wild card has been exposed");
          // currentRun.push(num);
          console.log(currentRun);
        } else if (gap == 0 || gap == 1) {
          // gap will be 0 if in the previous iteration wilds were used to
          // bridge the gap
          currentRun.push(num);
        } else if (gap < wildsRemainingInRun - 1) {
          // wildcards will be 15
          const arr = Array(gap - 1).fill(15);
          console.log("filling in gap:", lastNum, arr, num);
          runs[runs.length - 1] = currentRun.concat(arr, num);
          wildsRemainingInRun -= gap - 1;
        } else if (wildsRemainingInRun > 0) {
          let nextIndex = index + 1;
          let nextNumber = numbers[nextIndex] || NaN;
          let nextGap = nextNumber - num;
          let canFillToNextNumber =
            nextGap && nextGap < wildsRemainingInRun - 1;
          // only use the wilds necessary to get to next number
          if (canFillToNextNumber) {
            runs[runs.length - 1] = currentRun.concat(
              Array(nextGap - 1).fill(15),
              nextNumber
            );
            wildsRemainingInRun -= nextGap - 1;
            return runs;
          }
          // use all the wilds until you reach 12
          const gapToEnd = 12 - num;
          const endFill =
            gapToEnd > wildsRemainingInRun ? wildsRemainingInRun : gapToEnd;
          wildsRemainingInRun -= endFill;
          runs[runs.length - 1] = currentRun.concat(Array(endFill).fill(15));
          // if run reaches 12 and wilds remain add them to start of run
          if (wildsRemainingInRun > 0) {
            runs[runs.length - 1] = Array(wildsRemainingInRun)
              .fill(15)
              .concat(currentRun);
            wildsRemainingInRun = 0;
          }
        } else {
          runs.push([num]);
          wildsRemainingInRun = wildcards.length;
        }
        return runs;
      },
      null as null | number[][]
    )!
    .sort((a, b) => b.length - a.length);
  const runs = numberRuns.map((run, index) => {
    const idsUsed: string[] = [];
    return run.map((num) => {
      const card = hand.find((card) => {
        const idUsed = idsUsed.find((id) => card.id == id);
        const numberToString = num == 15 ? "wild" : num.toString();
        return !idUsed && card.text == numberToString;
      })!;
      idsUsed.push(card.id);
      return card;
    });
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
    runs.map((run) => run.map((card) => card.text).join(","))
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
