import type { NextConfig } from "next";

/**
 * Next.js build/runtime configuration for the Pac-Man app.
 *
 * Why: every Next.js project needs one config module; this is where framework
 * behaviour that can't live in a component or `package.json` is set.
 * How: exports a single typed config object that `next dev` / `next build` read
 * at startup. The only non-default here is `reactCompiler`, which turns on the
 * React Compiler so the game's render-heavy component (`Map.tsx` re-renders every
 * 200ms tick) is auto-memoised without hand-written `useMemo`/`useCallback`.
 * What: a `NextConfig` object, default-exported as the module requires.
 * Used by: the Next.js CLI and the bundler — never imported by app code.
 * Design: kept to the single flag we actually rely on so the file stays a
 * near-stock template; `NextConfig` typing catches typos in option names at
 * build time.
 */
const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
};

export default nextConfig;
