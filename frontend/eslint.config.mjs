import eslintJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "next-env.d.ts",
      "tests/**",
      "playwright.config.ts",
      ".desloppify/",
      ".specify/",
      ".cursor/"
    ]
  },
  eslintJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json"
      }
    },
    rules: {
      "react/react-in-jsx-scope": "off"
    }
  },
  {
    files: ["*.config.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        module: "readonly"
      }
    }
  }
);

