import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import noDutchHardcoded from "./eslint-plugins/no-dutch-hardcoded.js";

export default tseslint.config(
  { ignores: ["dist", "eslint-plugins"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "custom": {
        rules: {
          "no-dutch-hardcoded": noDutchHardcoded,
        },
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      // Warn for hardcoded Dutch text - use UI constants instead
      "custom/no-dutch-hardcoded": "warn",
    },
  },
);
