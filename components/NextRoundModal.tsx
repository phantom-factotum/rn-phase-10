import { Players } from "@/atoms/game/player";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Modal, Text } from "react-native-paper";

type Props = {
  players: Players;
  startNextRound: () => void;
};

export default function NextRoundModal({ players, startNextRound }: Props) {
  const [visible, setVisible] = useState(false);
  const showModal = () => setVisible(true);
  const hideModal = () => {
    setVisible(false);
    startNextRound();
  };
  const roundWinner = Object.values(players).find(
    (player) => player.cards.length === 0 && player.phaseCompleted
  );
  if (roundWinner)
    return (
      <Modal
        visible={Boolean(roundWinner)}
        onDismiss={hideModal}
        contentContainerStyle={styles.modal}
      >
        <View style={styles.container}>
          <Text>{roundWinner.name} has won the round!</Text>
          {Object.values(players).map((player) => (
            <View key={player.id}>
              <Text>{player.name}</Text>
              <Text>Score:{player.score + player.currentHandScore}</Text>
              <Text>
                Player's phase:{player.phase + (player.phaseCompleted ? 1 : 0)}
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
