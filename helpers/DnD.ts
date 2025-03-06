import { Card } from "@/types";
import { ItemOptions } from "@mgcrea/react-native-dnd";

export const DroppableTypes = {
  hand: "hand",
};

export const extractObjectiveData = (dndObj: ItemOptions) => {
  const card: Card | undefined = dndObj.data.value.card;
  const objectiveIndex: number | undefined = dndObj.data.value.objectiveIndex;
  // if (!card || objectiveIndex === undefined) return null;
  return { card, objectiveIndex };
};
