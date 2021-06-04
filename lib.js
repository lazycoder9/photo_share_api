const fetch = require('node-fetch');

const requestGithubToken = (credentials) =>
  fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(credentials),
  })
    .then((res) => res.json())
    .catch((error) => {
      throw new Error(JSON.stringify(error));
    });

const requestGithubUserAccount = (token) =>
  fetch('https://api.github.com/user', {
    headers: {
      Authorization: `token ${token}`,
    },
  })
    .then((res) => res.json())
    .catch((error) => console.error(error));

const authorizeWithGithub = async (credentials) => {
  const { access_token } = await requestGithubToken(credentials);
  console.log({ access_token });
  const githubUser = await requestGithubUserAccount(access_token);
  return { ...githubUser, access_token };
};

module.exports = { authorizeWithGithub };
