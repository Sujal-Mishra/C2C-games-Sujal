---
version: alpha
name: Chroma Clash
description: A nocturnal, festival-inspired color-memory game for small public and private rooms.
colors:
  ink: "#0C0307"
  canvas: "#100307"
  surface: "#210A13"
  muted: "#D4A8B9"
  line: "#B44F76"
  violet: "#D884A2"
  coral: "#B44F76"
  lemon: "#E8A85B"
  sky: "#E3A9BF"
  success: "#85C7A4"
typography:
  display: { fontFamily: "Arial Black, Arial, sans-serif", fontSize: 56px, fontWeight: 900, lineHeight: 0.92, letterSpacing: -0.06em }
  headline: { fontFamily: "Arial Black, Arial, sans-serif", fontSize: 22px, fontWeight: 900, lineHeight: 1, letterSpacing: -0.04em }
  body: { fontFamily: "Arial, Helvetica, sans-serif", fontSize: 15px, fontWeight: 600, lineHeight: 1.45, letterSpacing: -0.01em }
  label: { fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11px, fontWeight: 800, lineHeight: 1, letterSpacing: 0.11em }
rounded: { sm: 10px, md: 18px, lg: 28px, full: 999px }
spacing: { xs: 8px, sm: 12px, md: 20px, lg: 32px, xl: 52px }
components:
  button-primary: { backgroundColor: "{colors.ink}", textColor: "{colors.surface}", rounded: "{rounded.full}", padding: 14px }
  game-card: { backgroundColor: "{colors.surface}", rounded: "{rounded.lg}", padding: 20px }
---

# Chroma Clash

## Overview
Chroma Clash is a fast, tactile memory game with the atmosphere of a night festival: plum-black space, blossom-pink light, warm lantern accents, and slow ambient movement. It takes high-level color and mood inspiration from the supplied C2C reference while retaining its own game identity, content, and composition.

## Colors
Deep plum-black is the canvas. Rose-pink is the game signature, with warm lantern gold reserved for key calls to action and pale blossom pink for readable highlights.

## Typography
Use a dramatic editorial serif for game headlines and a clear compact system sans for rapid in-game scanning. Small labels remain uppercase with generous tracking.

## Layout
The lobby uses a split asymmetric desktop layout with a framed navigation rail, a dominant game stage, and a softly lit midnight backdrop. Small screens collapse to one column without losing controls.

## Elevation & Depth
Depth comes from rose edge-lighting, restrained black shadows, and low-opacity warm glows. Avoid generic soft shadows.

## Shapes
The stage is generously rounded; buttons are playful pills. Score cells and stat cards use medium rounding.

## Components
Primary actions are rose-edged, high-contrast pills. Room cards expose mode, capacity, and occupancy at a glance. The hue wheel and sliders form the core interaction and always show numerical values.

## Do's and Don'ts
- Do make score feedback immediate and legible.
- Do keep the uploaded question artwork contained inside a neutral game card.
- Don't use Dialed branding, copy, or its visual assets.
- Don't use Code2Create, ACM-VIT, or its supplied site artwork as Chroma Clash branding.
- Don't infer that the supplied asset is owned by Google; treat it as a user-supplied question image.
