import { Card } from "@/types";
export enum ActionType {
  addToHand = 1,
  removeFromHand,
  completePhase,
  moveFromObjectiveArea,
  moveToObjectiveArea,
  moveBetweenObjectiveAreas,
  resetHand,
  hitObjective,
  acceptHand,
  submitRound,
}
type BaseAction = {
  type: ActionType;
};

type BasicCardAction = BaseAction & {
  type: ActionType.addToHand | ActionType.removeFromHand;
  data: {
    card: Card;
  };
};
type BasicObjectiveAreaAction = BaseAction & {
  type: ActionType.moveFromObjectiveArea | ActionType.moveToObjectiveArea;
  data: {
    objectiveIndex: number;
    card: Card;
  };
};
type MoveBetweenAreasAction = BaseAction & {
  type: ActionType.moveBetweenObjectiveAreas;
  data: {
    card: Card;
    fromIndex: number;
    toIndex: number;
  };
};
type HitObjectiveAction = BaseAction & {
  type: ActionType.hitObjective;
  data: {
    objectiveIndex: number;
    card: Card;
    isFromStart?: boolean;
    onHit?: () => void;
  };
};
type DatalessAction = {
  type: ActionType.completePhase | ActionType.resetHand;
};
type AcceptHandAction = BaseAction & {
  type: ActionType.acceptHand;
  data: {
    cards: Card[];
  };
};
type SubmitRoundAction = BaseAction & {
  type: ActionType.submitRound;
  data: {
    nextHand: Card[];
  };
};
export type Action =
  | BasicCardAction
  | BasicObjectiveAreaAction
  | MoveBetweenAreasAction
  | HitObjectiveAction
  | AcceptHandAction
  | DatalessAction
  | SubmitRoundAction;

export type PlayerMetadata = {
  id: string;
  name: string;
  phase: number;
  hand: Card[];
  cards: Card[];
  score: number;
  currentHandScore: number;
  phaseCompleted: boolean;
  canCompletePhase: boolean;
  phaseObjectiveArea: {
    cards: Card[];
    canComplete: boolean;
  }[];
};
