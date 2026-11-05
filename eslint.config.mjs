import js from "@eslint/js";
import globals from "globals";
import licenseHeader from "eslint-plugin-license-header";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      ecmaVersion: "latest",
      sourceType: "module",
    },
    plugins: {
      "license-header": licenseHeader,
    },
    rules: {
      "no-console": [
        "warn",
        {
          "allow": [
            "warn",
            "error",
            "debug"
          ]
        }
      ],
      "indent": [
        "error",
        2
      ],
      "linebreak-style": [
        "error",
        "unix"
      ],
      "quotes": [
        "error",
        "double"
      ],
      "semi": [
        "error",
        "always"
      ],
      "license-header/header": ["error", "./license-header.js"],
      "no-unused-vars": ["error", { "caughtErrors": "none" }]
    }
  },
  {
    files: ["tests/**/*.js", "*.config.mjs"],
    rules: {
      "license-header/header": "off"
    }
  }
];
