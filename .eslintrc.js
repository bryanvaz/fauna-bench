const path = require('path');

module.exports = {
  // root: true,
  parser: 'babel-eslint',
  env: {
    node: true,
    es6: true,
  },

  extends: [
    'airbnb-base',
    'plugin:prettier/recommended',
    'plugin:node/recommended',
  ],
  plugins: ['prettier', 'import'],
  parserOptions: {
    // Only ESLint 6.2.0 and later support ES2020.
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        trailingComma: 'all',
        printWidth: 80,
        tabWidth: 2,
      },
    ],
    'no-unused-vars': 'warn',
    'no-console': 'off',
    'func-names': 'off',
    'no-case-declarations': 'off', // Case declarations are great for Websockets
    'no-process-exit': 'off',
    camelcase: 'off',
    // 'object-shorthand': 'off',
    // 'class-methods-use-this': 'off',
    'no-debugger': 'off',
    'no-underscore-dangle': 'off', // Private variables in JS
    // Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
    // e.g. '@typescript-eslint/explicit-function-return-type': 'off',
    'import/prefer-default-export': 0, // Too strict.
    'max-len': ['warn', { code: 144 }],
    'consistent-return': 0, // Arrow functions don't always have to return stuff
    'implicit-arrow-linebreak': 0, // Arrow line breaks are important for chained promises
    'no-param-reassign': [
      'error',
      {
        props: true,
        ignorePropertyModificationsFor: [
          'state', // for VueX state
          'acc', // for reduce accumulators
          'accumulator', // for reduce accumulators
          'e', // for e.returnvalue
          'ctx', // for Koa routing
          'req', // for Express requests
          'request', // for Express requests
          'res', // for Express responses
          'response', // for Express responses
          '$scope', // for Angular 1 scopes
          'staticContext', // for ReactRouter context
        ],
      },
    ],
    'node/no-missing-require': 'off', // import checks with webpack resolver
    'node/no-missing-import': 'off', // import checks with webpack resolver
    'node/no-unsupported-features/es-syntax': 'off',
    'import/extensions': [
      'error',
      'always',
      {
        js: 'never',
        mjs: 'never',
      },
    ],
  },
  settings: {
    // 'import/resolver': [
    //   {
    //     webpack: {
    //       config: `${path.resolve(__dirname)}/webpack.config.js`,
    //     },
    //   },
    //   {
    //     node: {
    //       extensions: ['.js', '.mjs'],
    //     },
    //   },
    // ],
  },
  overrides: [
  ],
};
