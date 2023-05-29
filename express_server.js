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


//Parses req.body for POST requests
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//res.render("urls_index", templateVars) will take info from urls_index and show it in the browser. In this case, the templateVars, which is an object containing an object.
app.get("/urls", (req, res) => {
  let userid = req.session.user_id;
 
  let user = users[userid];
  if (!userid) {
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

  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  
  const longURL = urlDatabase[req.params.id].longURL
  if (longURL) {
    res.redirect(longURL);
    return;
    } else {
    res.status(404).send("URL not found");
    return;
    }
});

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
app.post('/urls/:id', (req, response) => {
  const id = req.params.id
  const newURL = req.body.longUrls
  urlDatabase[id].longURL = newURL
  response.redirect(`/urls/${id}`);
});

app.get('/urls/:id', (req, response) => {
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
});

//Logout; redirect to urls
app.post("/logout", (req, res) => {
  //res.clearCookie('user_id');
  req.session = null;
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

  const newUser = {
    id,
    email,
    password: hashedPassword
  };

  users[newUser.id] = newUser;

  req.session.user_id = newUser.id;
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});