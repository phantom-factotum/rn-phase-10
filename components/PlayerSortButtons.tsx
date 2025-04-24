import { gameStateAtom } from "@/atoms/gameState";
import { Player } from "@/atoms/types";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useSetAtom } from "jotai";
import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import DndButton from "./DndButton";
export default function SortButtons({ player }: { player: Player }) {
  const theme = useTheme();
  const dispatch = useSetAtom(gameStateAtom);
  return (
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
    flex: 1,
  },
  row: {
    width: "100%",
    flexDirection: "row",
    padding: 5,
    // height: CARD_HEIGHT * 1.52,
  },
  floatingButtonContainer: {
    position: "absolute",
    alignItems: "center",
    top: "25%",
    // alignSelf: "center",
    right: 10,
    // bottom: 0,
    zIndex: 30,
  },
});
