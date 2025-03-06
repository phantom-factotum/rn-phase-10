import { CARD_PREVIEW_WIDTH, CARD_WIDTH } from "@/constants/card";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import CardBack from "./CardBack";

type Props = {
  totalCards: number;
  title?: string;
  isActivePlayer?: boolean;
};
export default function HiddenCards({
  totalCards,
  title,
  isActivePlayer,
}: Props) {
  return (
    <View style={[styles.container, isActivePlayer && styles.isActivePlayer]}>
      {title && <Text>{title}:</Text>}
      <View style={{ flexDirection: "row" }}>
        {Array(totalCards)
          .fill(null)
          .map((card, i) => (
            <CardBack
              disabled
              key={`hidden-card-${i}`}
              style={{
                // position: "absolute",
                transform: [
                  { translateX: -(CARD_WIDTH - CARD_PREVIEW_WIDTH) * i },
                ],
              }}
            />
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
