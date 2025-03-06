import Deck from "@/constants/deck";
import { shuffleArray } from "@/helpers/array";
import type { Card, SkipCard } from "@/types";
import { atom } from "jotai";
import { atomWithReducer } from "jotai/utils";
import rfdc from "rfdc";
const deepclone = rfdc();

type TurnStatus = {
  canDraw: boolean;
  canDiscard: boolean;
  activePlayerId: string | null;
};

export const turnStatusAtom = atom<TurnStatus>({
  canDraw: true,
  canDiscard: false,
  activePlayerId: null,
});
export const activePlayerIdAtom = atom<string | null>(null);
export const totalPlayersAtom = atom(2);

export const deckAtom = atom<Card[]>(Deck);
export const discardPileAtom = atom<Card[]>([]);
export const lastDiscardedAtom = atom((get) => {
  const discardPile = get(discardPileAtom);
  return discardPile[discardPile.length - 1];
});

type GameState = {
  drawPile: Card[];
  discardPile: Card[];
  canDraw: boolean;
  canDiscard: boolean;
  skipQueue: string[];
  activePlayerId: string | null;
  roundsPlayed: number;
  canStartNextRound: boolean;
  gameHasEnded: boolean;
};

const initialGameState: GameState = {
  drawPile: shuffleArray(Deck),
  discardPile: [],
  canDraw: false,
  canDiscard: false,
  skipQueue: [],
  activePlayerId: null,
  roundsPlayed: 0,
  canStartNextRound: false,
  gameHasEnded: false,
};

export enum GameActionTypes {
  drawCard = 1,
  discardCard,
  startTurn,
  endTurn,
  startGame,
  roundEnded,
  startNextRound,
  endGame,
}
type BaseGameAction = {
  type: GameActionTypes;
};
type DrawCardAction = BaseGameAction & {
  type: GameActionTypes.drawCard;
  data: {
    isFromDiscard?: boolean;
    onComplete: (card: Card) => void;
  };
};

type BasicDiscardAction = BaseGameAction & {
  type: GameActionTypes.discardCard;
  data: {
    // this doesnt work
    // card: NumberCard|WildCard;
    card: Card;
    targetId?: string;
    playerIds: string[];
  };
};
// in discard action, when I checked for card.type == "skip"
// I thought typescript would infer that the action.data.targetId
// should exist
type SkipDiscardAction = BasicDiscardAction & {
  data: {
    card: SkipCard;
    targetId: string;
  };
};

type StartGame = BaseGameAction & {
  type: GameActionTypes.startGame;
  data: {
    totalPlayers: number;
    onHandDealt: (hands: Card[][]) => void;
    startPlayerId: string;
  };
};
type StartNextRound = BaseGameAction & {
  type: GameActionTypes.startNextRound;
  data: {
    startPlayerId: string;
    totalPlayers: number;
    onHandDealt: (hands: Card[][]) => void;
  };
};
type VoidAction = {
  type: GameActionTypes.endTurn | GameActionTypes.roundEnded;
};
type GameEndAction = {
  type: GameActionTypes.endGame;
};
type GameActions =
  | DrawCardAction
  | SkipDiscardAction
  | BasicDiscardAction
  | VoidAction
  | StartGame
  | StartNextRound
  | GameEndAction;
// typescript couldnt automatically infer that SkipCard
// discards would contain additional info
function isSkipAction(
  action: BasicDiscardAction | SkipDiscardAction
): action is SkipDiscardAction {
  return action.data.card.type == "skip";
}
export const gameStateAtom = atomWithReducer<GameState, GameActions>(
  initialGameState,
  (state, action) => {
    if (!action) return state;
    const updatedState = deepclone(state);
    switch (action.type) {
      case GameActionTypes.drawCard: {
        const { isFromDiscard, onComplete } = action.data;
        let card: Card;
        if (isFromDiscard) {
          if (updatedState.discardPile.length < 0) return updatedState;
          card = updatedState.discardPile.pop() as Card;
        } else {
          card = updatedState.drawPile.shift() as Card;
          if (updatedState.drawPile.length == 0) {
            updatedState.drawPile = shuffleArray(updatedState.discardPile);
            updatedState.discardPile = [];
          }
        }
        // player adds  card to hand
        onComplete(card);
        // prevent player from infinitely drawing
        updatedState.canDraw = false;
        updatedState.canDiscard = true;
        return updatedState;
      }
      case GameActionTypes.discardCard: {
        // handle skip card
        if (isSkipAction(action)) {
          updatedState.skipQueue.push(action.data.targetId);
        }
        updatedState.discardPile.push(action.data.card);
        updatedState.canDraw = true;
        updatedState.canDiscard = false;
        // figure who's turn it is
        const { playerIds } = action.data;
        const activePlayerIndex = playerIds.findIndex(
          (id) => updatedState.activePlayerId == id
        );
        let currentIndex = (activePlayerIndex + 1) % playerIds.length;
        // if player is at top of skipQueue skip and remove them from queue
        while (updatedState.skipQueue[0] == playerIds[currentIndex]) {
          currentIndex = (currentIndex + 1) % playerIds.length;
          updatedState.skipQueue.shift();
        }
        updatedState.activePlayerId = playerIds[currentIndex];
        return updatedState;
      }

      case GameActionTypes.startGame: {
        const { totalPlayers, onHandDealt, startPlayerId } = action.data;
        const shuffledDeck = shuffleArray(Deck);
        const hands: Card[][] = Array(action.data.totalPlayers)
          .fill(null)
          .map(() => []);
        for (let i = 0; i < totalPlayers * 10; i++) {
          const index = i % totalPlayers;
          const card = shuffledDeck.shift() as Card;
          hands[index].push(card);
        }
        const firstDiscardedCard = shuffledDeck.shift() as Card;
        updatedState.drawPile = shuffledDeck;
        updatedState.discardPile = [firstDiscardedCard];
        updatedState.activePlayerId = startPlayerId;
        updatedState.canDraw = true;
        updatedState.canDiscard = false;
        onHandDealt(hands);
        return updatedState;
      }
      case GameActionTypes.roundEnded: {
        updatedState.canStartNextRound = true;
        updatedState.roundsPlayed++;
        return updatedState;
      }
      case GameActionTypes.startNextRound: {
        updatedState.canStartNextRound = false;
        updatedState.canDiscard = false;
        updatedState.canDraw = true;
        updatedState.activePlayerId = action.data.startPlayerId;
        const shuffledDeck = shuffleArray(Deck);
        const hands: Card[][] = Array(action.data.totalPlayers)
          .fill(null)
          .map(() => []);
        for (let i = 0; i < action.data.totalPlayers * 10; i++) {
          const index = i % action.data.totalPlayers;
          const card = shuffledDeck.shift() as Card;
          hands[index].push(card);
        }
        action.data.onHandDealt(hands);
        const firstDiscardedCard = shuffledDeck.shift() as Card;
        updatedState.drawPile = shuffledDeck;
        updatedState.discardPile = [firstDiscardedCard];
        return updatedState;
      }
      case GameActionTypes.endGame: {
        // get players who has completed 10th phase
        // if one player, make them the winner
        // else 10th phase player with lowest score is winner
      }
      default:
        return state;
    }
  }
);
