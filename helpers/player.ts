import type { Player } from "@/atoms/types";
import PHASES, { verifyPhase } from "@/constants/phases";
import { Card } from "@/types";
import { groupBy, removeItemsFromArray } from "./array";
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

const isPhaseCompleted = (phaseAreaCards: Card[][], phaseIndex: number) => {
  const phase = PHASES[phaseIndex].objectives;
  return phaseAreaCards.every((cards, index) =>
    verifyPhase(phase[index].type, cards, phase[index].objectiveLength)
  );
};

export const guessBestPlay = (hand: Card[], phase: number) => {
  const [objective1, objective2] = PHASES[phase].objectives;
  // prioritize first objective
  const possibleObjective1 = groupBy(
    hand,
    objective1.type,
    objective1.objectiveLength
  );
  if (!objective2) return [possibleObjective1[0]];
  const allPossibilities: [Card[], Card[]][] = [];
  possibleObjective1.forEach((group) => {
    // when theres 2 we go through each possible grouping
    // the first objective used to prevent using duplicate cards
    const remainingCards = removeItemsFromArray(hand, group);
    groupBy(
      remainingCards,
      objective2.type,
      objective2.objectiveLength
    ).forEach((group2) => {
      allPossibilities.push([group, group2]);
    });
  });
  // cycle through objective1 and objective2 possibilities
  // and pick the hand that have the most cards
  return allPossibilities.reduce(
    (acc, curr, index) => {
      const currCompleted = isPhaseCompleted(curr, phase);
      const prevCompleted = isPhaseCompleted(acc, phase);
      // possibilities that complete the phase are better
      // than ones that dont complete it
      if (currCompleted !== prevCompleted) {
        if (currCompleted) return curr;
        return acc;
      }
      const [prevArea1, prevArea2] = acc;
      const [currArea1, currArea2] = curr;
      const accRank = prevArea1.length + prevArea2.length;
      const currentItemRank = currArea2.length + currArea1.length;
      if (accRank > currentItemRank) return acc;
      return curr;
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
