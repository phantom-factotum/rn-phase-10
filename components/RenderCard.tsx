import { CARD_PREVIEW_WIDTH, CARD_WIDTH, CIRCLE_ARC } from "@/constants/card";
import { Card } from "@/types";
import { StyleSheet, View, ViewStyle } from "react-native";
import { Text } from "react-native-paper";
import Animated from "react-native-reanimated";
import BlankCard from "./BlankCard";
const AnimatedBlankCard = Animated.createAnimatedComponent(BlankCard);
type Props = {
  card: Card;
  style?: ViewStyle;
  index?: number;
};
const cardOffset = CARD_WIDTH - CARD_PREVIEW_WIDTH;
export default function RenderCard({ card, style, index = 0 }: Props) {
  const shortenedText =
    card.text.length > 2 ? card.text[0].toLocaleUpperCase() : card.text;

  return (
    <BlankCard
      style={{ zIndex: index, backgroundColor: "white", ...(style || {}) }}
    >
      <View style={{ height: "100%" }}>
        <View style={[styles.header, { backgroundColor: card.color }]}>
          <Text style={styles.headerText}>{shortenedText}</Text>
        </View>
        <View style={styles.content}>
          <Text style={[styles.contentText, { color: card.color }]}>
            {card.text.toLocaleUpperCase()}
          </Text>
        </View>
        <View style={[styles.footer, { backgroundColor: card.color }]}>
          <Text style={styles.footerText}>{shortenedText}</Text>
        </View>
      </View>
    </BlankCard>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  contentText: {
    fontSize: 18,
    fontWeight: "bold",
    shadowColor: "black",
    shadowOffset: {
      width: 4,
      height: 2,
    },
    textShadowRadius: 5,
  },
  header: {
    width: CIRCLE_ARC,
    height: CIRCLE_ARC,
    borderTopLeftRadius: CIRCLE_ARC / 4,
    borderBottomRightRadius: CIRCLE_ARC,
    paddingLeft: 3,
  },
  headerText: {
    fontSize: 10,
    textAlign: "left",
    color: "white",
    shadowColor: "black",
    shadowOffset: {
      width: 4,
      height: 2,
    },
    textShadowRadius: 10,
  },
  footer: {
    width: CIRCLE_ARC,
    height: CIRCLE_ARC,
    paddingRight: 2,
    alignSelf: "flex-end",
    justifyContent: "flex-end",
    borderTopLeftRadius: CIRCLE_ARC,
    borderBottomRightRadius: CIRCLE_ARC / 4,
  },
  footerText: {
    fontSize: 10,
    textAlign: "right",
    color: "white",
    shadowColor: "black",
    shadowOffset: {
      width: 4,
      height: 2,
    },
    textShadowRadius: 10,
  },
});
