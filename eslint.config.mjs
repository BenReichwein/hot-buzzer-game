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
  // Disable overly strict React Compiler rules that flag valid patterns
  {
    rules: {
      // Allow setState in effects for external system synchronization (Socket.io, localStorage)
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
