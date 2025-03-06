import { Card } from "@/types";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import RenderCard from "./RenderCard";
type Props = {
  cards: Card[];
  title?: string;
  isActivePlayer?: boolean;
};
export default function RenderCards({ cards, title, isActivePlayer }: Props) {
  return (
    <View style={[styles.container, isActivePlayer && styles.isActivePlayer]}>
      {title && <Text>{title}:</Text>}
      <View style={{ flexDirection: "row" }}>
        {cards.map((card, index) => (
          <RenderCard card={card} index={index} compactMode />
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    // flex: 1,
    width: "90%",
    alignSelf: "center",

    padding: 5,
    margin: 5,
    marginVertical: 10,
  },
  isActivePlayer: {
    borderWidth: 1,
    borderColor: "blue",
  },
});
