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
    // Parallel git worktrees (and their nested .next builds) must not be linted.
    ".worktrees/**",
    // Not part of the Next app lint surface.
    "designs/**",
    "landing-page/**",
    "scripts/**",
    "qa/**",
  ]),
]);

export default eslintConfig;
