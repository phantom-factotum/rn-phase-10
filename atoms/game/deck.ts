import Deck from "@/constants/deck";
import { Card } from "@/types";
import { atom } from "jotai";
import rfdc from "rfdc";
const deepclone = rfdc();

export const deckAtom = atom<Card[]>(Deck);
export const discardPileAtom = atom<Card[]>([]);
export const lastDiscardedAtom = atom((get) => {
  const discardPile = get(discardPileAtom);
  return discardPile[discardPile.length - 1];
});
