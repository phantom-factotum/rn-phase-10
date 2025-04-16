import { Dimensions } from "react-native";
const { width, height } = Dimensions.get("screen");
const CARD_RATIO = 65 / 90;
export const CARD_WIDTH = Math.min(80, width / 6);
export const CARD_HEIGHT = CARD_WIDTH / CARD_RATIO;
export const CARD_PREVIEW_WIDTH = CARD_WIDTH / 3;
export const CIRCLE_ARC = CARD_WIDTH / 3;
