import { PlayersDispatch } from "@/atoms/game";
import { ActionType, PlayerMetadata } from "@/atoms/game/types";
import PHASES from "@/constants/phases";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Button, Text } from "react-native-paper";
import { runOnJS } from "react-native-reanimated";
import DraggableCards from "./DraggableCards";
type Props = {
  player: PlayerMetadata;
  playersDispatch: PlayersDispatch;
  compactCards?: boolean;
  activePlayerId: string;
  canDraw: boolean;
  canDiscard: boolean;
  name: string;
};

export default function PlayerHand({
  player,
  activePlayerId,
  playersDispatch,
  canDiscard,
  canDraw,
  name,
}: Props) {
  const isActivePlayer = player.id == activePlayerId;
  // Button presses were failing when nested within the Drag and drop component
  const tap = Gesture.Tap().onBegin(() => {
    console.log("button pressed");
    runOnJS(playersDispatch)(player.id, { type: ActionType.completePhase });
  });
  return (
    <View style={[styles.container, isActivePlayer && styles.isActivePlayer]}>
      <Text style={{ textAlign: "center" }}>{player.name}</Text>
      <View style={{ flexDirection: "row", justifyContent: "space-evenly" }}>
        <Text>Score:{player.score}</Text>
        <Text>Total cards:{player.cards.length}</Text>
        {isActivePlayer && (
          <Text>Current card score:{player.currentHandScore}</Text>
        )}
      </View>
      {(isActivePlayer || player.phaseCompleted) && (
        <View>
          {/* 
            Normal button presses do not register (I think its because its within the drag and drop component)
            GestureDetector tap gestures does work tho.
           */}
          {isActivePlayer &&
            player.canCompletePhase &&
            !player.phaseCompleted && (
              <GestureDetector gesture={tap}>
                <Button>Complete Phase</Button>
              </GestureDetector>
            )}
          <View style={styles.row}>
            {player.phaseObjectiveArea.map(({ canComplete, cards }, index) => {
              // where players stores cards to complete phase
              return (
                <View
                  style={{ flex: 1 }}
                  key={`${player.id}-objectiveArea-${index}`}
                >
                  <DraggableCards
                    style={{
                      flex: 1,
                      padding: 0,
                      margin: 0,
                      backgroundColor: "rgb(20, 20, 20)",
                    }}
                    cards={cards}
                    isDroppable={isActivePlayer || player.phaseCompleted}
                    isDraggable={isActivePlayer && !player.phaseCompleted}
                    dropData={{ objectiveIndex: index, id: player.id }}
                    dragData={{ objectiveIndex: index }}
                    id={`${player.id}-objectiveArea-${index}`}
                    title={PHASES[player.phase].objectives[index].description}
                  />
                  {canComplete && !player.phaseCompleted && (
                    <MaterialCommunityIcons
                      style={{ position: "absolute", right: 12, top: 24 }}
                      name="check-bold"
                      size={24}
                      color="green"
                    />
                  )}
                </View>
              );
            })}
          </View>
        </View>
      )}
      {/*
      to save space player's hand are not render when it isnt their turn 
      so information about the number of cards a player holds is hidden
      (unless skip card is played, where this info is revealed)
      */}
      {isActivePlayer && (
        <DraggableCards
          cards={!isActivePlayer ? player.cards : player.hand}
          title={`${name} hand`}
          isDraggable={isActivePlayer}
          isDroppable={isActivePlayer}
          id={`hand-${player.id}`}
          isHidden={!isActivePlayer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    width: "100%",
    marginVertical: 10,
    borderRadius: 15,
    alignSelf: "center",
  },
  isActivePlayer: {
    borderWidth: 1,
    borderColor: "blue",
  },
  row: {
    width: "100%",
    flexDirection: "row",
    padding: 5,
  },
});
