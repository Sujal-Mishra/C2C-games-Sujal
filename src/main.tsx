import React, { useMemo, useState, useRef } from "react";
import { createRoot } from "react-dom/client";
import { calculateRoundScore, hsvToHex, type HsvColor } from "./game";
import "./styles.css";
import "./theme.css";

type Mode = "lobby" | "playing" | "result";
type RoomType = "random" | "team";

const rounds = [
  {
    label: "Mark of the moment",
    hint: "Set the color that lives at the top-left facet.",
    target: { hue: 338, saturation: 52, value: 72 },
    targetFacetIndex: 0, // Top-Left
  },
  {
    label: "Neon snack",
    hint: "Find the shade for the main left facet.",
    target: { hue: 348, saturation: 67, value: 82 },
    targetFacetIndex: 2, // Left
  },
  {
    label: "Quiet edge",
    hint: "What color sets the top-right highlight?",
    target: { hue: 223, saturation: 50, value: 75 },
    targetFacetIndex: 1, // Top-Right
  },
  {
    label: "Soft spark",
    hint: "Tune the bottom-left base shade.",
    target: { hue: 0, saturation: 38, value: 96 },
    targetFacetIndex: 3, // Bottom-Left
  },
  {
    label: "Final flash",
    hint: "Tune the bottom-right finishing facet.",
    target: { hue: 330, saturation: 69, value: 86 },
    targetFacetIndex: 4, // Bottom-Right
  },
];

function App() {
  const [mode, setMode] = useState<Mode>("playing");
  const [roomType, setRoomType] = useState<RoomType>("random");
  const [teamCode, setTeamCode] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [round, setRound] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [hintsLeft, setHintsLeft] = useState(2);
  const [showHint, setShowHint] = useState(false);
  const [guess, setGuess] = useState<HsvColor>({
    hue: 330,
    saturation: 65,
    value: 80,
  });

  const score = scores.reduce((sum, item) => sum + item, 0);
  const current = rounds[round];
  const guessHex = useMemo(() => hsvToHex(guess), [guess]);

  const startGame = () => {
    setRound(0);
    setScores([]);
    setGuess({ hue: 330, saturation: 65, value: 80 });
    setHintsLeft(2);
    setShowHint(false);
    setMode("playing");
  };

  const queueRandom = () => {
    setRoomType("random");
    startGame();
  };

  const submitGuess = () => {
    const roundScore = calculateRoundScore(guess, current.target);
    const nextScores = [...scores, roundScore];
    setShowHint(false);
    if (round === rounds.length - 1) {
      setScores(nextScores);
      setMode("result");
    } else {
      setScores(nextScores);
      setRound(round + 1);
      setGuess({ hue: (guess.hue + 50) % 360, saturation: 60, value: 78 });
    }
  };

  const triggerHint = () => {
    if (hintsLeft > 0 && !showHint) {
      setHintsLeft(hintsLeft - 1);
      setShowHint(true);
    }
  };

  const satPureHex = useMemo(
    () => hsvToHex({ hue: guess.hue, saturation: 100, value: 100 }),
    [guess.hue]
  );
  const valBrightHex = useMemo(
    () => hsvToHex({ hue: guess.hue, saturation: guess.saturation, value: 100 }),
    [guess.hue, guess.saturation]
  );

  return (
    <div className="page-wrapper">
      {/* Outer top bar header */}
      <header className="theme-topbar">
        <div className="brand" onClick={() => setMode("lobby")}>
          <span className="brand-mark">C</span>
          <span className="brand-name">
            chroma
            <br />
            clash
          </span>
        </div>
        <nav className="window-frame-tabs">
          <button
            className={`frame-tab ${mode === "playing" ? "active" : ""}`}
            onClick={() => setMode("playing")}
          >
            Game Window
          </button>
          <button
            className={`frame-tab ${mode === "lobby" ? "active" : ""}`}
            onClick={() => setMode("lobby")}
          >
            Lobby
          </button>
          {scores.length > 0 && (
            <button
              className={`frame-tab ${mode === "result" ? "active" : ""}`}
              onClick={() => setMode("result")}
            >
              Results
            </button>
          )}
        </nav>
      </header>

      {/* Main compact card window */}
      <main className="dialed-card-window chroma-theme-card">
        {mode === "playing" && (
          <div className="game-card-content">
            {/* Left Vertical Color Picker Sliders */}
            <aside className="vertical-color-picker" aria-label="Color Controls">
              {/* Hue Slider */}
              <VerticalSlider
                value={guess.hue}
                max={360}
                background="linear-gradient(to bottom, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)"
                onChange={(hue) => setGuess({ ...guess, hue })}
              />

              {/* Saturation Slider */}
              <VerticalSlider
                value={guess.saturation}
                max={100}
                background={`linear-gradient(to bottom, #fff5f7 0%, ${satPureHex} 50%, #210a13 100%)`}
                onChange={(saturation) => setGuess({ ...guess, saturation })}
              />

              {/* Brightness Slider */}
              <VerticalSlider
                value={guess.value}
                max={100}
                background={`linear-gradient(to bottom, ${valBrightHex} 0%, #310d1d 60%, #0c0307 100%)`}
                onChange={(value) => setGuess({ ...guess, value })}
              />
            </aside>

            {/* Right Main Stage */}
            <section className="stage-area">
              <header className="card-header">
                <span className="round-indicator">{round + 1} / 5</span>
                <span className="brand-title" onClick={() => setMode("lobby")}>
                  <span className="c-mark">C</span> CHROMA CLASH
                </span>
              </header>

              {/* Center Stage with Authentic "C" Emblem */}
              <div className="character-stage">
                <div className="floor-spotlight" />

                {showHint && (
                  <div className="hint-toast">
                    Target Hint: Hue ~{current.target.hue}°
                  </div>
                )}

                <div className="round-hint-bar">
                  <span className="hint-label">{current.label}</span>
                  <p className="hint-sub">{current.hint}</p>
                </div>

                {/* Targeted "C" Emblem Showcase */}
                <div className="emblem-card-showcase">
                  <ChromaCLogoSVG
                    targetColor={guessHex}
                    targetIndex={current.targetFacetIndex}
                  />
                </div>
              </div>

              {/* Bottom Controls */}
              <footer className="card-footer">
                <div className="hex-display">
                  <span>HEX</span>
                  <b>{guessHex.toUpperCase()}</b>
                </div>

                <div className="footer-right-buttons">
                  <button
                    className="action-btn hint-btn"
                    onClick={triggerHint}
                    title="Use Hint"
                    disabled={hintsLeft === 0 || showHint}
                  >
                    <LampIcon />
                    <span className="badge">{hintsLeft}</span>
                  </button>

                  <button
                    className="action-btn lock-btn"
                    onClick={submitGuess}
                    title="Lock Colour"
                  >
                    <TargetIcon />
                  </button>
                </div>
              </footer>
            </section>
          </div>
        )}

        {mode === "lobby" && (
          <div className="card-lobby-content">
            <header className="card-header">
              <span className="round-indicator">01 — COLOR MEMORY</span>
              <span className="brand-title">CHROMA CLASH</span>
            </header>
            <div className="lobby-body">
              <div className="lobby-brand-badge">C</div>
              <h2>How close can you get?</h2>
              <p>
                Study the emblem. Tune the vertical color sliders from memory.
                Chase the highest score across 5 rapid rounds.
              </p>
              <div className="lobby-actions">
                <button className="btn-start-primary" onClick={queueRandom}>
                  Play Random Room →
                </button>
              </div>
            </div>
          </div>
        )}

        {mode === "result" && (
          <div className="card-result-content">
            <header className="card-header">
              <span className="round-indicator">MATCH COMPLETE</span>
              <span className="brand-title">CHROMA CLASH</span>
            </header>
            <div className="result-body">
              <span className="result-label">FINAL SCORE</span>
              <h1 className="result-score-num">{score.toLocaleString()}</h1>
              <span className="result-max">out of 5,000</span>

              <div className="result-mini-breakdown">
                {scores.map((s, idx) => (
                  <div key={idx} className="mini-score-row">
                    <span>Round 0{idx + 1}</span>
                    <b>{s} pts</b>
                  </div>
                ))}
              </div>

              <button className="btn-start-primary" onClick={startGame}>
                Play Again →
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/** 
 * Authentic Chroma Clash "C" Logo SVG
 * Matches the official logo geometry & 5-facet structure.
 * 4 facets stay visible in their authentic rose/magenta logo colors,
 * while ONLY 1 target facet dynamically updates with targetColor!
 */
function ChromaCLogoSVG({
  targetColor,
  targetIndex = 0,
}: {
  targetColor: string;
  targetIndex?: number;
}) {
  // Default authentic logo rose shades (matching kefb.png)
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
      width="135"
      height="135"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="chroma-c-logo-svg"
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

      {/* Facet 0: Top-Left (60,60 -> 22,38 -> 60,16) */}
      <polygon points="60 60, 22 38, 60 16" fill={facetColors[0]} />

      {/* Facet 1: Top-Right (60,60 -> 60,16 -> 98,38) */}
      <polygon points="60 60, 60 16, 98 38" fill={facetColors[1]} />

      {/* Facet 2: Left (60,60 -> 22,82 -> 22,38) */}
      <polygon points="60 60, 22 82, 22 38" fill={facetColors[2]} />

      {/* Facet 3: Bottom-Left (60,60 -> 60,104 -> 22,82) */}
      <polygon points="60 60, 60 104, 22 82" fill={facetColors[3]} />

      {/* Facet 4: Bottom-Right (60,60 -> 98,82 -> 60,104) */}
      <polygon points="60 60, 98 82, 60 104" fill={facetColors[4]} />

      {/* Right Slice (60,60 -> 98,38 -> 98,82) is OPEN forming the "C" shape */}
    </svg>
  );
}

/** Interactive Vertical Slider Component */
function VerticalSlider({
  value,
  max,
  background,
  onChange,
}: {
  value: number;
  max: number;
  background: string;
  onChange: (val: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const updateValue = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const ratio = Math.max(0, Math.min(1, offsetY / rect.height));
    const newVal = Math.round(ratio * max);
    onChange(newVal);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateValue(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      updateValue(e);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
  };

  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      ref={containerRef}
      className="slider-strip"
      style={{ background }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        className="slider-knob"
        style={{ top: `calc(${percent}% - 14px)` }}
      />
    </div>
  );
}

/** Lamp Icon */
function LampIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
    </svg>
  );
}

/** Target Icon */
function TargetIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
