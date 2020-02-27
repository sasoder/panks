module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    'plugin:vue/essential',
    '@vue/airbnb',
  ],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    quotes: [
      2, 'single', 'avoid-escape'
    ],
    "indent": 0,
    "consistent-return": "off"
  },
  parserOptions: {
    parser: 'babel-eslint',
  },
};