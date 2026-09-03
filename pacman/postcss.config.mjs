/**
 * PostCSS configuration.
 *
 * Why: Tailwind v4 ships as a PostCSS plugin; Next.js runs `postcss.config.mjs`
 * over every stylesheet, so this is where the plugin gets registered.
 * How: the object form (`plugins: { "<name>": <options> }`) that Next expects;
 * `@tailwindcss/postcss` with no options does everything (`globals.css` opts in
 * with `@import "tailwindcss"`).
 * What: a default-exported plain config object.
 * Used by: the Next.js build pipeline only — never imported by app code.
 * Design: single plugin, no autoprefixer entry — Tailwind v4 handles vendor
 * prefixing itself, so the file stays minimal.
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
