import React, { useMemo } from "react";

export function SakuraLanternsBackground() {
  // Generate random petals with varying sizes, speeds, and delays
  const petals = useMemo(() => {
    return Array.from({ length: 22 }, (_, i) => ({
      id: i,
      left: `${(i * 4.5 + (i * 7.3) % 4) % 100}%`,
      size: `${8 + (i % 4) * 4}px`,
      duration: `${7 + (i % 5) * 2.5}s`,
      delay: `${(i * 0.4) % 6}s`,
      opacity: 0.5 + (i % 5) * 0.1,
    }));
  }, []);

  // Generate floating sky lanterns using user-provided image 19.svg asset
  const lanterns = useMemo(() => {
    return [
      { id: 1, left: "10%", bottom: "60%", width: "40px", delay: "0s" },
      { id: 2, left: "26%", bottom: "75%", width: "30px", delay: "2.1s" },
      { id: 3, left: "54%", bottom: "78%", width: "50px", delay: "1.2s" },
      { id: 4, left: "74%", bottom: "64%", width: "34px", delay: "3.4s" },
      { id: 5, left: "89%", bottom: "82%", width: "44px", delay: "0.6s" },
    ];
  }, []);

  return (
    <div className="c2c-bg-effects-layer" aria-hidden="true">
      {/* Sky Lanterns (using provided image 19.svg) */}
      {lanterns.map((l) => (
        <div
          key={l.id}
          className="sky-lantern-item"
          style={{
            left: l.left,
            bottom: l.bottom,
            width: l.width,
            animationDelay: l.delay,
          }}
        >
          <img
            src="/image 19.svg"
            alt="Sky Lantern"
            className="lantern-img"
          />
        </div>
      ))}

      {/* Falling Sakura Petals */}
      {petals.map((p) => (
        <div
          key={p.id}
          className="sakura-petal-item"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            animationDuration: p.duration,
            animationDelay: p.delay,
            opacity: p.opacity,
          }}
        >
          <svg viewBox="0 0 24 24" fill="#feb4cb">
            <path d="M12 2C8 6 2 12 6 18C10 24 18 20 20 14C22 8 16 2 12 2Z" />
          </svg>
        </div>
      ))}

      {/* Footer Landscape Hills (using provided footer-hills 5.svg) */}
      <div className="c2c-horizon-ground">
        <img
          src="/footer-hills 5.svg"
          alt="Footer Hills"
          className="footer-hills-svg"
        />
      </div>
    </div>
  );
}

