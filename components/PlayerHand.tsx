import { gameStateAtom } from "@/atoms/gameState";
import { Player } from "@/atoms/types";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useSetAtom } from "jotai";
import { StyleSheet, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";

import { getAvailableCards } from "@/helpers/player";
import DndButton from "./DndButton";
import DraggableCards from "./DraggableCards";
import SortButtons from "./PlayerSortButtons";
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
        <>
          {isActivePlayer && (
            <View style={{ flex: 1 }}>
              <DraggableCards
                style={{
                  // flex: 1,
                  padding: 0,
                  margin: 0,
                  backgroundColor: theme.colors.background,
                }}
                cards={player.hand}
                title={`${player.name} hand`}
                isDraggable={isActivePlayer}
                isDroppable={isActivePlayer}
                id={`hand-${player.id}`}
                isHidden={!isActivePlayer}
              />
              <SortButtons player={player} />
            </View>
          )}
          {player.canCompletePhase &&
            !player.phaseCompleted &&
            player.phaseObjectiveArea.every(
              // sometimes player.canCompletePhase doesnt reset to false at round start
              ({ cards }) => cards.length > 0
            ) && (
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
                    style={{
                      flex: 1,
                      marginHorizontal: 2,
                    }}
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
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    flex: 1,
    width: "100%",
    flexDirection: "row",
    // minHeight: CARD_HEIGHT * 2.1,
    // padding: 5,
    // height: CARD_HEIGHT * 1.52,
  },
  floatingButtonContainer: {
    alignItems: "flex-end",
    alignSelf: "flex-end",
    justifyContent: "flex-end",
    position: "absolute",
    // backgroundColor: "pink",
    // width: 100,
    // height: 100,
    right: 10,
    bottom: 0,
    zIndex: 30,
  },
});
