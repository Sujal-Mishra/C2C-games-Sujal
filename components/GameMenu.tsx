"use client";

import { useEffect, useRef } from "react";

export function GameMenu({ onClose, onRetry }: { onClose: () => void; onRetry: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => closeRef.current?.focus(), []);
  return (
    <div className="overlay-backdrop">
      <section className="game-menu" role="dialog" aria-modal="true" aria-label="Game menu">
        <div className="menu-topline"><strong>Menu</strong><button ref={closeRef} className="icon-button" type="button" aria-label="Close menu" onClick={onClose}>×</button></div>
        <section><h2>Shortcuts</h2><p>A / D or ← / → move · Space rotates · Enter drops · Esc opens menu</p></section>
        <section><h2>How to play</h2><p>Stack each object to earn 100 points. You have two lives, and the playfield follows your stack for an endless run.</p></section>
        <button className="action-button menu-retry-button" type="button" onClick={onRetry}>Retry</button>
      </section>
    </div>
  );
}
