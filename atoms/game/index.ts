import PHASES from "@/constants/phases";
import { Card } from "@/types";
import { useAtom, useAtomValue } from "jotai";
import { useEffect } from "react";
import { Alert } from "react-native";
import rfdc from "rfdc";
import { lastDiscardedAtom } from "./deck";
import { GameActionTypes, gameStateAtom, totalPlayersAtom } from "./game";
import { playerIdsAtom, playersAtom } from "./player";
import { ActionType } from "./types";
const deepclone = rfdc();
const usePlayersReducer = () => {
  return useAtom(playersAtom);
};
export type PlayersDispatch = ReturnType<typeof usePlayersReducer>[1];
export default function useGameHandler() {
  const [players, playersDispatch] = useAtom(playersAtom);
  const playerIds = useAtomValue(playerIdsAtom);
  const [lastDiscarded] = useAtom(lastDiscardedAtom);
  const [gameState, gameDispatch] = useAtom(gameStateAtom);
  const [totalPlayers] = useAtom(totalPlayersAtom);
  useEffect(() => {
    const roundWinner = Object.values(players).find(
      (player) => player.phaseCompleted && player.cards.length == 0
    );
    if (roundWinner) {
      if (roundWinner.phase < PHASES.length - 1)
        gameDispatch({ type: GameActionTypes.roundEnded });
      else {
        gameDispatch({ type: GameActionTypes.endGame });
      }
    }
  }, [players]);
  return {
    startGame: () => {
      gameDispatch({
        type: GameActionTypes.startGame,
        data: {
          totalPlayers,
          onHandDealt: (hands) => {
            Object.values(players).forEach(({ id }, i) =>
              playersDispatch(id, {
                type: ActionType.acceptHand,
                data: { cards: hands[i] },
              })
            );
          },
          startPlayerId: playerIds[0],
        },
      });
    },
    lastDiscarded,
    ...gameState,
    discardCard: (card: Card) => {
      const { activePlayerId } = gameState;
      console.log("active player", activePlayerId);
      if (!activePlayerId) return;
      playersDispatch(activePlayerId, {
        type: ActionType.removeFromHand,
        data: { card },
      });
      if (card.type == "skip") {
        const skippablePlayers = Object.values(players).filter(
          ({ id }) => id !== activePlayerId
        );
        Alert.alert(
          "Pick a player to skip",
          skippablePlayers
            .map(({ name, cards, score }) => {
              return (
                name + "\n" + `  Score:${score}\n` + `  Cards:${cards.length}`
              );
            })
            .join("\n"),
          skippablePlayers.map(({ name, id }) => ({
            text: name,
            onPress: () => {
              gameDispatch({
                type: GameActionTypes.discardCard,
                data: { card, playerIds, targetId: id },
              });
            },
          }))
        );
      } else {
        gameDispatch({
          type: GameActionTypes.discardCard,
          data: { card, playerIds },
        });
      }
    },
    drawCard: (isFromDiscard?: boolean) => {
      const { activePlayerId } = gameState;
      if (!activePlayerId) return;
      gameDispatch({
        type: GameActionTypes.drawCard,
        data: {
          isFromDiscard,
          onComplete: (card) => {
            playersDispatch(activePlayerId, {
              type: ActionType.addToHand,
              data: {
                card,
              },
            });
          },
        },
      });
    },
    hitObjective: ({
      card,
      objectiveIndex,
      targetId,
      isFromStart,
    }: HitParams) => {
      const activePlayerId = gameState.activePlayerId;
      if (!activePlayerId) return;
      playersDispatch(targetId, {
        type: ActionType.hitObjective,
        data: {
          card,
          objectiveIndex,
          isFromStart,
          onHit: () => {
            playersDispatch(activePlayerId, {
              type: ActionType.removeFromHand,
              data: { card },
            });
          },
        },
      });
    },
    startNextRound: () => {
      const startPlayerId =
        playerIds[gameState.roundsPlayed % playerIds.length];
      gameDispatch({
        type: GameActionTypes.startNextRound,
        data: {
          startPlayerId,
          totalPlayers: playerIds.length,
          onHandDealt: (hands) => {
            Object.values(players).forEach((player, i) => {
              playersDispatch(player.id, {
                type: ActionType.submitRound,
                data: {
                  nextHand: hands[i],
                },
              });
            });
          },
        },
      });
    },
  };
}

type HitParams = {
  card: Card;
  objectiveIndex: number;
  targetId: string;
  isFromStart?: boolean;
};
