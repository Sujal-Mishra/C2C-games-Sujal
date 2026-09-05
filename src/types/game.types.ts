import { HsvColor } from "../game";

export type Mode = "lobby" | "playing" | "result";
export type RoomType = "random" | "team";
export type SourceColor = "red-orange" | "blue" | "purple" | "teal" | "pink" | "green";

export interface RoundDefinition {
  id: string;
  label: string;
  hint: string;
  target: HsvColor;
  logoId: string;
  targetFacetIndex?: number;
  logoSource?: string;
  sourceColor?: SourceColor;
}

export interface LogoProps {
  targetColor: string;
  targetIndex?: number;
  width?: number;
  height?: number;
  className?: string;
  source?: string;
  sourceColor?: SourceColor;
}
