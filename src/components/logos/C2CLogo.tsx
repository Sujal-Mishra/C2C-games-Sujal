import React from "react";
import { LogoProps } from "../../types/game.types";

/**
 * Official 5-facet C2C Logo Component
 * 4 visible rose/magenta facets remain static, 1 target facet takes dynamic color
 */
export function C2CLogo({
  targetColor,
  targetIndex = 0,
  width = 135,
  height = 135,
  className = "c2c-logo-svg",
}: LogoProps) {
  // Default authentic logo rose shades
  const defaultColors = [
    "#d46a8c", // 0: Top-Left (mid rose)
    "#e89ab3", // 1: Top-Right (blush pink highlight)
    "#b44f76", // 2: Left (deep magenta rose)
    "#c95c82", // 3: Bottom-Left (warm rose)
    "#e085a3", // 4: Bottom-Right (soft rose)
  ];

  // Substitute ONLY the target facet with targetColor
  const facetColors = defaultColors.map((c, i) =>
    i === targetIndex ? targetColor : c
  );

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer White Hexagon Sticker Border */}
      <polygon
        points="60 5, 108 32, 108 88, 60 115, 12 88, 12 32"
        fill="#ffffff"
        stroke="#ffffff"
        strokeWidth="4"
        strokeLinejoin="round"
      />

      {/* Inner Dark Charcoal Container Frame */}
      <polygon
        points="60 11, 103 35, 103 85, 60 109, 17 85, 17 35"
        fill="#2a2729"
        stroke="#201d1f"
        strokeWidth="2"
      />

      {/* Facet 0: Top-Left */}
      <polygon points="60 60, 22 38, 60 16" fill={facetColors[0]} />

      {/* Facet 1: Top-Right */}
      <polygon points="60 60, 60 16, 98 38" fill={facetColors[1]} />

      {/* Facet 2: Left */}
      <polygon points="60 60, 22 82, 22 38" fill={facetColors[2]} />

      {/* Facet 3: Bottom-Left */}
      <polygon points="60 60, 60 104, 22 82" fill={facetColors[3]} />

      {/* Facet 4: Bottom-Right */}
      <polygon points="60 60, 98 82, 60 104" fill={facetColors[4]} />

      {/* Right Slice is OPEN forming the "C" shape */}
    </svg>
  );
}
