import { CARD_HEIGHT, CARD_WIDTH } from "@/constants/card";
import { ReactNode, forwardRef } from "react";
import { StyleSheet, ViewStyle } from "react-native";
import { Card as CardView } from "react-native-paper";
import { View } from "react-native-reanimated/lib/typescript/Animated";
type Props = { children: ReactNode; style?: ViewStyle };
export default forwardRef<View, Props>(function BlankCard(
  { style, children },
  ref
) {
  return (
    <CardView style={[styles.container, style]} ref={ref}>
      {children}
    </CardView>
  );
});
const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 10,
    opacity: 1,
  },
});
