import { gameStateAtom } from "@/atoms/gameState";
import Deck from "@/components/Deck";
import DiscardPile from "@/components/DiscardPile";
import DropdownMenu from "@/components/DropdownMenu";
import NextRoundModal from "@/components/NextRoundModal";
import PlayerHand from "@/components/PlayerHand";
import { skipThenDiscard } from "@/helpers/game";
// import useGameHandler, { Players } from "@/hooks/useGameHandler";
import { Card } from "@/types";
import {
  DndProvider,
  DndProviderProps,
  Draggable,
  Droppable,
} from "@mgcrea/react-native-dnd";
import { useAtom } from "jotai";
import { useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Button, Portal, useTheme } from "react-native-paper";
import { runOnJS, useSharedValue } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const initialPhase = 1;
const showFailedDrops = false;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("screen");
const totalPlayerChoices = [2, 3, 4].map((value) => ({
  value,
  label: value.toString(),
}));
const initialPhaseChoices = Array(10)
  .fill(null)
  .map((_, i) => ({
    value: i,
    label: `Phase ${i + 1}`,
  }));

export default function HomeScreen() {
  const dragEndX = useSharedValue(0);
  const [gameState, dispatch] = useAtom(gameStateAtom);
  const { activePlayerId, players, canDiscard, canDraw } = gameState;
  const [totalPlayers, setTotalPlayers] = useState(2);
  const [initialPhase, setInitialPhase] = useState(0);
  const theme = useTheme();
  // This feels overloaded but the react-native-dnd Grid/Stack components
  // could not provide this functionality
  // NOTE: DndProvider crashes app if callback functions arent a worklet or if
  // state setters are called in them without using runOnJS (tested this when
  // using useState rather than jotai so maybeits unnecessary)
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
        runOnJS(skipThenDiscard)(dispatch, players, activePlayerId, card);
      } else {
        runOnJS(dispatch)({ type: "discardCard", data: { card } });
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
        const dropAreaWidth = SCREEN_WIDTH / (2 * totalObjectives);
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

  return (
    <SafeAreaView style={styles.container}>
      {!activePlayerId && (
        <>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <DropdownMenu
              options={totalPlayerChoices}
              onSelect={setTotalPlayers}
              placeholder={`Total Players: ${totalPlayers}`}
              visible={false}
            />
            <DropdownMenu
              options={initialPhaseChoices}
              onSelect={setInitialPhase}
              placeholder={`Initial Phase: ${initialPhase + 1}`}
              visible={false}
            />
          </View>
          <Button
            onPress={() =>
              dispatch({
                type: "startGame",
                data: {
                  totalPlayers,
                  phase: initialPhase,
                },
              })
            }
          >
            Deal Hand
          </Button>
        </>
      )}
      {activePlayerId && (
        <DndProvider
          onDragEnd={onDragEnd}
          // a delay will allow ScrollView to function
          activationDelay={64}
          key={
            // onDragEnd event was using stale state so I force the DndProvider
            // to rerender to use recent state. This occurred when I was using useState rather than
            // jotai so this could be unnecessary
            activePlayerId +
            players
              .map((p) => p.phaseCompleted.toString() + p.hand.length)
              .join("-")
          }
          onFinalize={(e) => {
            "worklet";
            // used to determine whether objective is being
            // hit from the start or end
            dragEndX.value = e.x;
          }}
        >
          <View style={[styles.drawCard, canDraw && styles.active]}>
            <Draggable id="takeFromDeck" disabled={!canDraw}>
              <Deck
                deck={gameState.drawPile}
                drawCard={() =>
                  dispatch({
                    type: "drawCard",
                    data: {
                      isFromDiscardPile: false,
                    },
                  })
                }
                activePlayerId={activePlayerId}
                canDraw={canDraw}
              />
            </Draggable>
            <Draggable id="takeFromDiscardPile" disabled={!canDraw}>
              <Droppable id="addToPile" disabled={!canDiscard}>
                <DiscardPile
                  style={canDiscard ? styles.active : undefined}
                  lastDiscarded={
                    gameState.discardPile[gameState.discardPile.length - 1]
                  }
                  drawCard={() =>
                    dispatch({
                      type: "drawCard",
                      data: { isFromDiscardPile: true },
                    })
                  }
                  activePlayerId={activePlayerId}
                  canDraw={canDraw}
                />
              </Droppable>
            </Draggable>
          </View>
          {/* 
          If you add enough players a scroll view becomes necessary
          but it causes the drag and drop component to become buggy
          */}
          <ScrollView style={{ backgroundColor: "rgb(26, 25, 25)" }}>
            {players.map((player, ix) => {
              return (
                <PlayerHand
                  player={player}
                  activePlayerId={activePlayerId}
                  canDiscard={canDiscard}
                  canDraw={canDraw}
                  name={player.name}
                  key={player.id}
                />
              );
            })}
          </ScrollView>
        </DndProvider>
      )}
      <Portal>
        <NextRoundModal gameState={gameState} dispatch={dispatch} />
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
  center: {
    alignItems: "center",
    // justifyContent: "center",
  },
});
