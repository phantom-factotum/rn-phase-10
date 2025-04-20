import deck from "@/constants/deck";
import type { Card } from "@/types";
import { getLastArrayItem, getUniqueCardNumbers, shuffleArray } from "./array";

const shuffledDeck: Card[] = shuffleArray(deck).filter(
  (card) => card.type !== "wild"
);
const wilds = deck.filter((card) => card.type == "wild");

const printCards = (hand: Card[]) => {
  console.log(hand.map((card) => card.text).join(","));
};
const printRuns = (runs: Card[][]) =>
  console.log(runs.map((run) => run.map((card) => card.text).join(",")));
const botHand = shuffledDeck.slice(0, 8).concat(wilds.slice(0, 2));
printCards(botHand);
const numberCards = getUniqueCardNumbers(botHand);
printCards(numberCards);

/**
  0,1,2,3,4,5
  w,2,3,w,w,6
 */

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
      const wildCard = wildCards.pop();
      if (!wildCard) {
        console.log("you thought u had wild cards when u in fact did not");
        break;
      }
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

const runs = groupByRuns(botHand);
printRuns(runs);
