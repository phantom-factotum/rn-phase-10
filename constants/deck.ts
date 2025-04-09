import { NumberCard, SkipCard, WildCard } from "../types";

export const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export const colors = ["#d41737", "#1C5E88FF", "#358628", "#ddb138"];

const coloredCards = colors
  .map((color) => {
    // each number appears twice
    const numberedCards1 = numbers.map((n, i) => {
      return {
        type: "number",
        text: n.toString(),
        color,
        value: n < 10 ? 5 : 10,
        id: `${n}-${color}-1`,
      } as NumberCard;
    });
    const numberedCards2 = numbers.map((n, i) => {
      return {
        type: "number",
        text: n.toString(),
        color,
        value: n < 10 ? 5 : 10,
        id: `${n}-${color}-2`,
      } as NumberCard;
    });
    // there are 8 wild cards so each color gets 2 wilds
    const wildCard1: WildCard = {
      text: "wild",
      type: "wild",
      value: 25,
      color,
      id: `wild-${color}-1`,
    };
    const wildCard2: WildCard = {
      text: "wild",
      type: "wild",
      value: 25,
      color,
      id: `wild-${color}-2`,
    };
    return [...numberedCards1, ...numberedCards2, wildCard1, wildCard2];
  })
  .flat();
//4 skip cards
const skipCards: SkipCard[] = Array(4)
  .fill(null)
  .map((_, i) => ({
    type: "skip",
    text: "skip",
    value: 15,
    color: "blue",
    id: `skip-${i + 1}`,
  }));
const deck = [...coloredCards, ...skipCards];
export default deck;
