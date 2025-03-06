import useGameHandler from "@/atoms/game/index";
import { playersAtom } from "@/atoms/game/player";
import { ActionType } from "@/atoms/game/types";
import Deck from "@/components/Deck";
import DiscardPile from "@/components/DiscardPile";
import NextRoundModal from "@/components/NextRoundModal";
import PlayerHand from "@/components/PlayerHand";
// import useGameHandler, { Players } from "@/hooks/useGameHandler";
import { Card } from "@/types";
import {
  DndProvider,
  DndProviderProps,
  Draggable,
  Droppable,
  ItemOptions,
} from "@mgcrea/react-native-dnd";
import { useAtom } from "jotai";
import { Dimensions, StyleSheet, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Button, Portal } from "react-native-paper";
import { runOnJS, useSharedValue } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
type OnDragEnd = ({
  active,
  over,
}: {
  active: ItemOptions;
  over: ItemOptions | null;
}) => void;

const initialPhase = 1;
const showFailedDrops = false;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("screen");

export default function HomeScreen() {
  const dragEndX = useSharedValue(0);
  const [players, playersDispatch] = useAtom(playersAtom);
  const {
    lastDiscarded,
    startGame,
    activePlayerId,
    canDiscard,
    canDraw,
    ...gameHandler
  } = useGameHandler();

  const onDragEnd: DndProviderProps["onDragEnd"] = ({ active, over }) => {
    "worklet";
    if (!activePlayerId) {
      return;
    }
    // ids are stored as UniqueIdentifiers rather than strings
    const overId = over?.id.toString();
    const activeId = active.id.toString();
    const activePlayer = players[activePlayerId];
    // is drawing card
    if (activeId == "takeFromDeck" || activeId == "takeFromDiscardPile") {
      if (overId == `droppable-hand-${activePlayerId}`) {
        const isFromDiscard = activeId === "takeFromDiscardPile";
        runOnJS(gameHandler.drawCard)(isFromDiscard);
      }
    }
    // is discarding from hand
    else if (overId === "addToPile" && !activeId.includes("objectiveArea")) {
      const card: Card = active.data.value.card;
      runOnJS(gameHandler.discardCard)(card);
    } else if (activeId === overId) {
      return;
    }
    // dropping to objective area
    else if (overId?.includes("objectiveArea")) {
      const objectiveIndex: number | undefined =
        over?.data.value?.objectiveIndex;
      const card: Card | undefined = active.data.value.card;
      const targetId: string | undefined = over?.data.value.id;
      console.log(activeId, overId, activePlayer.phaseCompleted);
      if (!card || objectiveIndex === undefined) return;
      // player is moving cards between objective areas
      else if (activeId.includes("objectiveArea")) {
        // there are 2 objective areas at most
        const fromIndex = (objectiveIndex + 1) % 2;
        runOnJS(playersDispatch)(activePlayerId, {
          type: ActionType.moveBetweenObjectiveAreas,
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
        !activePlayer.phaseCompleted
      ) {
        // moving to phase area doesnt exclude moved card from being in score
        runOnJS(playersDispatch)(activePlayerId, {
          type: ActionType.moveToObjectiveArea,
          data: {
            card,
            objectiveIndex,
          },
        });
      }
      // hit if dropping card over phase area and has completed phase
      else if (activePlayer.phaseCompleted) {
        // to roughly estimate whether the start or end of run has been hit
        // its necessary to know how many objectives there are
        let isFromStart = false;
        const totalObjectives =
          players[targetId || activePlayerId].phaseObjectiveArea.length;
        // there are at most 2 objectives
        const dropAreaWidth = SCREEN_WIDTH / (2 * totalObjectives);
        const dropAreaStart = dropAreaWidth * (objectiveIndex + 1);
        const middlePoint = dropAreaStart + dropAreaWidth / 2;
        console.log(middlePoint);
        isFromStart = dragEndX.value < middlePoint;
        runOnJS(gameHandler.hitObjective)({
          card,
          objectiveIndex,
          targetId: targetId || activePlayerId,
          isFromStart,
        });
      }
    }
    // a card is being dropped to hand
    else if (overId?.includes("hand-")) {
      const card = active.data.value.card as Card | undefined;
      const objectiveIndex: number | undefined =
        active.data.value.objectiveIndex;
      if (!card || objectiveIndex === undefined) return;
      // activePlayer is dropping to objective
      if (overId.includes(activePlayerId)) {
        runOnJS(playersDispatch)(activePlayerId, {
          type: ActionType.moveFromObjectiveArea,
          data: { card, objectiveIndex },
        });
      }
    }
    // hitting objective
    else {
      if (showFailedDrops) {
        console.log("drag/dropping to unknown location ");
        console.log(activeId, active.data.value, over?.id);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Button onPress={startGame}>Deal Hand</Button>

      {activePlayerId && (
        <DndProvider
          onDragEnd={onDragEnd}
          activationDelay={64}
          key={
            // force draggable to rerender when activePlayerId changes
            activePlayerId +
            Object.values(players)
              .map(
                (p) =>
                  p.phaseCompleted.toString() + p.cards.length + p.hand.length
              )
              .join("-")
          }
          onFinalize={(e) => {
            "worklet";
            dragEndX.value = e.x;
          }}
        >
          <View style={[styles.drawCard, canDraw && styles.active]}>
            <Draggable id="takeFromDeck" disabled={!canDraw}>
              <Deck
                deck={gameHandler.drawPile}
                drawCard={gameHandler.drawCard}
                activePlayerId={activePlayerId}
                canDraw={canDraw}
              />
            </Draggable>
            <Draggable id="takeFromDiscardPile" disabled={!canDraw}>
              <Droppable id="addToPile" disabled={!canDiscard}>
                <DiscardPile
                  style={canDiscard ? styles.active : undefined}
                  lastDiscarded={
                    gameHandler.discardPile[gameHandler.discardPile.length - 1]
                  }
                  drawCard={gameHandler.drawCard}
                  activePlayerId={activePlayerId}
                  canDraw={canDraw}
                />
              </Droppable>
            </Draggable>
          </View>
          <ScrollView style={{ backgroundColor: "rgb(26, 25, 25)" }}>
            {Object.values(players).map((player, ix) => {
              return (
                <PlayerHand
                  player={player}
                  playersDispatch={playersDispatch}
                  activePlayerId={activePlayerId}
                  canDiscard={canDiscard}
                  canDraw={canDraw}
                  name={player.id == "player" ? "Your" : `NPC ${ix}'s`}
                  key={player.id}
                />
              );
            })}
          </ScrollView>
        </DndProvider>
      )}
      <Portal>
        <NextRoundModal
          players={players}
          startNextRound={gameHandler.startNextRound}
        />
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 5,
    justifyContent: "center",
    // alignItems: "center",
  },
  discardPile: {
    width: "100%",
    padding: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  drawCard: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-evenly",
    paddingVertical: 10,
  },
  active: {
    borderWidth: 3,
    borderRadius: 15,
    borderColor: "lightblue",
  },
});
