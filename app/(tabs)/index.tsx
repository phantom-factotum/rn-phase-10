import { gameStateAtom } from "@/atoms/gameState";
import Deck from "@/components/Deck";
import DiscardPile from "@/components/DiscardPile";
import DropdownMenu from "@/components/DropdownMenu";
import NextRoundModal from "@/components/NextRoundModal";
import PlayerHand from "@/components/PlayerHand";
import useOnDragEnd from "@/hooks/useOnDragEnd";
// import useGameHandler, { Players } from "@/hooks/useGameHandler";
import { DndProvider, Draggable, Droppable } from "@mgcrea/react-native-dnd";
import { useAtom } from "jotai";
import { useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Button, Portal, Text, useTheme } from "react-native-paper";
import { useSharedValue } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const initialPhase = 1;
const showFailedDrops = false;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("screen");
const totalPlayerChoices = [2, 3, 4].map((value) => ({
  value,
  label: value.toString(),
}));
const initialPhaseChoices = Array(10)
  .fill(null)
  .map((_, i) => ({
    value: i,
    label: `Phase ${i + 1}`,
  }));

export default function HomeScreen() {
  const dragEndX = useSharedValue(0);
  const [gameState, dispatch] = useAtom(gameStateAtom);
  const { activePlayerId, players, canDiscard, canDraw } = gameState;
  const [totalPlayers, setTotalPlayers] = useState(2);
  const [initialPhase, setInitialPhase] = useState(0);
  const [botsIsActive, setBotsIsActive] = useState(true);
  const [botIsPlaying, setBotIsPlaying] = useState(false);
  const theme = useTheme();
  const onDragEnd = useOnDragEnd(dragEndX, {
    showFailedDrops,
    onBotTurnStart: () => {
      console.log("setting bot is playing to true");
      setBotIsPlaying(true);
    },
    onBotTurnEnd: () => {
      console.log("setting bot is playing to false");
      setBotIsPlaying(false);
    },
  });
  const topDiscardPile =
    gameState.discardPile[gameState.discardPile.length - 1];
  return (
    <SafeAreaView style={styles.container}>
      {!activePlayerId && (
        <>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <DropdownMenu
              options={totalPlayerChoices}
              onSelect={setTotalPlayers}
              placeholder={`Total Players: ${totalPlayers}`}
            />
            <DropdownMenu
              options={initialPhaseChoices}
              onSelect={setInitialPhase}
              placeholder={`Initial Phase: ${initialPhase + 1}`}
            />
          </View>
          <Button
            onPress={() =>
              dispatch({
                type: "startGame",
                data: {
                  totalPlayers,
                  phase: initialPhase,
                  botsIsActive,
                },
              })
            }
          >
            Deal Hand
          </Button>
        </>
      )}
      {activePlayerId && (
        <DndProvider
          style={{ flex: 1 }}
          onDragEnd={onDragEnd}
          // a delay will allow ScrollView to function
          activationDelay={64}
          key={
            // onDragEnd event was using stale state so I force the DndProvider
            // to rerender to use recent state
            activePlayerId +
            players
              .map((p) => p.phaseCompleted.toString() + p.hand.length)
              .join("-")
          }
          onFinalize={(e) => {
            "worklet";
            // used to determine whether objective is being
            // hit from the start or end
            dragEndX.value = e.x;
          }}
        >
          <View style={[styles.drawCard, canDraw && styles.active]}>
            <Draggable id="takeFromDeck" disabled={!canDraw}>
              <Deck
                deck={gameState.drawPile}
                drawCard={() =>
                  dispatch({
                    type: "drawCard",
                    data: {
                      isFromDiscardPile: false,
                    },
                  })
                }
                activePlayerId={activePlayerId}
                canDraw={canDraw}
              />
            </Draggable>
            <Draggable
              id="takeFromDiscardPile"
              disabled={!canDraw || topDiscardPile?.type === "skip"}
            >
              <Droppable id="addToPile" disabled={!canDiscard}>
                <DiscardPile
                  style={canDiscard ? styles.active : undefined}
                  lastDiscarded={topDiscardPile}
                  drawCard={() =>
                    dispatch({
                      type: "drawCard",
                      data: { isFromDiscardPile: true },
                    })
                  }
                  activePlayerId={activePlayerId}
                  canDraw={canDraw}
                />
              </Droppable>
            </Draggable>
          </View>
          {/* 
          If you add enough players a scroll view becomes necessary
          but it causes the drag and drop component to become buggy
          */}
          <View style={{ flex: 1 }}>
            <ScrollView style={{ backgroundColor: "rgb(26, 25, 25)" }}>
              {players.map((player, ix) => {
                return (
                  <PlayerHand
                    player={player}
                    activePlayerId={activePlayerId}
                    key={player.id}
                  />
                );
              })}
            </ScrollView>
          </View>
        </DndProvider>
      )}
      {botIsPlaying && (
        <View
          style={[
            styles.waiting,
            { backgroundColor: theme.colors.secondaryContainer },
          ]}
        >
          <View style={{ opacity: 0.6 }}>
            <Text>Computer is playing...</Text>
          </View>
        </View>
      )}
      <Portal>
        <NextRoundModal />
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 5,
    justifyContent: "center",
    // alignItems: "center",
  },
  discardPile: {
    width: "100%",
    padding: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  drawCard: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-evenly",
    paddingVertical: 10,
  },
  active: {
    borderWidth: 3,
    borderRadius: 15,
    borderColor: "lightblue",
  },
  center: {
    alignItems: "center",
    // justifyContent: "center",
  },
  waiting: {
    position: "absolute",
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    // backgroundColor: "green",
    opacity: 0.6,
  },
});
