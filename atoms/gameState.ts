import deck from "@/constants/deck";
import PHASES, { canHit } from "@/constants/phases";
import { removeCardFromArray, scoreCards, shuffleArray } from "@/helpers/array";
import {
  dealHand,
  discardCard,
  drawCard,
  scorePlayerCards,
} from "@/helpers/game";
import { generatePlayers, updatePhaseObjectiveArea } from "@/helpers/player";
import { Card } from "@/types";
import { atomWithReducer } from "jotai/utils";
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
        const { totalPlayers, phase = 0 } = action.data;
        const players = generatePlayers(totalPlayers, phase);
        const hands = dealHand(newState);
        hands.forEach((hand, i) => {
          players[i].hand = hand;
        });

        return {
          ...resetState(newState),
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
        const { card, targetId } = action.data;
        const newState = deepclone(state);
        if (targetId) {
          newState.skipQueue.push(targetId);
        }
        return discardCard(newState, card);
      }

      case "moveBetweenObjectiveAreas": {
        const { fromIndex, toIndex, card } = action.data;
        if (!player) return state;
        const toObjective = player.phaseObjectiveArea[toIndex];
        const fromObjective = player.phaseObjectiveArea[fromIndex];
        toObjective.cards.push(card);
        fromObjective.cards = removeCardFromArray(fromObjective.cards, card);
        updatePhaseObjectiveArea(player);
        return newState;
      }
      case "moveToObjectiveArea": {
        const { objectiveIndex, card } = action.data;
        if (!player) return state;
        player.phaseObjectiveArea[objectiveIndex].cards.push(card);
        player.hand = removeCardFromArray(player.hand, card);
        updatePhaseObjectiveArea(player);
        return newState;
      }
      case "moveFromObjectiveArea": {
        const { objectiveIndex, card } = action.data;
        if (!player) return state;
        const objectiveArea = player.phaseObjectiveArea[objectiveIndex];
        objectiveArea.cards = removeCardFromArray(objectiveArea.cards, card);
        player.hand.push(card);
        updatePhaseObjectiveArea(player);
        return newState;
      }
      case "completePhase": {
        if (!player || !player.canCompletePhase) return state;
        player.phaseCompleted = true;
        return newState;
      }
      case "endRound": {
        const newState = deepclone(state);
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
            phaseCompleted: false,
            score: player.score + scorePlayerCards(player),
            phase,
            hand: hands[i],
            currentHandScore: scoreCards(hands[i]),
            phaseObjectiveArea: PHASES[phase].objectives.map((o) => ({
              ...o,
              canComplete: false,
              cards: [] as Card[],
            })),
          };
        });
        const filteredPlayers = newState.players.filter(
          (player) => player.phase >= PHASES.length - 1
        );
        if (newState.gameEnded) {
          if (filteredPlayers.length == 1)
            newState.winner = generateWinnerMessage(filteredPlayers);
          else {
            let hasTie = false;
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
        return newState;
      }
      case "hitObjective": {
        if (!player || !player.phaseCompleted) return state;
        const { targetId, objectiveIndex, card, fromStart } = action.data;
        const hitId = targetId || player.id;
        const targetPlayer = players.find(
          (player) => player.id == hitId && player.phaseCompleted
        );
        if (!targetPlayer) return state;
        const targetObjective = targetPlayer.phaseObjectiveArea[objectiveIndex];
        if (
          canHit(targetObjective.type, targetObjective.cards, card, fromStart)
        ) {
          if (fromStart) {
            targetObjective.cards.unshift(card);
          } else {
            targetObjective.cards.push(card);
          }
          player.hand = removeCardFromArray(player.hand, card);
          player.currentHandScore = scorePlayerCards(player);
        }
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
