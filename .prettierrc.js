/**
 * Prettier settings in .js format so comments are allowed
 * All settings are sorted alphabetically
 */
export default {
  printWidth: 100, // Allow longer lines so Prettier does not wrap so early (default is 80). 180 is a bit too much no
  singleQuote: true, // Use single quotes in JS/TS strings (does not affect template literals or HTML content).
  semi: true, // Always add semicolons to avoid automatic semicolon insertion issues.
  trailingComma: 'es5', // Add trailing commas where supported by ES5 (objects, arrays) to keep diffs cleaner.
  tabWidth: 2, // Indent code with 2 spaces for compact readability.
  useTabs: false, // Use spaces instead of tabs for consistent formatting across editors.
};
