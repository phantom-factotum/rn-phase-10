import { Card, Objectives, WildCard } from "@/types";

const phases = [
  "2 sets of 3",
  "1 set of 3 + 1 run of 4",
  "1 set of 4 + 1 run of 4",
  "1 run of 7",
  "1 run of 8",
  "1 run of 9",
  "2 sets of 4",
  "7 cards of one color",
  "1 set of 5 + 1 set of 2",
  "1 set of 5 + 1 set of 3",
];
// rename phase string to be `$PHASE_TYPE of $TOTAL_CARDS`
const parsePhaseDescription = (phase: string) => {
  phase = phase.replaceAll("1 ", "");
  if (phase.startsWith("2 sets")) {
    const objective = phase.replace("2 sets of", "set of");
    phase = `${objective} + ${objective}`;
  } else if (phase === "7 cards of one color") {
    // rename phase to make parsing easier
    phase = "color of 7";
  }
  return phase.split(" + ").map((str) => {
    const [objectiveType, , numStr] = str.split(" ");
    const num = parseInt(numStr, 10);
    return [objectiveType as Objectives, num] as const;
  });
};
export const verifyPhase = (
  type: Objectives,
  cards: Card[],
  minCards: number
) => {
  if (type == "set") {
    if (cards.length == 0) return false;
    const groupNum = cards.find((card) => card.text != "wild");
    if (!groupNum) return false;

    const isSameCard = cards.every(
      (card) => card.text == groupNum.text || card.text == "wild"
    );
    const repeatLength = cards.reduce((count, card) => {
      if (card.text == groupNum.text || card.text == "wild") return count + 1;
      return count;
    }, 0);
    return isSameCard && repeatLength >= minCards;
  } else if (type == "color") {
    if (cards.length < minCards) return false;
    // find first non-wild card to derive color
    const firstCard = cards.find((card) => card.text !== "wild");
    if (!firstCard) return false;
    return cards.every(
      (card) => card.text === "wild" || card.color === firstCard.color
    );
  } else if (type === "run") {
    if (cards.length < minCards) return false;
    let isCorrect = true;
    // use the first number in array to derive what value
    // wildcards are substituting
    const firstNumberIndex = cards.findIndex((card) => card.type === "number");
    if (firstNumberIndex < 0) return false;
    const firstNumber = parseInt(cards[firstNumberIndex].text, 10);
    for (let i = firstNumberIndex; i < cards.length; i++) {
      const text = cards[i].text;
      const num = parseInt(text);
      if (text === "wild" || num == firstNumber + i - firstNumberIndex)
        continue;
      else return false;
    }
    return isCorrect;
  }
  return false;
};

const isNonWildCard = (card: Card) => card.text !== "wild";

export const canHit = (
  type: Objectives,
  cards: Card[],
  card: Card,
  fromStart?: boolean
) => {
  if (type === "set") {
    if (card.text == "wild") return true;
    const firstCard = cards.find(isNonWildCard);
    return firstCard && firstCard.text === card.text;
  } else if (type === "color") {
    if (card.text == "wild") return true;
    const firstCard = cards.find(isNonWildCard);
    return firstCard && firstCard.color == card.color;
  } else if (type === "run") {
    const index = fromStart
      ? cards.findIndex(isNonWildCard)
      : cards.findLastIndex(isNonWildCard);
    if (index < 0) return false;
    const firstCard = cards[index];
    // limit wildcard hit ability
    if (
      (fromStart && firstCard.text == "1") ||
      (!fromStart && firstCard.text == "12")
    )
      return false;
    else if (card.type === "wild") return true;
    const offset = fromStart ? -index - 1 : cards.length - index;
    // console.log("first nonwild card:", firstCard.text);
    const nextNum = parseInt(firstCard.text, 10) + offset;
    // console.log("next hit should be", nextNum);
    return nextNum.toString() === card.text;
  }
  return false;
};
const PHASES = phases.map((title) => {
  const phaseData = parsePhaseDescription(title);
  return {
    title,
    objectives: phaseData.map(([type, objectiveLength]) => ({
      type,
      objectiveLength,
      description: `${type} of ${objectiveLength}`,
    })),
  };
});

export const getWildCardValue = (run: Card[], wildCard: WildCard) => {
  const wildCardIndex = run.findIndex((card) => card.id == wildCard.id);
  const lastNumCardIndex = run.findLastIndex(
    (card, i) => card.type == "number" && i < wildCardIndex
  );
  const lastNumber = parseInt(run[lastNumCardIndex].text, 10);
  return lastNumber + wildCardIndex - lastNumCardIndex;
};
export default PHASES;
