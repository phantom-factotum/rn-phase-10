import { gameStateAtom } from "@/atoms/gameState";
import { Player } from "@/atoms/types";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useSetAtom } from "jotai";
import { StyleSheet, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";

import { getAvailableCards } from "@/helpers/player";
import DndButton from "./DndButton";
import DraggableCards from "./DraggableCards";
type Props = {
  player: Player;
  compactCards?: boolean;
  activePlayerId: string;
};

export default function PlayerHand({ player, activePlayerId }: Props) {
  const dispatch = useSetAtom(gameStateAtom);
  const isActivePlayer = player.id == activePlayerId;
  const theme = useTheme();
  const totalCards = getAvailableCards(player).length;

  return (
    <View style={[styles.container, isActivePlayer && styles.isActivePlayer]}>
      <Text style={{ textAlign: "center" }}>{player.name}</Text>
      <View style={{ flexDirection: "row", justifyContent: "space-evenly" }}>
        <Text>Score:{player.score}</Text>
        <Text>Total cards:{totalCards}</Text>
        {isActivePlayer && (
          <Text>Current card score:{player.currentHandScore}</Text>
        )}
      </View>
      {(isActivePlayer || player.phaseCompleted) && (
        <View>
          {isActivePlayer &&
            player.canCompletePhase &&
            !player.phaseCompleted && (
              <DndButton onPress={() => dispatch({ type: "completePhase" })}>
                <Button>Complete Phase</Button>
              </DndButton>
            )}
          <View style={styles.row}>
            {player.phaseObjectiveArea.map(
              ({ canComplete, cards, type, description }, index) => {
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
                        backgroundColor: theme.colors.background,
                      }}
                      cards={cards}
                      isDroppable={isActivePlayer || player.phaseCompleted}
                      isDraggable={isActivePlayer && !player.phaseCompleted}
                      dropData={{ objectiveIndex: index, id: player.id }}
                      dragData={{ objectiveIndex: index }}
                      id={`${player.id}-objectiveArea-${index}`}
                      title={description}
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
              }
            )}
          </View>
        </View>
      )}
      {/*
      to save space player's hand are not render when it isnt their turn 
      so information about the number of cards a player holds is hidden
      (unless skip card is played, where this info is revealed)
      */}
      {
        <View>
          <DraggableCards
            cards={isActivePlayer ? player.hand : getAvailableCards(player)}
            title={`${player.name} hand`}
            isDraggable={isActivePlayer}
            isDroppable={isActivePlayer}
            id={`hand-${player.id}`}
            // isHidden={!isActivePlayer}
          />
          <View style={styles.floatingButtonContainer}>
            <Text variant="bodyLarge">Sort by:</Text>
            <DndButton
              onPress={() => {
                dispatch({
                  type: "sortHand",
                  data: { type: "number", id: player.id },
                });
              }}
            >
              <MaterialCommunityIcons
                name="sort-numeric-ascending"
                size={36}
                color={theme.colors.primary}
              />
            </DndButton>
            <DndButton
              onPress={() => {
                dispatch({
                  type: "sortHand",
                  data: { type: "color", id: player.id },
                });
              }}
            >
              <MaterialCommunityIcons
                name="format-color-fill"
                size={36}
                color={theme.colors.primary}
              />
            </DndButton>
          </View>
        </View>
      }
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
  floatingButtonContainer: {
    alignItems: "flex-end",
    alignSelf: "flex-end",
    justifyContent: "flex-end",
    position: "absolute",
    // backgroundColor: "pink",
    // width: 100,
    // height: 100,
    right: 0,
    bottom: 20,
    zIndex: 30,
  },
});
