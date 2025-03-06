import { Card } from "@/types";
import { StyleSheet } from "react-native";
import CardBack from "./CardBack";
type Props = {
  deck: Card[];
  drawCard: (bool?: boolean) => void;
  activePlayerId: string | null;
  canDraw: boolean;
};
export default function Deck({
  deck,
  drawCard,
  activePlayerId,
  canDraw,
}: Props) {
  return (
    <CardBack
      onPress={() => drawCard()}
      disabled={true || !activePlayerId || !canDraw}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
});
