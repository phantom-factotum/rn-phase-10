type BaseCard = {
  value: number;
  type: "number" | "wild" | "skip";
  color: string;
  id: string;
};
export type NumberCard = {
  text: string;
  color: string;
  type: "number";
  value: 5 | 10;
} & BaseCard;
export type WildCard = {
  type: "wild";
  text: "wild";
  value: 25;
} & BaseCard;
export type SkipCard = {
  type: "skip";
  text: "skip";
  color: "blue";
  value: 15;
} & BaseCard;

export type Card = NumberCard | WildCard | SkipCard;
export const OBJECTIVE_TYPES = ["run", "set", "color", "unidentified"] as const;
export type AllObjectives = (typeof OBJECTIVE_TYPES)[number];
export type Objectives = Exclude<AllObjectives, "unidentified">;
export type DroppableTypes = "hand" | "objectiveArea" | "discard";
