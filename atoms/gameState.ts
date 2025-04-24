import deck from "@/constants/deck";
import PHASES from "@/constants/phases";
import { scoreCards, shuffleArray } from "@/helpers/array";
import { sortCards } from "@/helpers/card";
import {
  completePhase,
  dealHand,
  discardCard,
  drawCard,
  hitObjective,
  moveBetweenObjectiveAreas,
  moveFromObjectiveArea,
  moveToObjectiveArea,
  scorePlayerCards,
  startNextTurn,
} from "@/helpers/game";
import { generatePlayers } from "@/helpers/player";
import { Card } from "@/types";
import { atomWithReducer } from "jotai/utils";
// import { makeShareable } from "react-native-reanimated/lib/typescript/shareables";
import rfdc from "rfdc";
import { Actions, GameState, Player } from "./types";

const deepclone = rfdc();

const initialTotalPlayers = 2;
const initialPhase = 9;
const initialPlayers = generatePlayers(initialTotalPlayers, initialPhase);
const initialState: GameState = {
  totalPlayers: initialTotalPlayers,
  drawPile: shuffleArray(deck),
  discardPile: [],
  skipQueue: [],
  canDraw: false,
  canDiscard: false,
  roundsPlayed: 0,
  activePlayerId: null,
  gameEnded: true,
  roundEnded: true,
  players: initialPlayers,
  winner: null,
  botsIsActive: false,
  botIsPlaying: false,
};
const resetState = (state: GameState) => {
  return {
    ...state,
    skipQueue: [],
    canDraw: true,
    canDiscard: false,
    gameEnded: false,
  };
};

export const gameStateAtom = atomWithReducer<GameState, Actions>(
  initialState,
  (state, action) => {
    if (!action) return state;
    const newState = deepclone(state);
    const { activePlayerId, canDraw, canDiscard, players } = newState;
    const player = players.find(
      (player) => player.id == newState.activePlayerId
    );
    if (!activePlayerId && action.type != "startGame") return state;
    switch (action.type) {
      case "startGame": {
        const {
          totalPlayers = 2,
          phase = 0,
          botsIsActive = true,
        } = action.data;
        newState.totalPlayers = totalPlayers;
        const players = generatePlayers(totalPlayers, phase);
        const hands = dealHand(newState);
        hands.forEach((hand, i) => {
          players[i].hand = hand;
        });

        return {
          ...resetState(newState),
          botsIsActive,
          activePlayerId: players[0].id,
          players,
        };
      }
      case "drawCard": {
        if (!canDraw) return state;
        const { isFromDiscardPile } = action.data;
        drawCard(newState, isFromDiscardPile);
        return newState;
      }
      case "discardCard": {
        if (!canDiscard) return state;
        return discardCard(newState, action.data);
        return newState;
      }

      case "moveBetweenObjectiveAreas": {
        if (!player) return state;
        moveBetweenObjectiveAreas(player, action.data);
        return newState;
      }
      case "moveToObjectiveArea": {
        if (!player) return state;
        moveToObjectiveArea(player, action.data);
        return newState;
      }
      case "moveFromObjectiveArea": {
        if (!player) return state;
        moveFromObjectiveArea(player, action.data);
        return newState;
      }
      case "completePhase": {
        if (!player || !player.canCompletePhase) return state;
        completePhase(player);
        return newState;
      }
      case "endRound": {
        newState.roundsPlayed++;
        newState.skipQueue = [];
        const hands = dealHand(newState);
        newState.canDiscard = false;
        newState.canDraw = true;

        newState.gameEnded =
          newState.players.filter((player) => player.phase >= PHASES.length - 1)
            .length > 0;

        newState.players = newState.players.map((player, i) => {
          let phase = player.phase;
          if (!newState.gameEnded) {
            phase += player.phaseCompleted ? 1 : 0;
          }
          return {
            ...player,
            score: player.score + scorePlayerCards(player),
            phase,
            hand: hands[i],
            currentHandScore: scoreCards(hands[i]),
            phaseObjectiveArea: PHASES[phase].objectives.map((o) => ({
              ...o,
              canComplete: false,
              cards: [] as Card[],
            })),
            phaseCompleted: false,
            botIsPlaying: false,
          };
        });
        const filteredPlayers = newState.players.filter(
          (player) => player.phase >= PHASES.length - 1
        );
        if (newState.gameEnded) {
          if (filteredPlayers.length == 1)
            newState.winner = generateWinnerMessage(filteredPlayers);
          else {
            // get lowest score
            const bestScore = filteredPlayers.reduce((score, player) => {
              return Math.min(score, player.score);
            }, Infinity);
            // handle cases where scores are tied
            const winners = filteredPlayers.filter(
              (player) => player.score == bestScore
            );
            newState.winner = generateWinnerMessage(winners);
          }
        }
        return startNextTurn(newState);
      }
      case "hitObjective": {
        if (!player || !player.phaseCompleted) return state;
        hitObjective(player, newState.players, action.data);
        return newState;
      }
      case "endGame": {
        return {
          ...resetState(state),
          activePlayerId: null,
          skipQueue: [],
          players: [],
          gameEnded: false,
          winner: null,
          roundsPlayed: 0,
          drawPile: [],
          discardPile: [],
        };
      }
      case "sortHand": {
        const { type, id } = action.data;
        const player = newState.players.find((p) => p.id == id);
        if (!player) return state;
        player.hand = sortCards(player.hand, type);
        return newState;
      }
      default: {
        return state;
      }
    }
  }
);

const generateWinnerMessage = (candidates: Player[]) => {
  if (candidates.length == 1) return `${candidates[0].name} has won the game`;
  else
    return `${candidates.map((player) => player.name).join(",")} has tied the game`;
};
