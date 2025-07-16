module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    // --- GENERAL STYLISTIC ADJUSTMENTS ---
    // Allow double quotes if that's your preference, or enforce single. Let's allow both for flexibility.
    "quotes": ["error", "single", { "avoidEscape": true, "allowTemplateLiterals": true }], // Allow single quotes primarily, but also template literals
    // Indentation: Allows for 4 spaces, which is what your index.js currently uses.
    "indent": ["error", 4, { "SwitchCase": 1 }], // Enforce 4-space indentation
    // Linebreaks: Turn off the CRFL/LF check to avoid platform-specific errors.
    "linebreak-style": "off",
    // Comma Dangle: Allow trailing commas, especially for multi-line arrays/objects.
    "comma-dangle": ["error", "always-multiline"],
    // Max Line Length: Increase to 150 characters to reduce max-len errors for long strings.
    "max-len": ["error", { "code": 150, "ignoreRegExpLiterals": true, "ignoreStrings": true, "ignoreTemplateLiterals": true }],
    // Require JSDoc: Turn off as it's often too strict for smaller projects.
    "require-jsdoc": "off",
    "valid-jsdoc": "off",
    // No trailing spaces: Cleanliness.
    "no-trailing-spaces": "error",
    // Ensure file ends with a newline: Standard practice.
    "eol-last": ["error", "always"],
    // Prefer const over let where possible: Good practice.
    "prefer-const": "error",
    // No unused vars: Warns, but allows for args
    "no-unused-vars": ["warn", { "args": "none" }],
    // Object curly spacing: Enforce spaces inside object curly braces.
    "object-curly-spacing": ["error", "always"],
    // Disallow padding within blocks: Ensure consistent empty lines.
    "padded-blocks": ["error", "never"],
    // Disallow duplicate keys (important: 'linebreak-style' was duplicated in your previous .eslintrc)
    "no-dupe-keys": "error"
  },
  parserOptions: {
    ecmaVersion: 2020, // Enables parsing of modern ECMAScript features
  },
};