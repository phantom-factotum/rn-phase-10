import type { Player } from "@/atoms/types";
import PHASES, { verifyPhase } from "@/constants/phases";
import { Card } from "@/types";
import { groupBy, removeCardsFromArray } from "./array";
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

export const guessBestPlay = (hand: Card[], phase: number) => {
  const objectives = PHASES[phase].objectives;
  // prioritize first objective
  const possibleMainObjectiveCompletions = groupBy(hand, objectives[0].type);
  if (objectives.length == 1) return [possibleMainObjectiveCompletions[0]];
  // when theres 2 we go through each possible grouping
  // the first objective used to prevent using duplicate cards
  const objective2 = possibleMainObjectiveCompletions.map((group) => {
    const remainingCards = removeCardsFromArray(hand, group);
    return groupBy(remainingCards, objectives[1].type);
  });
  // cycle through objective1 and objective2 possibilities
  // and pick the hand that have the most cards
  return possibleMainObjectiveCompletions.reduce(
    (acc, phaseArea1, index) => {
      const [list1, list2] = acc;
      console.log(acc);
      const accRank = list1.length + list2.length;
      const phaseArea2 = objective2[index][0];
      const currentItemRank = phaseArea2.length + phaseArea1.length;
      if (accRank > currentItemRank) return acc;
      return [phaseArea1, phaseArea2];
    },
    [[], []] as Card[][]
  );
};

// player can place cards in objective area; which removes them
// from the hand but unless phase is completed the cards are moveable/scoreable
export const getAvailableCards = (player: Player) => {
  if (player.phaseCompleted) return player.hand;
  const phaseAreaCards = player.phaseObjectiveArea
    .map(({ cards }) => cards)
    .flat();
  return player.hand.concat(phaseAreaCards);
};
