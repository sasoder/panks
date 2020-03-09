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
    indent: 0,
    'consistent-return': 'off',
    'no-plusplus': 'off',
    'no-param-reassign': 'off',
    'default-case': 'off',
    'linebreak-style': 0,
    'quotes': 'off',
    'arrow-parens': 'off',
    'comma-dangle': 'off',
    'operator-linebreak': 'off'
  },
  parserOptions: {
    parser: 'babel-eslint',
  },
};
