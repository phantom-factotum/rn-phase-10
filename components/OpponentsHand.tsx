import { Player } from "@/atoms/types";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  Directions,
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import PlayerHand from "./PlayerHand";

type Props = {
  players: Player[];
  activePlayerId: string;
};
export default function OpponentsHand({ players, activePlayerId }: Props) {
  const [visiblePlayerIndex, setVisiblePlayerIndex] = useState(0);
  const rightFling = Gesture.Fling()
    .direction(Directions.RIGHT)
    .onStart(() => {
      const nextIndex = Math.max(0, visiblePlayerIndex - 1);
      runOnJS(setVisiblePlayerIndex)(nextIndex);
    });
  const leftFling = Gesture.Fling()
    .direction(Directions.LEFT)
    .onStart(() => {
      const nextIndex = Math.min(players.length - 1, visiblePlayerIndex + 1);
      runOnJS(setVisiblePlayerIndex)(nextIndex);
    });
  const gesture = Gesture.Exclusive(leftFling, rightFling);
  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.container}>
        <PlayerHand
          player={players[visiblePlayerIndex]}
          activePlayerId={activePlayerId}
        />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
});
