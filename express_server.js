const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs")

//Used to keep track of all the URLs and their shortened forms
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const generateRandomString = function(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
   let charLength = chars.length;
   let result = '';
   for ( var i = 0; i < length; i++ ) {
      result += chars.charAt(Math.floor(Math.random() * charLength));
   }
   return result;
};

app.use(express.urlencoded({ extended: true }));

//res.render("urls_index", templateVars) will take info from urls_index and show it in the browser. In this case, the templateVars, which is an object containing an object.
app.get("/urls", (req, res) => {
  const templateVars = {urls: urlDatabase};
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});


app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  //res.send("Ok"); // Respond with 'Ok' (we will replace this)
  const id = generateRandomString(6);

  //After generating new short URL id, add it to database.
  urlDatabase[id] = req.body.longURL;

  console.log(urlDatabase);
  //Our server then responds with a redirect to /urls/:id.
  res.redirect(`/urls/${id}`);
});


//Our browser then makes a GET request to /urls/:id.
//Using the id, server looks up the longURL from the database,
app.get("/urls/:id", (req, res) => {
  //sends the id and longURL to the urls_show template,
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id]
  };
  //generates the HTML, and then sends this HTML back to the browser.
  //The browser then renders this HTML.
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id]
  res.redirect(longURL);
});

//Add a POST route that removes a URL resource: POST /urls/:id/delete
app.post('/urls/:id/delete', (req, response) => {
  const id = req.params.id
  delete urlDatabase[id];
  response.redirect('/urls');
});


// app.get("/urls/:id", (req, res) => {
//   const id = req.params.id;
//   const longURL = urlDatabase[id];
//   if (longURL) {
//     res.redirect(longURL);
//   } else {
//     res.status(404).send("URL not found");
//   }
// });

// app.get("/", (req, res) => {
//   res.send("Hello!");
// });

// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});