export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feature', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'backup'],
    ],
  },
};

/**
feature: add user login functionality

fix(auth): handle token expiration properly

docs: update README with setup instructions

style: fix indentation in App.js

refactor: simplify API service layer

test(api): add tests for getUser endpoint

chore: update dependencies to latest versions
 */
