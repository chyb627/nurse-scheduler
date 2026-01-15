// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook';

import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { globalIgnores } from 'eslint/config';

export default tseslint.config(
  [
    globalIgnores(['dist']),
    {
      files: ['**/*.{ts,tsx}'],
      extends: [
        js.configs.recommended,
        tseslint.configs.recommended,
        reactHooks.configs['recommended-latest'],
        reactRefresh.configs.vite,
      ],
      languageOptions: {
        ecmaVersion: 2020,
        globals: globals.browser,
      },
      rules: {
        'prettier/prettier': 0,
        'no-duplicate-imports': 'off', // 중복 import 에러
        'import/prefer-default-export': 'off',
        'import/extensions': [
          'error',
          'ignorePackages',
          {
            js: 'never',
            jsx: 'never',
            ts: 'never',
            tsx: 'never',
          },
        ],
        'import/order': 'off',
        'import/no-extraneous-dependencies': 'off', // devDependencies 에러
        'no-nested-ternary': 'off',
        'no-console': 'off',
        'react/function-component-definition': [2, { namedComponents: ['arrow-function', 'function-declaration'] }],
        'react/jsx-filename-extension': [2, { extensions: ['.js', '.jsx', '.ts', '.tsx'] }],
        'react/react-in-jsx-scope': 'off',
        'react/jsx-props-no-spreading': 'off',
        'react/button-has-type': 'off',
        'react/self-closing-comp': 'off',
        'react/no-unknown-property': 'off',
        'react/no-unstable-nested-components': 'off',
        'react/jsx-curly-brace-presence': 'off',
        '@typescript-eslint/no-inferrable-types': 'off',
        'react/no-array-index-key': 'off',
        'react/no-param-reassign': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'no-param-reassign': 'off',
        'func-names': 'off',
        'array-callback-return': 'off',
        'prefer-const': 'off',
        'no-plusplus': 'off',
        'object-shorthand': 'off',
        'consistent-return': 'off',
        'spaced-comment': 'off',
        'react/jsx-no-useless-fragment': 'off',
        eqeqeq: 'off',
        'no-underscore-dangle': 'off',
        'global-require': 'off',
        'jsx-a11y/label-has-associated-control': 'off',
        'jsx-a11y/click-events-have-key-events': 'off',
        'jsx-a11y/no-static-element-interactions': 'off',
        'jsx-a11y/anchor-is-valid': 'off',
        'prefer-template': 'off',
        'react/prop-types': 'off',
        'no-use-before-define': 'off',
        'no-shadow': 'off',
        'default-case': 'off',
        'react/require-default-props': 'off',
        'no-unsafe-optional-chaining': 'off',
        'no-restricted-syntax': 'off',
        'no-unreachable-loop': 'off',
        'no-else-return': 'off',
        'import/no-unresolved': 'off', // 절대경로 설정시 에러가 나서 off
        'no-case-declarations': 'off', // 예상치 못한 변수 선언 off
        'react/jsx-no-constructed-context-values': 'off', // context 에러 off
        'react/no-danger': 'off', // dangerouslySetInnerHTML 에러 off
      },
    },
  ],
  storybook.configs['flat/recommended'],
);
