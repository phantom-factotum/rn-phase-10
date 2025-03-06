import { CARD_HEIGHT, CARD_PREVIEW_WIDTH, CARD_WIDTH } from "@/constants/card";
import { StyleSheet, TouchableOpacity, ViewStyle } from "react-native";
import { TouchableOpacityProps } from "react-native-gesture-handler";
import { Card as CardView, Text } from "react-native-paper";

type Props = {
  onPress?: () => void;
  style?: ViewStyle;
  disabled: TouchableOpacityProps["disabled"];
};

export default function CardBack({ onPress, style, disabled }: Props) {
  return (
    <CardView style={[styles.container, style]}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.2}
        disabled={disabled}
      >
        <Text style={styles.text}>Phase 10</Text>
      </TouchableOpacity>
    </CardView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    padding: StyleSheet.hairlineWidth,
    backgroundColor: "#485b9b",
    justifyContent: "center",
    borderRadius: 10,
  },
  text: {
    fontFamily: "DragonSerialBold",
    fontSize: 24,
    color: "white",
    textAlign: "center",
    alignItems: "center",
    shadowColor: "black",
    shadowOffset: {
      width: 5,
      height: 5,
    },
    textShadowRadius: 10,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  header: {
    width: CARD_PREVIEW_WIDTH,
    height: CARD_PREVIEW_WIDTH,
    borderTopLeftRadius: CARD_PREVIEW_WIDTH / 4,
    borderBottomRightRadius: CARD_PREVIEW_WIDTH,
    paddingLeft: 3,
    // padding: "10%",
    // height: "25%",
    // alignSelf: "flex-end",
    // justifyContent: "center",
    // alignItems: "center",
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
    width: CARD_PREVIEW_WIDTH,
    height: CARD_PREVIEW_WIDTH,
    paddingRight: 2,
    // height: "25%",
    alignSelf: "flex-end",
    justifyContent: "flex-end",
    borderTopLeftRadius: CARD_PREVIEW_WIDTH,
    borderBottomRightRadius: CARD_PREVIEW_WIDTH / 4,
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
