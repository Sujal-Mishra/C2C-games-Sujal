import { HsvColor } from "../game";

export type Mode = "lobby" | "playing" | "result";
export type RoomType = "random" | "team";

export interface RoundDefinition {
  id: string;
  label: string;
  hint: string;
  target: HsvColor;
  logoId: string;
  targetFacetIndex?: number;
}

export interface LogoProps {
  targetColor: string;
  targetIndex?: number;
  width?: number;
  height?: number;
  className?: string;
}
