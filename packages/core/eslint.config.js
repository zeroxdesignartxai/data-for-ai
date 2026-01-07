import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      sourceType: "module",
      ecmaVersion: 2022
    },
    rules: {
      "no-unused-vars": "off"
    }
  }
];
