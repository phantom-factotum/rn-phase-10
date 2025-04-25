import type { GameState, Player } from "@/atoms/types";
import { canHit, verifyPhase } from "@/constants/phases";
import type { Card } from "@/types";

import {
  getLastArrayItem,
  removeItemFromArray,
  removeItemsFromArray,
} from "./array";
import {
  getAvailableCards,
  guessBestPlay,
  updatePhaseObjectiveArea,
} from "./player";
export const shouldUseDiscard = (state: GameState) => {
  const topDiscardPile = state.discardPile[state.discardPile.length - 1];
  const canDrawFromDiscard = topDiscardPile && topDiscardPile.type !== "skip";
  if (!canDrawFromDiscard) return false;
  let player = state.players.find(
    (player) => player.id == state.activePlayerId
  )!;
  let allCards = getAvailableCards(player);
  const hittablePlayers = state.players.filter(
    (player) => player.phaseCompleted
  );

  // if cant draw from discard draw from deck
  let shouldDrawFromDiscard = false;
  // decide if bot should draw from deck or discard pile
  if (player.phaseCompleted) {
    shouldDrawFromDiscard = !!hittablePlayers.find((p) =>
      p.phaseObjectiveArea.find(({ type, cards }) => {
        return (
          canHit(type, cards, topDiscardPile, true) ||
          canHit(type, cards, topDiscardPile, false)
        );
      })
    );
  } else {
    const newObjectiveArea = guessBestPlay(
      allCards.concat(topDiscardPile),
      player.phase
    );
    shouldDrawFromDiscard = !!newObjectiveArea.find((cards) =>
      cards.find((card) => card.id == topDiscardPile.id)
    );
  }
  return shouldDrawFromDiscard;
};

export const updateBotPhaseObjectiveArea = (player: Player) => {
  const allCards = getAvailableCards(player);
  const newObjectiveArea = guessBestPlay(allCards, player.phase);
  console.log(
    player.name,
    "will set phaseObjectiveArea to ",
    newObjectiveArea.map((cards) => cards.map((card) => card.text)).join(", ")
  );
  player.phaseObjectiveArea = player.phaseObjectiveArea.map((o, index) => {
    const cards = newObjectiveArea[index];
    return {
      ...o,
      cards,
      canComplete: verifyPhase(o.type, cards, o.objectiveLength),
    };
  });
  player.hand = removeItemsFromArray(allCards, newObjectiveArea.flat());
  updatePhaseObjectiveArea(player);
};

export const generateHits = (player: Player, players: Player[]) => {
  const hittablePlayers = players.filter((player) => player.phaseCompleted);
  let objectiveIndex = 0;
  const hits: {
    targetId: string;
    objectiveIndex: number;
    fromStart?: boolean;
    card: Card;
  }[] = [];
  let fromStart = false;
  // bot currently hits without a strategy
  player.hand.forEach((card) => {
    const targetPlayer = hittablePlayers.find((p) =>
      p.phaseObjectiveArea.find(({ type, cards }, index) => {
        const canHitFromStart = canHit(type, cards, card, true);
        const canHitFromEnd = canHit(type, cards, card, false);
        fromStart = !!canHitFromStart;
        const shouldHit = canHitFromStart || canHitFromEnd;
        if (shouldHit) {
          objectiveIndex = index;
        }
        return shouldHit;
      })
    );
    if (targetPlayer) {
      hits.push({
        targetId: targetPlayer.id,
        objectiveIndex,
        fromStart,
        card,
      });
    }
  });
  return hits;
};

export const findCardToDiscard = (player: Player) => {
  const discardableCards = player.hand
    .filter((card) => card.type !== "wild")
    .sort((a, b) => {
      return b.value - a.value;
    });

  const cardToDiscard = discardableCards[0];
  // all cards are in the phase objective area
  if (!cardToDiscard && !player.phaseCompleted) {
    const lastObjectiveArea = getLastArrayItem(player.phaseObjectiveArea)!;
    const lastCard = getLastArrayItem(lastObjectiveArea.cards)!;
    player.phaseObjectiveArea[player.phaseObjectiveArea.length - 1].cards =
      removeItemFromArray(lastObjectiveArea.cards, lastCard);
    return lastCard;
  }
  return cardToDiscard || undefined;
};
