import js from '@eslint/js';
import globals from 'globals';
import pluginReact from 'eslint-plugin-react';
import prettier from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  { files: ['**/*.{js,jsx}'] },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
        process: 'readonly',
      },
    },
  },
  js.configs.recommended,
  pluginReact.configs.flat.recommended,
  eslintConfigPrettier,
  {
    plugins: { prettier },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'prettier/prettier': 'error',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
  },
];
