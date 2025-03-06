import { Card } from "@/types";
import { StyleSheet, View, ViewStyle } from "react-native";
import { Text } from "react-native-paper";
import BlankCard from "./BlankCard";
import RenderCard from "./RenderCard";
type Props = {
  lastDiscarded: Card;
  drawCard: (bool?: boolean) => void;
  activePlayerId: string | null;
  canDraw: boolean;
  style?: ViewStyle;
};
export default function DiscardPile({
  lastDiscarded,
  drawCard,
  activePlayerId,
  canDraw,
  style,
}: Props) {
  return !lastDiscarded ? (
    <BlankCard style={style}>
      <View style={styles.emptyContainer}>
        <Text style={styles.faintText}>Discard Pile</Text>
      </View>
    </BlankCard>
  ) : (
    <RenderCard card={lastDiscarded} />
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  faintText: {
    color: "rgb(180, 180, 180)",
    textAlign: "center",
  },
});
