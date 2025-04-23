import type { Card } from "@/types";

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
const getCardNumber = (card: Card) => {
  if (card.type == "wild") return 15;
  if (card.type == "skip") return 14;
  return parseInt(card.text, 10);
};
export const printCards = (hand: Card[]) => {
  console.log(hand.map((card) => card.text).join(","));
};
export const printRuns = (runs: Card[][]) =>
  console.log(runs.map((run) => run.map((card) => card.text).join(",")));

export const sortByNumber = (a: Card, b: Card) => {
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
