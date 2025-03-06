import { Card } from "@/types";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper";
import BlankCard from "./BlankCard";
import CardBack from "./CardBack";
import RenderCard from "./RenderCard";
type Props = {
  deck: Card[];
  lastDiscarded: Card;
  revealDeck?: boolean;
  drawCard: (bool?: boolean) => void;
  activePlayerId: string | null;
  canDraw: boolean;
};
export default function DrawCard({
  deck,
  revealDeck,
  lastDiscarded,
  drawCard,
  activePlayerId,
  canDraw,
}: Props) {
  return (
    <View style={styles.container}>
      <CardBack
        onPress={() => drawCard()}
        disabled={!activePlayerId || !canDraw}
      />
      <TouchableOpacity
        onPress={() => drawCard(true)}
        disabled={!activePlayerId || !canDraw}
      >
        {!lastDiscarded ? (
          <BlankCard>
            <View style={styles.emptyContainer}>
              <Text style={styles.faintText}>Discard Pile</Text>
            </View>
          </BlankCard>
        ) : (
          <RenderCard card={lastDiscarded} />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
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
