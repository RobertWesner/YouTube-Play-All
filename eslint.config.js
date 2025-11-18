import js from './linting/node_modules/@eslint/js/src/index.js';
import globals from './linting/node_modules/globals/index.js';
import { defineConfig } from './linting/node_modules/eslint/lib/config-api.js';
import security from './linting/node_modules/eslint-plugin-security/index.js';
import noUnsanitized from './linting/node_modules/eslint-plugin-no-unsanitized/index.js';

export default defineConfig([
    {
        files: ['**/*.{js,mjs,cjs}'],
        plugins: {
            js,
            security,
            'no-unsanitized': noUnsanitized,
        },
        extends: ['js/recommended'],
        languageOptions: {
            globals: {
                ...globals.browser,
                GM: 'readonly',
                GM_xmlhttpRequest: 'readonly',
                GM_info: 'readonly',
            },
        },
        linterOptions: {
            reportUnusedDisableDirectives: 'warn',
        },
        rules: {
            'no-eval': 'error',
            'no-implied-eval': 'error',
            'no-new-func': 'error',
            'no-unused-vars': ['warn', { args: 'none', ignoreRestSiblings: true }],
            'no-undef': 'error',
            'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
            'prefer-const': 'warn',
            eqeqeq: ['error', 'always'],
            'no-var': 'error',
            'security/detect-eval-with-expression': 'error',
            'security/detect-non-literal-regexp': 'warn',
            'security/detect-non-literal-require': 'off',
            'security/detect-object-injection': 'off',
            'security/detect-possible-timing-attacks': 'off',
            'security/detect-pseudoRandomBytes': 'off',
            'no-unsanitized/method': 'error',
            'no-unsanitized/property': 'error',
        },
    },
]);
