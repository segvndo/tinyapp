const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

const generateRandomString = function() {
  const randomString = Math.random().toString().substr(2, 6)
  return randomString;
};

const getUserByEmail = function (email) {
  for (let userID in users) {
    if (users[userID].email === email) {
      return users[userID];
    }
  }
  return null;
};

function urlsForUser(user) {
  const urls = {};
  for (let shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === user) {
      urls[shortURL] = urlDatabase[shortURL];
    }
  }
  return urls;
};

module.exports = {
  generateRandomString,
  getUserByEmail,
  urlsForUser,
  users,
  urlDatabase
};