import type { Player } from "@/atoms/types";
import PHASES, { verifyPhase } from "@/constants/phases";
export const generatePlayers = (total: number, phase = 0) => {
  return Array(total)
    .fill(null)
    .map((_, i) => {
      let name, id: string;
      if (i == 0) {
        name = "Player 1";
        id = "player";
      } else {
        name = `NPC ${i}`;
        id = `npc-${i}`;
      }
      return generatePlayer(id, name, phase);
    });
};
export const generatePlayer = (id: string, name: string, phase = 0): Player => {
  return {
    id,
    name,
    phase,
    score: 0,
    currentHandScore: 0,
    hand: [],
    phaseCompleted: false,
    canCompletePhase: false,
    phaseObjectiveArea: PHASES[phase].objectives.map((phaseData) => {
      return {
        ...phaseData,
        cards: [],
        canComplete: false,
      };
    }),
  };
};

export const updatePhaseObjectiveArea = (player: Player) => {
  player.phaseObjectiveArea = player.phaseObjectiveArea.map(
    (phaseObjective) => {
      return {
        ...phaseObjective,
        canComplete: verifyPhase(
          phaseObjective.type,
          phaseObjective.cards,
          phaseObjective.objectiveLength
        ),
      };
    }
  );
  player.canCompletePhase = player.phaseObjectiveArea.every(
    ({ canComplete }) => canComplete
  );
};
