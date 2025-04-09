import { gameStateAtom } from "@/atoms/gameState";
import { useAtom } from "jotai";
import { StyleSheet, View } from "react-native";
import { Modal, Text } from "react-native-paper";

export default function NextRoundModal() {
  const [gameState, dispatch] = useAtom(gameStateAtom);
  const hideModal = () => {
    dispatch({ type: gameState.winner ? "endGame" : "endRound" });
  };
  const roundWinner = gameState.players?.find(
    (player) => player.hand.length === 0 && player.phaseCompleted
  );
  const gameWinner = gameState.winner;

  if (roundWinner || gameWinner)
    return (
      <Modal
        visible={Boolean(roundWinner) || Boolean(gameWinner)}
        onDismiss={hideModal}
        contentContainerStyle={styles.modal}
      >
        <View style={styles.container}>
          {gameWinner ? (
            <Text>{gameWinner}</Text>
          ) : (
            <Text>{roundWinner?.name} has won the round!</Text>
          )}
          {gameState.players.map((player) => (
            <View key={player.id}>
              <Text>{player.name}</Text>
              {/* 
              modal pops up when a player runs out of cards, but before player's
              score and phase is updated
              */}
              <Text>
                Score:
                {player.score + (gameWinner ? 0 : player.currentHandScore)}
              </Text>
              <Text>
                Player's phase:
                {player.phase + (player.phaseCompleted ? 1 : 0) + 1}
              </Text>
            </View>
          ))}
        </View>
      </Modal>
    );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    position: "absolute",
    // top: 0,
    width: "75%",
    height: "50%",
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    borderRadius: 25,
  },
  container: {
    height: "90%",
    width: "90%",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    borderRadius: 25,
  },
});
