/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

const express = require("express");
const app = express();

const { Todo, User } = require("./models");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const csrf = require("csurf");
const bcrypt = require("bcrypt");
const flash = require("connect-flash");
const saltRounds = 10;

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("Secret_Token"));
app.use(csrf({ cookie: true }));
app.use(flash());

app.set("view engine", "ejs");

const path = require("path");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "my-super-secret-key-21728172615261562",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (username, password, done) => {
      try {
        const user = await User.findOne({ where: { email: username } });
        if (!user) {
          return done(null, false, { message: "Account doesn't exist for this email" });
        }
        const result = await bcrypt.compare(password, user.password);
        if (result) {
          return done(null, user);
        } else {
          return done(null, false, { message: "Invalid password" });
        }
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing user in session", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

app.get("/signup", (req, res) => {
  if (req.accepts("html")) {
    return res.render("signup", {
      csrfToken: req.csrfToken(),
    });
  }
});

app.post("/users", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    if (email.length === 0) {
      req.flash("error", "Email cannot be empty!");
      return res.redirect("/signup");
    }
    if (firstName.length === 0) {
      req.flash("error", "First name cannot be empty!");
      return res.redirect("/signup");
    }
    if (password.length < 8) {
      req.flash("error", "Password length should be minimum 8");
      return res.redirect("/signup");
    }

    const hashedPassword = bcrypt.hashSync(password, saltRounds);
    const user = await User.create({ firstName, lastName, email, password: hashedPassword });
    req.login(user, (err) => {
      if (err) {
        return console.log(err);
      }
      res.redirect("/todos");
    });
  } catch (error) {
    res.status(422).send(error);
  }
});

app.get("/login", (req, res) => {
  if (req.accepts("html")) {
    return res.render("login", {
      csrfToken: req.csrfToken(),
    });
  }
});

app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (request, response) => {
    response.redirect("/todos");
  }
);

app.get("/signout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.get("/", (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect("/todos");
  }
  if (req.accepts("html")) {
    return res.render("index", {
      csrfToken: req.csrfToken(),
    });
  }
});

app.get(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const d = new Date().toISOString().substring(0, 10);
      const userId = request.user.id;
      const todos = await Todo.findAll({ where: { userId } });
      const overdue = todos.filter((item) => item.dueDate < d && !item.completed);
      const duetoday = todos.filter((item) => item.dueDate === d && !item.completed);
      const duelater = todos.filter((item) => item.dueDate > d && !item.completed);
      const completedtodo = todos.filter((item) => item.completed);

      if (request.accepts("html")) {
        return response.render("todo", {
          todos,
          overdue,
          duetoday,
          duelater,
          completedtodo,
          csrfToken: request.csrfToken(),
        });
      } else {
        return response.json({
          todos,
          overdue,
          duetoday,
          duelater,
          completedtodo,
        });
      }
    } catch (error) {
      return response.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.post("/todos", async (req, res) => {
  try {
    if (req.body.title.length === 0) {
      req.flash("error", "Title cannot be empty!");
      return res.redirect("/todos");
    }

    const { title, dueDate } = req.body;
    const userId = req.user.id;

    const todo = await Todo.addTodo({ userId, title, dueDate });
    console.log(todo);
    return res.redirect("/todos");
  } catch (error) {
    console.error(error);
    return res.status(422).json(error);
  }
});

app.put("/todos/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const todo = await Todo.findByPk(id);
    const { completed } = req.body;
    const updatedTodo = await todo.setCompletionStatus(completed);
