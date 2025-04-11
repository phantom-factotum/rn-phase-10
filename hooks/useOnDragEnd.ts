import { gameStateAtom } from "@/atoms/gameState";
import { skipThenDiscard } from "@/helpers/game";
import { Card } from "@/types";
import { DndProviderProps } from "@mgcrea/react-native-dnd";
import { useAtom } from "jotai";
import { useWindowDimensions } from "react-native";
import { runOnJS, SharedValue } from "react-native-reanimated";

export default function useOnDragEnd(
  dragEndX: SharedValue<number>,
  config: {
    showFailedDrops?: boolean;
    onBotTurnStart?: () => void;
    onBotTurnEnd?: () => void;
  }
) {
  const { width } = useWindowDimensions();
  const [gameState, dispatch] = useAtom(gameStateAtom);
  const { activePlayerId, players } = gameState;
  const { showFailedDrops, onBotTurnStart, onBotTurnEnd } = config;
  // This feels overloaded but the react-native-dnd Grid/Stack components
  // could not provide this functionality
  // NOTE: DndProvider crashes app if callback functions arent a worklet or if
  // state setters are called in them without using runOnJS
  const onDragEnd: DndProviderProps["onDragEnd"] = ({ active, over }) => {
    "worklet";
    if (!activePlayerId) {
      return;
    }
    // ids are stored as UniqueIdentifiers rather than strings
    const overId = over?.id.toString();
    const activeId = active.id.toString();
    const activePlayer = players.find((player) => player.id == activePlayerId);
    // is drawing card
    if (activeId == "takeFromDeck" || activeId == "takeFromDiscardPile") {
      if (overId == `droppable-hand-${activePlayerId}`) {
        const isFromDiscard = activeId === "takeFromDiscardPile";
        runOnJS(dispatch)({
          type: "drawCard",
          data: { isFromDiscardPile: isFromDiscard },
        });
      }
    }
    // is discarding from hand
    else if (overId === "addToPile" && !activeId.includes("objectiveArea")) {
      const card: Card = active.data.value.card;
      if (card.type == "skip") {
        runOnJS(skipThenDiscard)(
          dispatch,
          players,
          activePlayerId,
          card,
          onBotTurnStart,
          onBotTurnEnd
        );
      } else {
        runOnJS(dispatch)({
          type: "discardCard",
          data: { card, onBotTurnStart, onBotTurnEnd },
        });
      }
    } else if (activeId === overId) {
      return;
    }
    // dropping to  an objective area
    else if (overId?.includes("objectiveArea")) {
      const objectiveIndex: number | undefined =
        over?.data.value?.objectiveIndex;
      const card: Card | undefined = active.data.value.card;
      const targetId: string | undefined = over?.data.value.id;
      if (!card || objectiveIndex === undefined) return;
      // player is moving cards between objective areas
      else if (activeId.includes("objectiveArea")) {
        // there are 2 objective areas at most
        const fromIndex = (objectiveIndex + 1) % 2;
        runOnJS(dispatch)({
          type: "moveBetweenObjectiveAreas",
          data: {
            card,
            fromIndex,
            toIndex: objectiveIndex,
          },
        });
      }
      // player has dragged card to their own objective area
      else if (
        overId?.includes(activePlayerId) &&
        !activePlayer?.phaseCompleted
      ) {
        // moving to phase area doesnt exclude moved card from being in score
        runOnJS(dispatch)({
          type: "moveToObjectiveArea",
          data: {
            card,
            objectiveIndex,
          },
        });
      }
      // hit if dropping card over phase area and has completed phase
      else if (activePlayer?.phaseCompleted) {
        // to roughly estimate whether the start or end of run has been hit
        // its necessary to know how many objectives there are
        let isFromStart = false;
        const hitId = targetId || activePlayerId;
        const targetPlayer = players.find((player) => player.id === hitId);
        if (!targetPlayer) return;
        const totalObjectives = targetPlayer.phaseObjectiveArea.length;
        // droppable area will evenly split screen width between
        // objectives; so  x drops less than middle will be assumed to be
        // hit attempts at beginning of run; and greater than middle x drops
        // will be assumed to be a hit attempt at end of run
        const dropAreaWidth = width / (2 * totalObjectives);
        const dropAreaStart = dropAreaWidth * (objectiveIndex + 1);
        const middlePoint = dropAreaStart + dropAreaWidth / 2;
        isFromStart = dragEndX.value < middlePoint;
        runOnJS(dispatch)({
          type: "hitObjective",
          data: {
            card,
            objectiveIndex,
            targetId,
            fromStart: isFromStart,
          },
        });
      }
    }
    // a card is being dropped to hand
    else if (overId?.includes("hand-")) {
      const card = active.data.value.card as Card | undefined;
      const objectiveIndex: number | undefined =
        active.data.value.objectiveIndex;
      if (!card || objectiveIndex === undefined) return;
      if (overId.includes(activePlayerId)) {
        runOnJS(dispatch)({
          type: "moveFromObjectiveArea",
          data: { card, objectiveIndex },
        });
      }
    } else {
      if (showFailedDrops) {
        console.log("drag/dropping to unknown location ");
        console.log(activeId, active.data.value, over?.id);
      }
    }
  };
  return onDragEnd;
}
