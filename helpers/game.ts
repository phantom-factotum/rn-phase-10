import { GameState, GameStateDispatch, Player } from "@/atoms/types";
import deck from "@/constants/deck";
import { Card, SkipCard } from "@/types";
import AsyncAlert from "react-native-alert-async";
import rfdc from "rfdc";
import { shuffleArray } from "./array";
const deepclone = rfdc();
export const drawCard = (state: GameState, isFromDiscard?: boolean) => {
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
};
const startNextTurn = (gameState: GameState) => {
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
  return gameState;
};
export const discardCard = (
  state: GameState,
  card: Card,
  targetId?: string
) => {
  if (state.activePlayerId == null || !state.canDiscard) return state;
  const gameState = deepclone(state);
  const player = gameState.players.find(
    (player) => player.id == gameState.activePlayerId
  );
  if (!player) return state;
  player.hand = player.hand.filter((card2) => card2.id !== card.id);
  gameState.discardPile.push(card);
  player.currentHandScore = scorePlayerCards(player);
  return startNextTurn(gameState);
  return gameState;
};
export const skipPlayer = async (
  players: GameState["players"],
  activePlayerId: string
) => {
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
};
export const skipThenDiscard = async (
  dispatch: GameStateDispatch,
  players: GameState["players"],
  activePlayerId: string,
  card: SkipCard
) => {
  const targetId = await skipPlayer(players, activePlayerId);
  dispatch({ type: "discardCard", data: { card, targetId } });
};
export const scorePlayerCards = (player: Player) => {
  const handScore = scoreCards(player.hand);
  // if phase isnt completed count cards in objectiveArea
  if (player.phaseCompleted) return handScore;
  const objectiveAreaScore = player.phaseObjectiveArea.reduce(
    (total, objectiveArea) => total + scoreCards(objectiveArea.cards),
    0
  );
  return handScore + objectiveAreaScore;
};

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

  const firstDiscardedCard = shuffledDeck.shift()!;
  state.drawPile = shuffledDeck;
  state.discardPile = [firstDiscardedCard];
  state.activePlayerId = startPlayerId;
  state.canDraw = true;
  state.canDiscard = false;
  return hands;
};
