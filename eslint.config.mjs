import { defineConfig, globalIgnores } from "eslint/config";
import importPlugin from "eslint-plugin-import";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import globals from "globals";
import js from "@eslint/js";

export default defineConfig([
  globalIgnores(["coverage/*", "node_modules/*"]),
  js.configs.recommended,
  importPlugin.flatConfigs.recommended,
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
      "import/resolver": {
        node: {
          extensions: [".js"],
          path: ["src"],
          moduleDirectory: ["node_modules"],
        },
      },
    },

    rules: {
      semi: "error",
      "prefer-const": "warn",
      "prettier/prettier": "warn",
      "import/no-extraneous-dependencies": [
        "error",
        {
          devDependencies: true,
        },
      ],
      "import/unambiguous": "off",
    },
  },
]);
