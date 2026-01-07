import js from "@eslint/js";
import react from "eslint-plugin-react";

export default [
  js.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      sourceType: "module",
      ecmaVersion: 2022,
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    plugins: {
      react
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "no-unused-vars": "off"
    }
  }
];
