const bcrypt = require("bcryptjs");
// const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const {users, urlDatabase, generateRandomString, getUserByEmail, urlsForUser} = require("./helpers");

//Mid-ware
app.set("view engine", "ejs")
// app.use(cookieParser());
app.use(cookieSession ({
  name: "session",
  keys: ['abc']
}));

//Used to keep track of all the URLs and their shortened forms
// const urlDatabase = {
//   b6UTxQ: {
//     longURL: "https://www.tsn.ca",
//     userID: "aJ48lW",
//   },
//   i3BoGr: {
//     longURL: "https://www.google.ca",
//     userID: "aJ48lW",
//   },
// };

// const users = {
//   userRandomID: {
//     id: "userRandomID",
//     email: "user@example.com",
//     password: "purple-monkey-dinosaur",
//   },
//   user2RandomID: {
//     id: "user2RandomID",
//     email: "user2@example.com",
//     password: "dishwasher-funk",
//   },
// };

// const generateRandomString = function() {
//   const randomString = Math.random().toString().substr(2, 6)
//   return randomString;
// }

// const getUserByEmail = function (email) {
//   for (let userID in users) {
//     if (users[userID].email === email) {
//       return users[userID];
//     }
//   }
//   return null;
// };

// function urlsForUser(user) {
//   const urls = {};
//   for (let shortURL in urlDatabase) {
//     if (urlDatabase[shortURL].userID === user) {
//       urls[shortURL] = urlDatabase[shortURL];
//     }
//   }
//   return urls;
// }

//Parses req.body for POST requests
app.use(express.urlencoded({ extended: true }));

//res.render("urls_index", templateVars) will take info from urls_index and show it in the browser. In this case, the templateVars, which is an object containing an object.
app.get("/urls", (req, res) => {
  // let userid = req.cookies["user_id"];
  let userid = req.session.user_id;
 
  let user = users[userid];
  if (!userid) {
    // res.redirect('/login')
    res.status(403).send(`<div>You must login <a href="http://localhost:8080/login">Login</a> </div>`);
    return;
  }

  const urls = urlsForUser(userid);
  const templateVars = {
    urls: urls,
    users: user
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {users: req.session.user_id};
  if (!templateVars.users) {
    res.redirect('/login');
    return;
  }
  res.render("urls_new", templateVars);
});


app.post("/urls", (req, res) => {
  const userID = req.session.user_id;
  const user = users[userID]
  //const id = req.params.id
  if (!user) {
    res.send('You must login')
    return;
  }

  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  const url = {longURL, userID};

  urlDatabase[shortURL] = url;
  console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});


//Our browser then makes a GET request to /urls/:id.
//Using the id, server looks up the longURL from the database,
app.get("/urls/:id", (req, res) => {
  //sends the id and longURL to the urls_show template,
  const users = req.session.user_id;
  if (!users) {
    return res.status(403).send("Must login or register");
  }
  const shortURL = req.params.id;
  const url = urlDatabase[shortURL];
  if (!url) {
    return res.status(403).send("URL Not Found");
  }
  if (url.userID !== req.session.user_id) {
    return res.status(403).send("Access Denied");
  }
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    users: req.session.user_id
  };
  console.log(templateVars);
  console.log(urlDatabase);
  //generates the HTML, and then sends this HTML back to the browser.
  //The browser then renders this HTML.
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  // const shortURL = req.params.id;
  // const longURL = urlDatabase[shortURL];
  // res.redirect(longURL);
  
  const longURL = urlDatabase[req.params.id].longURL
  if (longURL) {
    res.redirect(longURL);
    return;
    } else {
    res.status(404).send("URL not found");
    return;
    }
  //res.redirect(longURL);
});

//samp.
// app.get("/u/:id", (req, res) => {
//   const urlID = req.params.id;
//   if (!urlDatabase[urlID].longURL) {
//     return res.send("URL Does Not Exist");
//   }
//   const longURL = urlDatabase[urlID].longURL;
//   res.redirect(longURL);
// });


//Add a POST route that removes a URL resource: POST /urls/:id/delete
app.post('/urls/:id/delete', (req, res) => {
  const userID = req.session.user_id;
  const id = req.params.id
  if (!userID) {
    res.send('You must login')
    return;
  }
  if (!urlDatabase[id]) {
    res.status(404).send("URL not found!");
    return;
  }
  delete urlDatabase[id];
  res.redirect('/urls');
});

//Edit
app.post('/urls/:id/edit', (req, response) => {
  const id = req.params.id
  const newURL = req.body.longUrls
  urlDatabase[id] = newURL
  response.redirect(`/urls/${id}`);
});

app.get('/urls/:id/edit', (req, response) => {
  const id = req.params.id
  response.redirect(`/urls/${id}`);
});

app.get("/login", (req, res) => {
  const userID = req.session.user_id;
  const user = users[userID];
  return res.render("login", { users: userID })
  //res.redirect('/login');
});

function checkEmailandPassword(email, password){
  for(let u in users){
    if(users[u].email === email){
      //once the email matches, then we have to compare the password (brcypt)
      if(bcrypt.compareSync(password, users[u].password)){
        return users[u];
      }
    }
  }
  return false;
}
//Login; redirect to urls after
app.post('/login', (req, res) => {
  //1. Receive the email and plain password from the user
  const email = req.body.email;
  const password = req.body.password; 

  const user = checkEmailandPassword(email, password);
  if(user){
    //you need to write the cookie 
    req.session.user_id = user.id;
    res.redirect('/urls')
  } else {
    res.send("Either the username or password does not match");
  }
  
  //const hashedPassword = bcrypt.compareSync(password, user.password);
  // for (const user in users) {    
  //   if (users[user].email === email) {
  //     if (hashedPassword) {
  //       user.id = res.cookie('user_id', users[user].id);
  //       //return res.redirect('/urls');
  //     }
  //   }
  // }
  
});

// app.post("/login", (req,res) => {
//   const user = getUserByEmail(req.body.email, users);
//   if (!user) {
//     return res.status(403).send("Email And/Or Password Invalid");
//   }
//   const passwordMatch = bcrypt.compareSync(req.body.password, user.password); 
//   if (passwordMatch) {
//     req.session.user_id = user.id;
//     return res.redirect('/urls');
//   }
//   return res.status(403).send("Email And/Or Password Invalid");
// });

//Logout; redirect to urls
app.post("/logout", (req, res) => {
  //res.clearCookie('user_id');
  req.session.user_id = null;
  res.redirect('/login');
});

//Registry
app.get('/register', (req, res) => {
  const templateVars = { users: req.session.user_id };
  res.render('registry', templateVars);
});

//Endpoint that handles the registration form data
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);

  const id = generateRandomString(10);

  //Check if email is already registered
  if (getUserByEmail(email)) {
    res.status(400).send("Error 400: Email already exists");
    return;
  }
  //Check if email and password fields are empty, then send error msg if so
  if (!email || !password) {
    res.status(400).send("Error 400: Sorry, we could not find your account.")
    return;
  }

//   const newUser = {
//     id: generateRandomString(6),
//     email: req.body,email,
//     password: hashedPassword,
//   };

//   users[newUser.id] = newUser;

// set the cookie session 

//   //Set cookie to user_id
//   res.cookie('user_id', id);
//   res.redirect('/urls');
// });

  const newUser = {
    id,
    email,
    password: hashedPassword
  };

  users[newUser.id] = newUser;

  req.session.user_id = newUser.id;
  //Set cookie to user_id
  //res.cookie('user_id', id);
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });