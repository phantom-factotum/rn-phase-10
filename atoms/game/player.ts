import PHASES, { canHit, verifyPhase } from "@/constants/phases";
import {
  removeCardFromArray,
  scoreCards,
  updatePlayerAfterPhaseCompletion,
} from "@/helpers/array";
import { Card } from "@/types";
import { atom } from "jotai";
import { atomWithReducer } from "jotai/utils";
import rfdc from "rfdc";
import { Action, ActionType, PlayerMetadata } from "./types";
const deepclone = rfdc();

export const totalPlayersAtom = atom(2);

const updatePhaseObjectiveArea = (player: PlayerMetadata) => {
  const phaseData = PHASES[player.phase];
  // for each objective in phase
  player.phaseObjectiveArea = player.phaseObjectiveArea.map(
    (objectiveArea, index) => {
      // calculate if player can complete
      objectiveArea.canComplete = verifyPhase(
        phaseData.objectives[index].type,
        objectiveArea.cards,
        phaseData.objectives[index].objectiveLength
      );
      return objectiveArea;
    }
  );

  player.canCompletePhase = player.phaseObjectiveArea.every(
    ({ canComplete }) => canComplete
  );
  return player;
};
// player.hand is the cards that arent in their phase objective area
// player.cards is the true amount of cards a player holds
// (if a player fails to complete a phase player.hand will be less than player.cards)
// so this helper tries to hide how redunant the 2 states are
const handleHandCard = (
  player: PlayerMetadata,
  card: Card,
  removed = false
) => {
  if (removed) {
    player.hand = removeCardFromArray(player.hand, card);
    player.cards = removeCardFromArray(player.cards, card);
  } else {
    player.cards.push(card);
    player.hand.push(card);
  }
  player.currentHandScore = scoreCards(player.cards);
};
const resetPlayerState = (phase: number) => {
  const data: Omit<PlayerMetadata, "id" | "name" | "phase" | "score"> = {
    hand: [],
    cards: [],
    phaseCompleted: false,
    canCompletePhase: false,
    currentHandScore: 0,
    phaseObjectiveArea: PHASES[phase].objectives.map((o) => {
      return { type: o.type, cards: [], canComplete: false };
    }),
  };
  return data;
};
export type Player = ReturnType<typeof generatePlayer>;
export type Players = { [key: string]: PlayerMetadata };

export const generatePlayer = (id: string, name: string, phase = 0) => {
  const initialState: PlayerMetadata = {
    id,
    name,
    phase,
    score: 0,
    ...resetPlayerState(phase),
  };
  const playerAtom = atomWithReducer<PlayerMetadata, Action>(
    initialState,
    (player, action) => {
      if (!action?.type) return player;
      const updatedPlayer = deepclone(player);
      switch (action.type) {
        case ActionType.addToHand: {
          handleHandCard(updatedPlayer, action.data.card);
          return updatedPlayer;
        }
        case ActionType.removeFromHand: {
          handleHandCard(updatedPlayer, action.data.card, true);
          return updatedPlayer;
        }
        case ActionType.completePhase: {
          if (!updatedPlayer.canCompletePhase) return player;
          updatedPlayer.phaseCompleted = true;
          updatePlayerAfterPhaseCompletion(updatedPlayer);
          return updatedPlayer;
        }
        case ActionType.resetHand: {
          console.log("resetting hand");
          return { ...updatedPlayer, ...resetPlayerState(0) };
        }
        case ActionType.moveToObjectiveArea: {
          const { objectiveIndex, card } = action.data;
          const { phaseObjectiveArea } = updatedPlayer;
          updatedPlayer.hand = removeCardFromArray(updatedPlayer.hand, card);
          phaseObjectiveArea[objectiveIndex].cards.push(card);
          updatePhaseObjectiveArea(updatedPlayer);
          return updatedPlayer;
        }
        case ActionType.moveFromObjectiveArea: {
          const { objectiveIndex, card } = action.data;
          const { phaseObjectiveArea } = updatedPlayer;
          handleHandCard(updatedPlayer, card);
          phaseObjectiveArea[objectiveIndex].cards = removeCardFromArray(
            phaseObjectiveArea[objectiveIndex].cards,
            card
          );
          updatePhaseObjectiveArea(player);
          return updatedPlayer;
        }
        case ActionType.moveBetweenObjectiveAreas: {
          const { card, fromIndex, toIndex } = action.data;
          const fromObjective = updatedPlayer.phaseObjectiveArea[fromIndex];
          const toObjective = updatedPlayer.phaseObjectiveArea[toIndex];
          fromObjective.cards = removeCardFromArray(fromObjective.cards, card);
          toObjective.cards.push(card);
          updatePhaseObjectiveArea(updatedPlayer);
          return updatedPlayer;
        }
        case ActionType.hitObjective: {
          const { objectiveIndex, card, isFromStart, onHit } = action.data;
          const objectiveArea =
            updatedPlayer.phaseObjectiveArea[objectiveIndex];
          const { type, objectiveLength } =
            PHASES[updatedPlayer.phase].objectives[objectiveIndex];
          const canHitObjective = canHit(
            type,
            objectiveArea.cards,
            card,
            isFromStart
          );
          if (canHitObjective) {
            if (isFromStart) objectiveArea.cards.unshift(card);
            else objectiveArea.cards.push(card);
            handleHandCard(updatedPlayer, card, true);
            onHit?.();
          }
          return updatedPlayer;
        }
        case ActionType.acceptHand: {
          updatedPlayer.cards = action.data.cards;
          updatedPlayer.hand = action.data.cards;
          updatedPlayer.currentHandScore = scoreCards(updatedPlayer.cards);
          return updatedPlayer;
        }
        case ActionType.submitRound: {
          updatedPlayer.score += updatedPlayer.currentHandScore;
          updatedPlayer.hand = action.data.nextHand;
          updatedPlayer.cards = action.data.nextHand;
          updatedPlayer.currentHandScore = scoreCards(updatedPlayer.cards);
          if (updatedPlayer.phaseCompleted) {
            updatedPlayer.phase++;
            updatePlayerAfterPhaseCompletion(updatedPlayer);
            updatedPlayer.phaseCompleted = false;
          }
          updatedPlayer.phaseObjectiveArea = PHASES[
            updatedPlayer.phase
          ].objectives.map((o) => {
            return {
              type: o.type,
              cards: [],
              canComplete: false,
            };
          });
          return updatedPlayer;
        }
        default:
          return player;
      }
    }
  );
  return playerAtom;
};
export const playerId = "main-user";
const playerAtom = generatePlayer(playerId, "You", 9);
// this is an atom containing atoms
const npcsAtomAtom = atom((get) => {
  const totalPlayers = get(totalPlayersAtom) - 1;
  return Array(totalPlayers)
    .fill(null)
    .map((_, i) => generatePlayer(`NPC-${i + 1}`, `NPC ${i + 1}`));
});
// combine player and npcs into one piece of state
export const playersAtom = atom(
  (get) => {
    const npcs = get(npcsAtomAtom);
    // const player = get(playerAtom);
    return [...npcs, playerAtom].reduce((obj, atom) => {
      const p = get(atom);
      obj[p.id] = p;
      return obj;
    }, {} as Players);
  },
  // create setter that can set both playerAtom and npcsAtomAtom
  (get, set, id: string, action: Action) => {
    if (id == playerId) {
      set(playerAtom, action);
    } else {
      const npcsAtoms = get(npcsAtomAtom);
      const npcs = npcsAtoms.map((atom) => get(atom));
      const atomIndex = npcs.findIndex((player) => player.id === id);
      if (atomIndex < 0) return;
      const atom = npcsAtoms[atomIndex];
      set(atom, action);
    }
  }
);

export const playerIdsAtom = atom((get) => {
  return Object.keys(get(playersAtom));
});
