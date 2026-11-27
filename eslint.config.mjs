import { defineConfig, globalIgnores } from "eslint/config"; // eslint-disable-line import-x/no-unresolved
import { importX } from "eslint-plugin-import-x";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import globals from "globals";
import js from "@eslint/js";

export default defineConfig([
  globalIgnores(["coverage/*", "node_modules/*"]),
  js.configs.recommended,
  importX.flatConfigs.recommended,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      ecmaVersion: "latest",
      sourceType: "module",
    },

    settings: {
      "import-x/resolver": {
        node: {
          extensions: [".js"],
          path: ["src"],
          moduleDirectory: ["node_modules"],
        },
      },
    },

    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      semi: "error",
      "prefer-const": "warn",
      "prettier/prettier": "warn",
      "import-x/no-extraneous-dependencies": [
        "error",
        {
          devDependencies: true,
        },
      ],
      "import-x/unambiguous": "off",
    },
  },
]);
