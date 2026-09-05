import React from "react";
import { LogoProps } from "../../types/game.types";
import { C2CLogo } from "./C2CLogo";

/**
 * Registry mapping logo IDs to their dedicated SVG logo components.
 * Easily scalable to support 30+ custom logo components!
 */
const logoRegistry: Record<string, React.ComponentType<LogoProps>> = {
  "c2c-logo": C2CLogo,
  // Future logos registered here...
};

export interface DynamicLogoProps extends LogoProps {
  logoId: string;
}

export function DynamicLogo({ logoId, ...props }: DynamicLogoProps) {
  const LogoComponent = logoRegistry[logoId] || C2CLogo;
  return <LogoComponent {...props} />;
}

export function registerLogo(id: string, component: React.ComponentType<LogoProps>) {
  logoRegistry[id] = component;
}
