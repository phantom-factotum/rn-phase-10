import { GameState, GameStateDispatch, Player } from "@/atoms/types";
import deck from "@/constants/deck";
import { canHit } from "@/constants/phases";
import { Card, SkipCard } from "@/types";
import AsyncAlert from "react-native-alert-async";
import { removeItemFromArray, shuffleArray } from "./array";
import {
  findCardToDiscard,
  generateHits,
  shouldUseDiscard,
  updateBotPhaseObjectiveArea,
} from "./bot";
import { updatePhaseObjectiveArea } from "./player";

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

export function startNextTurn(
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
    gameState.botIsPlaying = true;
    return automateTurn(gameState, onBotTurnEnd, onBotTurnStart);
  } else {
    gameState.botIsPlaying = false;
    return gameState;
  }
  // return;
}

function automateTurn(
  state: GameState,
  onBotTurnEnd?: () => void,
  onBotTurnStart?: () => void
): GameState {
  onBotTurnStart?.();

  const fromDiscard = shouldUseDiscard(state);
  const cardDrew = drawCard(state, fromDiscard)!;
  let player = state.players.find(
    (player) => player.id == state.activePlayerId
  )!;
  console.log(player.name, "drew", cardDrew.text);
  // add cards to objectiveArea
  if (!player.phaseCompleted) {
    updateBotPhaseObjectiveArea(player);
    if (player.canCompletePhase) {
      console.log(player.name, "will complete the phase");
      completePhase(player);
    }
  }
  if (player.phaseCompleted) {
    generateHits(player, state.players).forEach((hit) => {
      hitObjective(player, state.players, hit);
    });
  }
  // sort by card value while ignoring wilds
  // NOTE: Assumes that all hittable cards have already been played
  const cardToDiscard = findCardToDiscard(player);
  // if the bot uses their entire hand to complete the phase
  // then cardToDiscard will be undefined and crash the game
  if (!cardToDiscard && player.hand.length == 0) {
    // bot has won game hopefully this will trigger round end
    // havent tested that this works
    return startNextTurn(state);
  }
  let targetId: string | undefined;
  console.log(player.name, "will discard", cardToDiscard.text);
  if (cardToDiscard.type == "skip") {
    console.log(state.players.map((p) => p.id));
    // target player with highest score
    const targetPlayer = state.players
      .filter((p) => p.id != player.id)
      .reduce(
        (target, player) => {
          if (!target) return player;
          if (player.score < target.score) return player;
        },
        undefined as Player | undefined
      );
    if (!targetPlayer) {
      console.log("no person to skip????");
      console.log(player.id);
    }
    targetId = targetPlayer?.id || player.id;
    console.log(player.name, "will skip", (targetPlayer || player).name);
  }
  onBotTurnEnd?.();
  return discardCard(state, {
    card: cardToDiscard,
    targetId,
    onBotTurnStart,
    onBotTurnEnd,
  });
}
export function discardCard(
  state: GameState,
  config: {
    card: Card;
    targetId?: string;
    onBotTurnStart?: () => void;
    onBotTurnEnd?: () => void;
  }
): GameState {
  if (state.activePlayerId == null || !state.canDiscard) return state;
  const { card, targetId, onBotTurnStart, onBotTurnEnd } = config;
  const player = state.players.find(
    (player) => player.id == state.activePlayerId
  );
  if (!player) return state;
  player.hand = removeItemFromArray(player.hand, card);
  state.discardPile.push(card);
  player.currentHandScore = scorePlayerCards(player);
  if (targetId) {
    state.skipQueue.push(targetId);
  }
  return startNextTurn({ ...state }, { onBotTurnStart, onBotTurnEnd });
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

const getNextIndex = (players: Player[], index: number, getPrev = false) => {
  let nextIndex = getPrev ? index - 1 : index + 1;
  if (nextIndex < 0) {
    nextIndex = players.length - 1;
  }
  return nextIndex % players.length;
};

export const dealHand = (state: GameState) => {
  const shuffledDeck = shuffleArray(deck);
  // set startPlayerIndex to the player before the actual starter
  // because we will call the startNextTurn function
  // we call the startNextTurn function because this where
  // bot automation happens
  const beforeStartPlayerIndex = getNextIndex(
    state.players,
    state.roundsPlayed,
    true
  );
  const beforePlayerId = state.players[beforeStartPlayerIndex].id;
  const startPlayerIndex = getNextIndex(state.players, state.roundsPlayed);
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
  // rules state that if skip is at top of discard pile
  // at round start then the starting player is skipped
  if (topDiscardPile.type === "skip") {
    // NOTE: starting the round at the player before starter
    // and then calling startNextTurn should skip startPlayer
    console.log("start player was skip");
    state.skipQueue.push(state.players[startPlayerIndex].id);
  }
  state.drawPile = shuffledDeck;
  state.discardPile = [topDiscardPile];
  state.activePlayerId = beforePlayerId;
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
  fromObjective.cards = removeItemFromArray(fromObjective.cards, card);
  updatePhaseObjectiveArea(player);
};

export const moveToObjectiveArea = (player: Player, config: CardMoveData) => {
  const { objectiveIndex, card } = config;
  player.phaseObjectiveArea[objectiveIndex].cards.push(card);
  player.hand = removeItemFromArray(player.hand, card);
  updatePhaseObjectiveArea(player);
};

export const moveFromObjectiveArea = (player: Player, config: CardMoveData) => {
  const { objectiveIndex, card } = config;
  const objectiveArea = player.phaseObjectiveArea[objectiveIndex];
  objectiveArea.cards = removeItemFromArray(objectiveArea.cards, card);
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
    player.hand = removeItemFromArray(player.hand, card);
    player.currentHandScore = scorePlayerCards(player);
  }
};
