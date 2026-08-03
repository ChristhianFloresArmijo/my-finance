import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.defineConfig(
  js.configs.recommended,
  tseslint.configs.recommended,
  pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
        tsconfigRootDir: import.meta.dirname,
        projectService: true,
      },
    },
  },
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '**/node_modules/**',
      'coverage/**',
      '*.min.js',
      'pnpm-lock.yaml',
    ],
  },
  eslintConfigPrettier
);
