import { useEffect, useRef } from "react";
import { HsvColor } from "../../game";
import { LogoProps, SourceColor } from "../../types/game.types";

function rgbToHsv(red: number, green: number, blue: number): HsvColor {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const maximum = Math.max(r, g, b);
  const minimum = Math.min(r, g, b);
  const difference = maximum - minimum;
  const hue = difference === 0 ? 0 : 60 * (((maximum === r ? (g - b) / difference : maximum === g ? (b - r) / difference + 2 : (r - g) / difference + 4) + 6) % 6);
  return { hue, saturation: maximum === 0 ? 0 : (difference / maximum) * 100, value: maximum * 100 };
}

function matchesSourceColor(hue: number, sourceColor: SourceColor) {
  if (sourceColor === "blue") return hue >= 190 && hue <= 230;
  if (sourceColor === "purple") return hue >= 245 && hue <= 290;
  if (sourceColor === "teal") return hue >= 150 && hue <= 180;
  if (sourceColor === "pink") return hue >= 320 && hue <= 355;
  if (sourceColor === "green") return hue >= 70 && hue <= 105;
  return hue <= 38 || hue >= 345;
}

export function PixelColorLogo({ targetColor, source, sourceColor, className }: LogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !source || !sourceColor) return;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    const image = new Image();
    image.src = source;
    image.onload = () => {
      canvas.width = Math.min(image.naturalWidth, 512);
      canvas.height = Math.round((image.naturalHeight / image.naturalWidth) * canvas.width);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      const target = hexToHsv(targetColor);
      for (let index = 0; index < pixels.data.length; index += 4) {
        if (pixels.data[index + 3] === 0) continue;
        const original = rgbToHsv(pixels.data[index], pixels.data[index + 1], pixels.data[index + 2]);
        if (original.saturation <= 55 || original.value <= 25 || !matchesSourceColor(original.hue, sourceColor)) continue;
        const color = hsvToRgb({ hue: target.hue, saturation: target.saturation * original.saturation / 100, value: target.value * original.value / 100 });
        pixels.data[index] = color.red;
        pixels.data[index + 1] = color.green;
        pixels.data[index + 2] = color.blue;
      }
      context.putImageData(pixels, 0, 0);
    };
  }, [source, sourceColor, targetColor]);

  return <canvas ref={canvasRef} className={className || "question-mark-img"} aria-label="Color memory logo" role="img" />;
}

function hexToHsv(hex: string): HsvColor {
  const clean = hex.replace("#", "");
  return rgbToHsv(parseInt(clean.slice(0, 2), 16), parseInt(clean.slice(2, 4), 16), parseInt(clean.slice(4, 6), 16));
}

function hsvToRgb({ hue, saturation, value }: HsvColor) {
  const chroma = value / 100 * (saturation / 100);
  const x = chroma * (1 - Math.abs((hue / 60 % 2) - 1));
  const match = value / 100 - chroma;
  const [red, green, blue] = hue < 60 ? [chroma, x, 0] : hue < 120 ? [x, chroma, 0] : hue < 180 ? [0, chroma, x] : hue < 240 ? [0, x, chroma] : hue < 300 ? [x, 0, chroma] : [chroma, 0, x];
  return { red: Math.round((red + match) * 255), green: Math.round((green + match) * 255), blue: Math.round((blue + match) * 255) };
}
