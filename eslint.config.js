import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  // Ignore build and config files
  {
    ignores: ['dist*/**', 'node_modules/**', '*.config.js', '*.config.cjs', '.prettierrc.js'],
  },

  // Base Config
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // 2. Add Prettier Config LAST to override conflicting rules
  eslintConfigPrettier,

  // Specific rules
  {
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        // Allow browser/node-specific variable names
        ...globals.browser,
        ...globals.node,
      },
    },
  }
);
