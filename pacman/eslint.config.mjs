/**
 * ESLint flat config for the project.
 *
 * Why: `next lint` / `eslint` needs a config; this composes Next.js's
 * recommended rule sets and then widens what gets linted.
 * How: `defineConfig` merges the `core-web-vitals` preset (accessibility +
 * performance rules) and the `typescript` preset. `globalIgnores` is then
 * *re-declared* with only build artefacts (`.next`, `out`, `build`,
 * `next-env.d.ts`) — this overrides `eslint-config-next`'s own default ignore
 * list, whose broader patterns would otherwise skip files we do want linted.
 * What: a default-exported flat-config array.
 * Used by: the `lint` script in `package.json` and any editor ESLint
 * integration.
 * Design: presets over hand-picked rules so the config tracks Next.js's
 * guidance; the ignore override is the one intentional deviation and is
 * commented as such inline.
 */
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
