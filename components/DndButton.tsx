// regular buttons do not function within DndProvider
import { ReactNode } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
type Props = {
  onPress: () => void;
  children: ReactNode;
};

export default function DndButton({ onPress, children }: Props) {
  const tap = Gesture.Tap().onBegin(() => {
    runOnJS(onPress)();
  });
  return (
    <GestureDetector gesture={tap}>
      <View collapsable={false}>{children}</View>
    </GestureDetector>
  );
}
