import { GameState, GameStateDispatch, Player } from "@/atoms/types";
import deck from "@/constants/deck";
import { canHit, verifyPhase } from "@/constants/phases";
import { Card, SkipCard } from "@/types";
import AsyncAlert from "react-native-alert-async";
import rfdc from "rfdc";
import {
  removeCardFromArray,
  removeCardsFromArray,
  shuffleArray,
} from "./array";
import {
  getAvailableCards,
  guessBestPlay,
  updatePhaseObjectiveArea,
} from "./player";
const deepclone = rfdc();

export function drawCard(state: GameState, isFromDiscard?: boolean) {
  if (state.activePlayerId === null || !state.canDraw) return;
  state.activePlayerId;
  const player = state.players.find(
    (player) => player.id == state.activePlayerId
  );
  if (!player) return;
  let card: Card;
  if (isFromDiscard && state.discardPile.length > 0) {
    card = state.discardPile.pop()!;
  } else {
    card = state.drawPile.pop()!;
    // if drawPile becomes empty use the discard pile to refill it
    if (state.drawPile.length == 0) {
      state.drawPile = shuffleArray(state.discardPile);
      state.discardPile = [];
    }
  }
  player.hand.push(card);
  player.currentHandScore = scorePlayerCards(player);
  state.canDraw = false;
  state.canDiscard = true;
  return card;
}

function startNextTurn(
  gameState: GameState,
  config: { onBotTurnStart?: () => void; onBotTurnEnd?: () => void } = {}
) {
  const { onBotTurnStart, onBotTurnEnd } = config;
  const activePlayerId = gameState.activePlayerId!;
  const activePlayerIndex = gameState.players.findIndex(
    (player) => player.id == activePlayerId
  );
  let nextIndex = (activePlayerIndex + 1) % gameState.players.length;
  while (gameState.players[nextIndex].id == gameState.skipQueue[0]) {
    nextIndex = (nextIndex + 1) % gameState.players.length;
    gameState.skipQueue.shift();
  }
  gameState.activePlayerId = gameState.players[nextIndex].id;
  gameState.canDiscard = false;
  gameState.canDraw = true;
  if (gameState.botsIsActive && gameState.activePlayerId !== "player") {
    onBotTurnStart?.();
    return automateTurn(gameState, onBotTurnEnd);
  } else {
    return gameState;
  }
  // return;
}

function automateTurn(state: GameState, onBotTurnEnd?: () => void) {
  const topDiscardPile = state.discardPile[state.discardPile.length - 1];
  const canDrawFromDiscard = !topDiscardPile || topDiscardPile.type !== "skip";

  let cardDrew: Card;
  let player = state.players.find(
    (player) => player.id == state.activePlayerId
  )!;
  const allCards = getAvailableCards(player);

  // if cant draw from discard draw from deck
  if (!canDrawFromDiscard) {
    cardDrew = drawCard(state, canDrawFromDiscard)!;
  } else {
    // decide if bot should draw from deck or discard pile
    const newObjectiveArea = guessBestPlay(
      allCards.concat(topDiscardPile),
      player.phase
    );
    const discardedCardUsed = !!newObjectiveArea.find((cards) =>
      cards.find((card) => card.id == topDiscardPile.id)
    );
    // drawCard does useful things like refilling the deck when it runs out of cards
    cardDrew = drawCard(state, discardedCardUsed)!;
  }
  // update player
  player = state.players.find((player) => player.id === state.activePlayerId)!;
  console.log("bot drew", cardDrew.text);
  // add cards to objectiveArea
  const newObjectiveArea = guessBestPlay(player.hand, player.phase);
  console.log(
    "bot will set phaseObjectiveArea to ",
    newObjectiveArea.map((cards) => cards.map((card) => card.text)).join(", ")
  );
  // TODO : guestBestPlay doesnt handle wild usage
  player.phaseObjectiveArea = player.phaseObjectiveArea.map((o, index) => {
    const cards = newObjectiveArea[index];
    return {
      ...o,
      cards,
      canComplete: verifyPhase(o.type, cards, o.objectiveLength),
    };
  });
  player.hand = removeCardsFromArray(player.hand, newObjectiveArea.flat());
  // sort by card value while ignoring wilds
  const discardableCards = player.hand
    .filter((card) => card.type !== "wild")
    .sort((a, b) => {
      return b.value - a.value;
    });
  const cardToDiscard = discardableCards[0];
  let targetId: string | undefined;
  if (cardToDiscard.type == "skip") {
    // target player with highest score
    const targetPlayer = state.players
      .filter((p) => p.id !== player.id)
      .reduce(
        (target, player) => {
          if (!target) return player;
          if (player.score < target.score) return player;
        },
        undefined as Player | undefined
      )!;
    targetId = targetPlayer.id;
  }
  setTimeout(() => {
    onBotTurnEnd?.();
    discardCard(state, { card: cardToDiscard, targetId });
    // startNextTurn(state);
  }, 5000);
}
export function discardCard(
  state: GameState,
  config: {
    card: Card;
    targetId?: string;
    onBotTurnStart?: () => void;
    onBotTurnEnd?: () => void;
  }
) {
  if (state.activePlayerId == null || !state.canDiscard) return state;
  const { card, targetId, onBotTurnStart, onBotTurnEnd } = config;
  // const gameState = state; //deepclone(state);
  const player = state.players.find(
    (player) => player.id == state.activePlayerId
  );
  if (!player) return state;
  player.hand = player.hand.filter((card2) => card2.id !== card.id);
  state.discardPile.push(card);
  player.currentHandScore = scorePlayerCards(player);
  if (targetId) {
    state.skipQueue.push(targetId);
  }
  return startNextTurn(state, { onBotTurnStart, onBotTurnEnd });
}
export async function skipPlayer(
  players: GameState["players"],
  activePlayerId: string
) {
  const skippablePlayers = players.filter(
    (player) => player.id !== activePlayerId
  );
  const playersInfo = skippablePlayers.map(({ name, hand, score, id }) => {
    return {
      info: name + "\n" + `  Score:${score}\n` + `  Cards:${hand.length}`,
      text: name,
      onPress: () => Promise.resolve(id),
    };
  });
  return await AsyncAlert(
    "Pick a player to skip",
    playersInfo.map((p) => p.info).join("\n"),
    playersInfo.map(({ text, onPress }) => ({
      text,
      onPress,
    }))
  );
}
export async function skipThenDiscard(
  dispatch: GameStateDispatch,
  players: GameState["players"],
  activePlayerId: string,
  card: SkipCard,
  onBotTurnStart?: () => void,
  onBotTurnEnd?: () => void
) {
  const targetId = await skipPlayer(players, activePlayerId);
  dispatch({
    type: "discardCard",
    data: { card, targetId, onBotTurnStart, onBotTurnEnd },
  });
}
export function scorePlayerCards(player: Player) {
  const handScore = scoreCards(player.hand);
  // if phase isnt completed count cards in objectiveArea
  if (player.phaseCompleted) return handScore;
  const objectiveAreaScore = player.phaseObjectiveArea.reduce(
    (total, objectiveArea) => total + scoreCards(objectiveArea.cards),
    0
  );
  return handScore + objectiveAreaScore;
}

export const scoreCards = (cards: Card[]) => {
  return cards.reduce((total, card) => total + card.value, 0);
};

export const dealHand = (state: GameState) => {
  const shuffledDeck = shuffleArray(deck);
  const startPlayerIndex = state.roundsPlayed % state.players.length;
  const startPlayerId = state.players[startPlayerIndex].id;
  const hands: Card[][] = Array(state.totalPlayers)
    .fill(null)
    .map(() => []);
  for (
    let i = startPlayerIndex;
    i < state.totalPlayers * 10 + startPlayerIndex;
    i++
  ) {
    const index = i % state.totalPlayers;
    const card = shuffledDeck.shift()!;
    hands[index].push(card);
  }

  const topDiscardPile = shuffledDeck.shift()!;
  state.drawPile = shuffledDeck;
  state.discardPile = [topDiscardPile];
  state.activePlayerId = startPlayerId;
  state.canDraw = true;
  state.canDiscard = false;
  return hands;
};

type CardMoveData = {
  objectiveIndex: number;
  card: Card;
};

export const moveBetweenObjectiveAreas = (
  player: Player,
  config: { fromIndex: number; toIndex: number; card: Card }
) => {
  const { fromIndex, toIndex, card } = config;
  const toObjective = player.phaseObjectiveArea[toIndex];
  const fromObjective = player.phaseObjectiveArea[fromIndex];
  toObjective.cards.push(card);
  fromObjective.cards = removeCardFromArray(fromObjective.cards, card);
  updatePhaseObjectiveArea(player);
};

export const moveToObjectiveArea = (player: Player, config: CardMoveData) => {
  const { objectiveIndex, card } = config;
  player.phaseObjectiveArea[objectiveIndex].cards.push(card);
  player.hand = removeCardFromArray(player.hand, card);
  updatePhaseObjectiveArea(player);
};

export const moveFromObjectiveArea = (player: Player, config: CardMoveData) => {
  const { objectiveIndex, card } = config;
  const objectiveArea = player.phaseObjectiveArea[objectiveIndex];
  objectiveArea.cards = removeCardFromArray(objectiveArea.cards, card);
  player.hand.push(card);
  updatePhaseObjectiveArea(player);
};
export const completePhase = (player: Player) => {
  player.phaseCompleted = true;
  player.currentHandScore = scorePlayerCards(player);
};

export const hitObjective = (
  player: Player,
  players: Player[],
  config: {
    targetId?: string;
    objectiveIndex: number;
    card: Card;
    fromStart?: boolean;
  }
) => {
  const { targetId, objectiveIndex, card, fromStart } = config;
  const hitId = targetId || player.id;
  const targetPlayer = players.find(
    (player) => player.id == hitId && player.phaseCompleted
  );
  if (!targetPlayer) return;
  const targetObjective = targetPlayer.phaseObjectiveArea[objectiveIndex];
  if (canHit(targetObjective.type, targetObjective.cards, card, fromStart)) {
    if (fromStart) {
      targetObjective.cards.unshift(card);
    } else {
      targetObjective.cards.push(card);
    }
    player.hand = removeCardFromArray(player.hand, card);
    player.currentHandScore = scorePlayerCards(player);
  }
};
