import { CARD_HEIGHT, CARD_PREVIEW_WIDTH, CARD_WIDTH } from "@/constants/card";
import { Card } from "@/types";
import { Data, Draggable, Droppable } from "@mgcrea/react-native-dnd";
import { StyleSheet, View, ViewStyle } from "react-native";
import { Text } from "react-native-paper";
import CardBack from "./CardBack";
import RenderCard from "./RenderCard";
type Props = {
  cards: Card[];
  title?: string;
  isHidden?: boolean;
  compactCards?: boolean;
  isDroppable: boolean;
  isDraggable: boolean;
  dropData?: Data;
  dragData?: Data;
  id: string;
  style?: ViewStyle;
};
export default function DraggableCards({
  cards,
  title,
  id,
  compactCards = true,
  isHidden,
  isDraggable,
  isDroppable,
  dropData,
  dragData,
  style,
}: Props) {
  // if (cards.length == 0) return;
  return (
    <Droppable
      style={[styles.container, style]}
      id={`droppable-${id}`}
      disabled={!isDroppable}
      key={`droppable-${id}`}
      data={dropData}
    >
      {title && <Text>{title}:</Text>}
      <View
        style={{
          flexDirection: "row",
          width: "100%",
          // marginHorizontal: 5,
          padding: 5,
        }}
      >
        {cards.map((card, index) => {
          const left = compactCards
            ? -(CARD_WIDTH - CARD_PREVIEW_WIDTH) * index
            : 0;
          return isHidden ? (
            <CardBack style={{ left }} disabled key={card.id} />
          ) : (
            <Draggable
              id={`draggable-${id}-${card.id}`}
              style={{
                left,
                zIndex: 20,
              }}
              disabled={!isDraggable}
              data={{ ...dragData, card }}
              key={card.id}
            >
              <RenderCard card={card} index={index} />
            </Draggable>
          );
        })}
      </View>
    </Droppable>
  );
}

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    width: "100%",
    // alignSelf: "center",
    padding: 5,
    paddingVertical: 10,
    margin: 5,
    marginVertical: 10,
    minWidth: CARD_WIDTH,
    minHeight: CARD_HEIGHT,
    borderWidth: 1,
    borderRadius: 15,
  },
  isActivePlayer: {
    borderWidth: 1,
    borderColor: "blue",
  },
});
