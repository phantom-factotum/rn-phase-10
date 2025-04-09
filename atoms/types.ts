import type { Card, Objectives, SkipCard } from "@/types";
export type Player = {
  id: string;
  name: string;
  phase: number;
  hand: Card[];
  phaseCompleted: boolean;
  score: number;
  currentHandScore: number;
  canCompletePhase: boolean;
  phaseObjectiveArea: {
    cards: Card[];
    canComplete: boolean;
    type: Objectives;
    objectiveLength: number;
    description: string;
  }[];
};
export type GameState = {
  totalPlayers: number;
  drawPile: Card[];
  discardPile: Card[];
  activePlayerId: string | null;
  canDraw: boolean;
  canDiscard: boolean;
  skipQueue: string[];
  roundsPlayed: number;
  roundEnded: boolean;
  gameEnded: boolean;
  players: Player[];
  winner: string | null;
};
export enum ActionTypes {
  drawCard = 1,
  discardCard,
  startGame,
  moveToObjectiveArea,
  moveBetweenObjectiveAreas,
  moveFromObjectiveArea,
}

export type Actions =
  | {
      type: "drawCard";
      data: { isFromDiscardPile?: boolean };
    }
  | {
      type: "discardCard";
      data: {
        card: Card;
        targetId?: undefined;
      };
    }
  | {
      type: "discardCard";
      data: {
        card: SkipCard;
        targetId: string;
      };
    }
  | {
      type: "startGame";
      data: {
        totalPlayers: number;
        phase?: number;
      };
    }
  | {
      type: "moveToObjectiveArea" | "moveFromObjectiveArea";
      data: {
        objectiveIndex: number;
        card: Card;
      };
    }
  | {
      type: "moveBetweenObjectiveAreas";
      data: {
        fromIndex: number;
        toIndex: number;
        card: Card;
      };
    }
  | {
      type: "completePhase" | "endRound" | "endGame";
    }
  | {
      type: "hitObjective";
      data: {
        targetId?: string;
        objectiveIndex: number;
        card: Card;
        fromStart?: boolean;
      };
    };
type SetAtom<Args extends any[], Result> = (...args: Args) => Result;
export type GameStateDispatch = SetAtom<[(Actions | undefined)?], void>;
// export type GGameState = ReturnType<typeof useGameState>[0]
